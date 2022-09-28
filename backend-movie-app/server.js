const express = require('express')
//const graphqlHTTP = require('express-graphql').graphqlHTTP

const mongoose = require("mongoose")
//const {schema, root} = require("./schema")
// const schema = require("./schema/User")
const cors = require("cors");
const {login,getDetail,addFavMovie,removeFavMovie} = require("./services")
const bodyParser= require('body-parser')
const path = require("path")

require('dotenv').config()
    

const connectionString = process.env.MONGO_URI;
const PORT = process.env.PORT || 4000

//const schema = new graphql.GraphQLSchema({ query: QueryRoot });
    
const app = express();

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
      mongoose.connect(connectionString,{ useNewUrlParser: true }, function (err) { 
        if (err) throw err; console.log('Successfully connected'); });
        app.use('*', cors());

        app.use(express.static("build"));
      // app.use('/graphql', cors(),  graphqlHTTP({
      //  // schema: schema,
      // //schema: schema,
      // // rootValue: root,
      // schema: schema,
      // rootValue: global,
      //   graphiql: true,
      // }));##

      app.use(express.static(path.join(__dirname, '/build/')));
      
      app.post("/api/login", 
        login
      
      )
      app.get("/api/user/:name", 
      getDetail
      
      )
      app.post("/api/movies/add-fav", addFavMovie)
      app.delete("/api/user/:user/remove-movie/:id",removeFavMovie)
      app.listen(PORT, ()=> {
          console.log("Server listening in PORT ",PORT )
      });
    
 
  

