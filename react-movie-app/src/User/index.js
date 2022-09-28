import React, { useEffect, useState } from "react"
import { getLoggedInUser } from "../service/user"
import { BACKEND_API } from '../config';
import Axios from "axios";
import MovieList from "./MovieList";
import { useHistory, withRouter } from "react-router";

function UserDetail() {
    
    const [favMovies, setFavMovies] = useState([])
  
        const loggedInUserFetched = getLoggedInUser()
        const history = useHistory()

        useEffect(()=> {
            getMovies()
        }, [])

        const getMovies = () => {
            Axios({
                method: "GET",
                url: BACKEND_API + '/user/'+loggedInUserFetched,
          
                headers: {
                  "Content-Type": "application/json"
                }
              })
              .then(function (response) {
                if(response.data) {
                  
                        console.log(response.data)
                      setFavMovies(response.data.favMovieList)
                    
                }
                
              })
              .catch(function (error) {
            
                console.log(error);
              }); 
        }


       const onViewClick = (movieId) => {
            history.push("/"+movieId)
        }

        const onRemove = (id) => {
            Axios({
                method: "DELETE",
                url: BACKEND_API + "/user/" + loggedInUserFetched + "/remove-movie/"+ id,
                headers: {
                  "Content-Type": "application/json"
                }
              })
              .then(function (response) {
                if(response.status === 200) {
                    getMovies()
                        
                    
                }
                
              })
              .catch(function (error) {
            
                console.log(error);
              }); 
        }
      

    return (
        <div style={{margin: "20px 0 0 30px"}}>
           {loggedInUserFetched ?  <>
            <h3>Hello, {loggedInUserFetched}</h3>
            {favMovies.length > 0 ? 
            <>
 <p>Your fav movies are: </p>
 <MovieList movies={favMovies} onViewClick={onViewClick} onRemove={onRemove} />
            </>
            : "You do not have added fav movies yet"}
           
           </>
           :  "Login first"}
            </div>
    )
}

export default withRouter(UserDetail)