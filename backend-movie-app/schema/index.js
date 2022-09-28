// const { buildSchema } = require('graphql');
// const User = require('../Model/User');

// const schema = buildSchema(`
//   type User {
//     name: String
//   }
//   type Query {
//     loginUser(name: String) : User
//   }
// `);

// const queryDB = (req, sql, args) => new Promise((resolve, reject) => {
//     req.mysqlDb.query(sql, args, (err, rows) => {
//         if (err)
//             return reject(err);
//         rows.changedRows || rows.affectedRows || rows.insertId ? resolve(true) : resolve(rows);
//     });
// });



// const root = {
//     getUsers: (args, req) => queryDB(req, "select * from users").then(data => data),
//   login: async (args, req) => {
//       try {
//         const {name} = args
//         const isAlreadySaved = await User.findOne({name: name}).lean()
//         if(isAlreadySaved) {
//             return isAlreadySaved
//         } else {
//             const newUser = new User({name:name})
//             const saveRes = await newUser.save()
//             return saveRes
//         }
//       } catch(e) {
//           throw e
//       }
//   },
//   };


  


//   module.exports = {root,schema}