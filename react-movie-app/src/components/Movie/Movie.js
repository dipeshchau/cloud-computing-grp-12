import React, { Component } from 'react';
import { API_URL, API_KEY } from '../../config';
import Navigation from '../elements/Navigation/Navigation';
import MovieInfo from '../elements/MovieInfo/MovieInfo';
import MovieInfoBar from '../elements/MovieInfoBar/MovieInfoBar';
import FourColGrid from '../elements/FourColGrid/FourColGrid.js';
import Actor from '../elements/Actor/Actor';
import Spinner from '../elements/Spinner/Spinner';
import './Movie.css';
import { getLoggedInUser } from "../../service/user"
import { BACKEND_API } from '../../config';
import Axios from "axios";

class Movie extends Component {
  state = {
    movie: null,
    actors: null,
    directors: [],
    loading: false
  }

  componentDidMount() {
    // ES6 destructuring the props
    const { movieId } = this.props.match.params;

    if (localStorage.getItem(`${movieId}`)) {
      let state = JSON.parse(localStorage.getItem(`${movieId}`))
      this.setState({ ...state })
    } else {
      this.setState({ loading: true })
      // First fetch the movie ...
      let endpoint = `${API_URL}movie/${movieId}?api_key=${API_KEY}&language=en-US`;
      this.fetchItems(endpoint);
    }
  }

  fetchItems = (endpoint) => {
    // ES6 destructuring the props
    const { movieId } = this.props.match.params;

    fetch(endpoint)
    .then(result => result.json())
    .then(result => {

      if (result.status_code) {
        // If we don't find any movie
        this.setState({ loading: false });
      } else {
        this.setState({ movie: result }, () => {
          // ... then fetch actors in the setState callback function
          let endpoint = `${API_URL}movie/${movieId}/credits?api_key=${API_KEY}`;
          fetch(endpoint)
          .then(result => result.json())
          .then(result => {

            const directors = result.crew.filter( (member) => member.job === "Director");

            this.setState({
              actors: result.cast,
              directors,
              loading: false
            }, () => {
              localStorage.setItem(`${movieId}`, JSON.stringify(this.state));
            })
          })
        })
      }
    })
    .catch(error => console.error('Error:', error))
  }


  addToFav = () => {
    const { movie, } = this.state;
    const { movieId } = this.props.match.params;
    const loggedInUserFetched = getLoggedInUser()
    const input = {
      movieName: movie ? movie.original_title : "",
      movieId,
      user: loggedInUserFetched,
    }
   
      Axios({
          method: "POST",
          url: BACKEND_API + '/movies/add-fav',
          data: input,
          headers: {
            "Content-Type": "application/json"
          }
        })
        .then(function (response) {
          if(response.status === 200) {
            alert("Added successfully")
                  
                
              
          }
          
        })
        .catch(function (error) {
      
          console.log(error);
        }); 

  }

  render() {
    // ES6 Destructuring the props and state
    const { movieName } = this.props.location;
    const { movie, directors, actors, loading } = this.state;

    return (
      <div className="rmdb-movie">
        {movie ?
        <div>
          <Navigation movie={movieName} />
          <MovieInfo movie={movie} directors={directors} />
          <MovieInfoBar time={movie.runtime} budget={movie.budget} revenue={movie.revenue} />
        </div>
        : null }
        <div style={{ margin: "10px 0 0 30px",  }}>
          <button
          onClick={()=>this.addToFav()}
          style={{ fontSize: "1rem", padding: "0.375rem 0.75rem",
           backgroundColor: "green", color: "white"  ,border: "1px solid ",borderRadius: 
           "0.25rem", cursor: "pointer"}}>
             Add to Fav
             </button>
        </div>
        {actors ?
        <div className="rmdb-movie-grid">
          <FourColGrid header={'Actors'}>
            {actors.map( (element, i) => (
              <Actor key={i} actor={element} />
            ))}
          </FourColGrid>
        </div>
        : null }
        {!actors && !loading ? <h1>No movie found</h1> : null }
        {loading ? <Spinner /> : null}
      </div>
    )
  }
}

export default Movie;