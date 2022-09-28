// var GraphQLSchema = require('graphql').GraphQLSchema;
// var GraphQLObjectType = require('graphql').GraphQLObjectType;
// var GraphQLList = require('graphql').GraphQLList;
// var GraphQLObjectType = require('graphql').GraphQLObjectType;
// var GraphQLNonNull = require('graphql').GraphQLNonNull;
// var GraphQLID = require('graphql').GraphQLID;
// var GraphQLString = require('graphql').GraphQLString;
// var GraphQLInt = require('graphql').GraphQLInt;

// const User = require("../Model/User")
// const graphql = require('graphql')


// var userType = new GraphQLObjectType({
//     name: 'user',
//     fields: function () {
//       return {
//         _id: {
//           type: GraphQLString
//         },
      
//        name: {
//           type: GraphQLString
//         },
//         favMovieList: {
//             type: new GraphQLList(GraphQLInt)
//         }
     
//       }
//     }
//   });

//   const QueryRoot = new graphql.GraphQLObjectType({
//     name: 'Query',
//     fields: () => ({
//       hello: {
//         type: graphql.GraphQLString,
//         resolve: () => "Hello world!"
//       },
//       users: {
//         type: new GraphQLList(userType),
//         resolve: function () {
//           const users = User.find().exec()
//           if (!users) {
//             throw new Error('Error')
//           }
//           return users
//         }
//       },
//       findUser: {
//         type: userType,
//         args: {
//             name: {
//                 type: new GraphQLNonNull(GraphQLString)
//             }
//           },
//           resolve: async function (root,params) {
//             const {name} = params
//             const userData= await User.findOne({name: name})
//             if(!userData) {
//                 throw new Error('Error. User not found');
//             } else {
//                 return userData
//             }
//           }
//       }
//     })
//   })
  


//   var mutation = new GraphQLObjectType({
//     name: 'Mutation',
//     fields: function () {
//       return {
//         login: {
//           type: userType,
//           args: {
//             name: {
//               type: new GraphQLNonNull(GraphQLString)
//             },
//           },
//           resolve: async function (root, params) {
//             const {name} = params
//             console.log("here")
//             const isAlreadySaved = await User.findOne({name: name})
//             if(isAlreadySaved) {
//                 return isAlreadySaved
//             } else {
//                 const newUser = new User({name:name})
//                 const saveRes = await newUser.save()
//                 if (!saveRes) {
                   
//                     throw new Error('Error');
//                   }
//                 return saveRes
//             }
//           }
//         },

//         addFavMovie: {
//             type: userType,
//             args: {
//               movieId: {
//                 type: new GraphQLNonNull(GraphQLInt)
//               },
//               name: {
//                 type: new GraphQLNonNull(GraphQLString)
//               },
//             },
//             resolve: async function (root, params) {
//               const {movieId, name} = params
//               const isAlreadySaved = await User.findOne({name: name})
//               if(!isAlreadySaved) {
//                   throw new Error("User not found")
//               } else {
//                   const updateRes = await User.findOneAndUpdate({
//                       name: name,
//                       favMovieList: { "$ne": movieId }
//                   }, {
//                       $push: {
//                         favMovieList: movieId
//                       }
//                   }, {new:true})
//                   if (!updateRes) {
//                     throw new Error('Error. May be movie already saved');
//                   }
//                 return updateRes
//               }
//             }
//         },


//         removeFavMovie: {
//             type: userType,
//             args: {
//               movieId: {
//                 type: new GraphQLNonNull(GraphQLInt)
//               },
//               name: {
//                 type: new GraphQLNonNull(GraphQLString)
//               },
//             },
//             resolve: async function (root, params) {
//               const {movieId, name} = params
//               const isAlreadySaved = await User.findOne({name: name})
//               if(!isAlreadySaved) {
//                   throw new Error("User not found")
//               } else {
//                   const updateRes = await User.findOneAndUpdate({
//                       name: name,
//                   }, {
//                       $pull: {
//                         favMovieList: movieId
//                       }
//                   }, {new:true})
//                   if (!updateRes) {
//                     throw new Error('Error.');
//                   }
//                 return updateRes
//               }
//             }
//         }
       
//       }
//     }
//   });

//   module.exports = new GraphQLSchema({ query: QueryRoot,mutation: mutation});