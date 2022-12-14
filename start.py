import time

import boto3
from botocore.exceptions import ClientError


################################################################################################
#
# Configuration Parameters
#
################################################################################################

# print("!!!!!!!! You cannot use Auto Scaling Group in AWS Educate Account !!!!!!!!")
# exit(-1)

# place your credentials in ~/.aws/credentials, as mentioned in AWS Educate Classroom,
# Account Details, AWC CLI -> Show (Copy and paste the following into ~/.aws/credentials)

# changed to use us-east, to be able to use AWS Educate Classroom
region = 'us-east-1'
availabilityZone1 = 'us-east-1a'
availabilityZone2 = 'us-east-1b'
availabilityZone3 = 'us-east-1c'
# region = 'eu-central-1'
# availabilityZone = 'eu-central-1b'

# AMI ID of Amazon Linux 2 image 64-bit x86 in us-east-1 (can be retrieved, e.g., at
# https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#LaunchInstanceWizard:)
# TODO update to recent version of Amazon Linux 2 AMI?
imageId = 'ami-0d5eff06f840b45e9'
# for eu-central-1, AMI ID of Amazon Linux 2 would be:
# imageId = 'ami-0cc293023f983ed53'

# potentially change instanceType to t2.micro for "free tier" if using a regular account
# for production, t3.nano seams better
# as of SoSe 2022 t2.nano seams to be a bit too low on memory, mariadb first start can fail
# due to innodb cache out of memory, therefore t2.micro or swap in t2.nano currently recommended
# instanceType = 't2.nano'
instanceType = 't2.micro'

# keyName = 'srieger-pub'
keyName = 'vockey'

# see, e.g., AWS Academy Lab readme, or "aws iam list-instance-profiles | grep InstanceProfileName"
# for roles see: "aws iam list-roles | grep RoleName"
iamRole = 'LabInstanceProfile'


################################################################################################
#
# boto3 code
#
################################################################################################


client = boto3.setup_default_session(region_name=region)
ec2Client = boto3.client("ec2")
ec2Resource = boto3.resource('ec2')

elbv2Client = boto3.client('elbv2')
asClient = boto3.client('autoscaling')

# if you only have one VPC, vpc_id can be retrieved using:
response = ec2Client.describe_vpcs()
vpc_id = response.get('Vpcs', [{}])[0].get('VpcId', '')
# if you have more than one VPC, vpc_id should be specified, and code
# top retrieve VPC id below needs to be commented out
# vpc_id = 'vpc-eedd4187'

subnet_id1 = ec2Client.describe_subnets(
    Filters=[
        {
            'Name': 'availability-zone', 'Values': [availabilityZone1]
        }
    ])['Subnets'][0]['SubnetId']

subnet_id2 = ec2Client.describe_subnets(
    Filters=[
        {
            'Name': 'availability-zone', 'Values': [availabilityZone2]
        }
    ])['Subnets'][0]['SubnetId']

subnet_id3 = ec2Client.describe_subnets(
    Filters=[
        {
            'Name': 'availability-zone', 'Values': [availabilityZone3]
        }
    ])['Subnets'][0]['SubnetId']


print("Deleting old auto scaling group...")
print("------------------------------------")

try:
    response = asClient.delete_auto_scaling_group(AutoScalingGroupName='movie-app-asg-autoscalinggroup', ForceDelete=True)
except ClientError as e:
    print(e)

print("Deleting old launch configuration...")
print("------------------------------------")

try:
    response = asClient.delete_launch_configuration(LaunchConfigurationName='movie-app-asg-launchconfig')
except ClientError as e:
    print(e)



print("Deleting old instances...")
print("------------------------------------")

response = ec2Client.describe_instances(Filters=[{'Name': 'tag-key', 'Values': ['movie-app-asg']}])
print(response)
reservations = response['Reservations']
for reservation in reservations:
    for instance in reservation['Instances']:
        if instance['State']['Name'] == "running":
            response = ec2Client.terminate_instances(InstanceIds=[instance['InstanceId']])
            print(response)
            instanceToTerminate = ec2Resource.Instance(instance['InstanceId'])
            instanceToTerminate.wait_until_terminated()


print("Deleting old load balancer and deps...")
print("------------------------------------")

try:
    response = elbv2Client.describe_load_balancers(Names=['movie-app-asg-loadbalancer'])
    loadbalancer_arn = response.get('LoadBalancers', [{}])[0].get('LoadBalancerArn', '')
    response = elbv2Client.delete_load_balancer(LoadBalancerArn=loadbalancer_arn)

    waiter = elbv2Client.get_waiter('load_balancers_deleted')
    waiter.wait(LoadBalancerArns=[loadbalancer_arn])
except ClientError as e:
    print(e)

try:
    response = elbv2Client.describe_target_groups(Names=['movie-app-asg-targetgroup'])
    while len(response.get('TargetGroups', [{}])) > 0:
        targetgroup_arn = response.get('TargetGroups', [{}])[0].get('TargetGroupArn', '')
        try:
            response = elbv2Client.delete_target_group(TargetGroupArn=targetgroup_arn)
        except ClientError as e:
            print(e)
        response = elbv2Client.describe_target_groups(Names=['movie-app-asg-targetgroup'])
        time.sleep(5)
