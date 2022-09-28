import React, { useEffect, useState } from "react"
import { BACKEND_API } from '../../config';
import Axios from "axios";
import { getLoggedInUser, setLoggedInUser } from "../../service/user";
import { withRouter, useHistory } from 'react-router-dom';

function LoginPage() {
const [uname, setUname] = useState("")
const [msg,setMsg] = useState("")
const history = useHistory()
const [user,setUser] = useState(null)

const onLoginSubmit = async (e) => {
    e.preventDefault()
    Axios({
        method: "POST",
        url: BACKEND_API + '/login',
        data: {name: uname},
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then(function (response) {
        if(response.data) {
            if(response.data.name) {
                setLoggedInUser(response.data.name)
                handleMsg(true)
            }
        }
        
      })
      .catch(function (error) {
        handleMsg()
        console.log(error);
      }); 
}



useEffect(()=> {
const loggedInUserFetched = getLoggedInUser()
setUser(loggedInUserFetched)
}, [])

const handleMsg = (isSuccess= false) => {
    setMsg(isSuccess ? "Success" : "Failed")
    setTimeout(()=> {
        setMsg("")
        if(isSuccess) {
            history.push("/")
            window.location.reload();
        }
    }, 3000)
}

    return (
        <>
        {user ? "Already logged in" :
<div style={{margin: "10px 0 0 30px"}}>
<h3>Login Page</h3>
<div>
    <form onSubmit={(e)=>onLoginSubmit(e)}>
        <label>Name: </label>
        <input name="uname" value={uname} required onChange={(e)=> setUname(e.target.value)} placeholder="Enter name" />
      

        <button style={{marginLeft: "20px", backgroundColor:"green", color: "white"}} type="submit">Go</button>
    </form>
    <p style={{ color: msg === "Success" ? "green" : "red" }}>{msg}</p>
</div>
</div>
}
        </>
    )
}

export default withRouter(LoginPage)