except ClientError as e:
    print(e)

print("Delete old security group...")
print("------------------------------------")

try:
    response = ec2Client.describe_security_groups(Filters=[{'Name': 'group-name', 'Values': ['movie-app-asg']}])
    while len(response.get('SecurityGroups', [{}])) > 0:
        security_group_id = response.get('SecurityGroups', [{}])[0].get('GroupId', '')
        try:
            response = ec2Client.delete_security_group(GroupName='movie-app-asg')
        except ClientError as e:
            print(e)
        response = ec2Client.describe_security_groups(Filters=[{'Name': 'group-name', 'Values': ['movie-app-asg']}])
        time.sleep(5)
except ClientError as e:
    print(e)

print("Create security group...")
print("------------------------------------")

try:
    response = ec2Client.create_security_group(GroupName='movie-app-asg',
                                               Description='movie-app-asg',
                                               VpcId=vpc_id)
    security_group_id = response['GroupId']
    print('Security Group Created %s in vpc %s.' % (security_group_id, vpc_id))

    data = ec2Client.authorize_security_group_ingress(
        GroupId=security_group_id,
        IpPermissions=[
             {'IpProtocol': 'tcp',
             'FromPort': 27017,
             'ToPort': 27017,
             'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
             {'IpProtocol': 'tcp',
             'FromPort': 4000,
             'ToPort': 4000,
             'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
            {'IpProtocol': 'tcp',
             'FromPort': 22,
             'ToPort': 22,
             'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
            {'IpProtocol': 'tcp',
             'FromPort': 80,
             'ToPort': 80,
             'IpRanges': [{'CidrIp': '0.0.0.0/0'}]},
            {'IpProtocol': 'tcp',
             'FromPort': 443,
             'ToPort': 443,
             'IpRanges': [{'CidrIp': '0.0.0.0/0'}]}
        ])
    print('Ingress Successfully Set %s' % data)
except ClientError as e:
    print(e)

print("Running new DB instance...")
print("------------------------------------")

userDataDB = ('#!/bin/bash\n'
              '# extra repo for RedHat rpms\n'
              'yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm\n'
              '# essential tools\n'
              'yum install -y joe htop git\n'
              '# mongodb\n'
              'yup -y install mongodb'
              '\n'
              'wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -'
              '\n'
              'echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list'
              '\n'
              'apt-get update'
              '\n'
              'apt-get install -y mongodb-org'
              '\n'
              'systemctl start mongod'
              '\n'
              )
# convert user-data from script with: cat install-mysql | sed "s/^/'/; s/$/\\\n'/"

response = ec2Client.run_instances(
    ImageId=imageId,
    InstanceType=instanceType,
    Placement={'AvailabilityZone': availabilityZone1, },
    KeyName=keyName,
    MinCount=1,
    MaxCount=1,
    UserData=userDataDB,
    SecurityGroupIds=[
        security_group_id,
    ],
    TagSpecifications=[
        {
            'ResourceType': 'instance',
            'Tags': [
                {'Key': 'Name', 'Value': 'movie-app-asg-db1'},
                {'Key': 'movie-app-asg', 'Value': 'db'}
            ],
        }
    ],
)

instanceIdDB = response['Instances'][0]['InstanceId']
privateIpDB = response['Instances'][0]['PrivateIpAddress']
# privateIpDB = response['Instances'][0]['NetworkInterfaces'][0]['NetworkInterfaceId']

instance = ec2Resource.Instance(instanceIdDB)
instance.wait_until_running()

print(instanceIdDB)

userDataWebServer = ('#!/bin/bash\n'
                     '# extra repo for RedHat rpms\n'
                     'yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm\n'
                     '# essential tools\n'
                     'yum install -y joe htop git\n'
                     '\n'
                     'cat <<EOF | tee /etc/yum.repos.d/mongodb.repo\n[mongodb-org-4.4]\nname=MongoDB Repository\nbaseurl=https://repo.mongodb.org/yum/redhat/8/mongodb-org/4.4/x86_64/\ngpgcheck=1\nenabled=1\ngpgkey=https://www.mongodb.org/static/pgp/server-4.4.asc\nEOF',
                     '\n'
                     'echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu-bionic/mongodb-org/6.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-6.0.list',
                     '\n'
                     'apt-get update'
                     '\n'
                     'apt-get install -y mongodb-org',
                     '\n'
                     'systemctl start mongod',
                     '\n'
                     'wget https://github.com/dipeshchau/cloud-computing-grp-12.git'
                     '\n'
                     'cd backend-movie-app'
                     '\n'
                     'npm install'
                     '\n'
                     'npm start'
                     )

# userDataWebServer = ('#!/bin/bash\n'
#                      '# extra repo for RedHat rpms\n'
#                      'yum install -y https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm\n'
#                      '# essential tools\n'
#                      'yum install -y joe htop git\n'
#                      '# mongodb\n'
#                      'yum install -y nodejs mongodb\n'
#                      '\n'
#                      'wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -',
#                      '\n'
#                      'echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu-bionic/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list',
#                      '\n'
#                      'sudo apt-get update'
#                      '\n'
#                      'sudo apt-get install -y mongodb-org',
#                      '\n'
#                      'systemctl start mongod',
#                      '\n'
#                      'wget https://github.com/dipeshchau/cloud-computing-grp-12.git'
#                      '\n'
#                      'cd backend-movie-app'
#                      '\n'
#                      'npm install'
#                      '\n'
#                      'npm start'
#                      )

print("Creating launch configuration...")
print("------------------------------------")

response = asClient.create_launch_configuration(
    #IamInstanceProfile='my-iam-role',
    IamInstanceProfile=iamRole,
    ImageId=imageId,
    InstanceType=instanceType,
    LaunchConfigurationName='movie-app-asg-launchconfig',
    UserData=userDataWebServer,
    KeyName=keyName,
    SecurityGroups=[
        security_group_id,
    ],
)
print(response)
print(type(response))

elbv2Client = boto3.client('elbv2')

print("Creating load balancer...")
print("------------------------------------")

response = elbv2Client.create_load_balancer(
    Name='movie-app-asg-loadbalancer',
    Subnets=[
        subnet_id1,
        subnet_id2,
        subnet_id3,
    ],
    SecurityGroups=[
        security_group_id
    ]
)

loadbalancer_arn = response.get('LoadBalancers', [{}])[0].get('LoadBalancerArn', '')
loadbalancer_dns = response.get('LoadBalancers', [{}])[0].get('DNSName', '')

print("Creating target group...")
print("------------------------------------")

response = elbv2Client.create_target_group(
    Name='movie-app-asg-targetgroup',
    Port=80,
    Protocol='HTTP',
    VpcId=vpc_id,
)

targetgroup_arn = response.get('TargetGroups', [{}])[0].get('TargetGroupArn', '')

print("Creating listener...")
print("------------------------------------")

response = elbv2Client.create_listener(
    DefaultActions=[
        {
            'TargetGroupArn': targetgroup_arn,
            'Type': 'forward',
        },
    ],
    LoadBalancerArn=loadbalancer_arn,
    Port=80,
    Protocol='HTTP',
)

response = elbv2Client.modify_target_group_attributes(
    TargetGroupArn=targetgroup_arn,
    Attributes=[
        {
            'Key': 'stickiness.enabled',
            'Value': 'true'
        },
    ]
)

print("Creating auto scaling group...")
print("------------------------------------")

response = asClient.create_auto_scaling_group(
    AutoScalingGroupName='movie-app-asg-autoscalinggroup',
    LaunchConfigurationName='movie-app-asg-launchconfig',
    MaxSize=3,
    MinSize=1,
    HealthCheckGracePeriod=120,
    HealthCheckType='ELB',
    TargetGroupARNs=[
        targetgroup_arn,
    ],
    VPCZoneIdentifier=subnet_id1 + ', ' + ', ' + subnet_id2 + ', ' + subnet_id3,
    Tags=[
        {'Key': 'Name', 'Value': 'movie-app-asg-webserver', 'PropagateAtLaunch': True},
        {'Key': 'movie-app', 'Value': 'webserver', 'PropagateAtLaunch': True}
    ],
)

print(loadbalancer_arn)
print(targetgroup_arn)
print('app/movie-app-asg-loadbalancer/'+str(loadbalancer_arn).split('/')[3]+'/targetgroup/movie-app-asg-targetgroup/'+str(targetgroup_arn).split('/')[2])

print('If target group is not found, creation was delayed in AWS Academy lab, need to add a check that target group is'
      'existing before executing the next lines in the future... If the error occurs, rerun script...')

response = asClient.put_scaling_policy(
    AutoScalingGroupName='movie-app-asg-autoscalinggroup',
    PolicyName='movie-app-asg-scalingpolicy',
    PolicyType='TargetTrackingScaling',
    EstimatedInstanceWarmup=30,
    TargetTrackingConfiguration={
        'PredefinedMetricSpecification': {
            'PredefinedMetricType': 'ALBRequestCountPerTarget',
            'ResourceLabel': 'app/movie-app-asg-loadbalancer/'+str(loadbalancer_arn).split('/')[3]+'/targetgroup/movie-app-asg-targetgroup/'+str(targetgroup_arn).split('/')[2]
        },
        'TargetValue': 5.0,
    }
)

print('Load Balancer should be reachable at: http://' + loadbalancer_dns)

print('As always, you need to wait some time, until load balancer is provisioned, instances are healthy (cloud-init '
      'did its job as specified in the launch configuration). ')

print('You can use "aws elbv2 ..." commands or the web console to examine the current state. Take a look at Load'
      'Balancer, Target Group, Auto Scaling Group and esp. Monitoring of the Load Balancer and related Cloud Watch'
      'alarms.')

print('If you "pull" a lot of clouds in the game, generating a lot of requests, you will see the alarm being fired and'
      'further instances started (scale-out) (involves some clicking for about three minutes). After 15 min of idling,'
      'instances will automatically be stopped (scale-in).')