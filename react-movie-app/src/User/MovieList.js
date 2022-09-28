import React from "react"

function MovieList({movies, onViewClick, onRemove}) {
    
    return (
        <>
<ul>
    {movies && movies.map((i)=>{
        return (
            <li style={{margin: "0 0 8px 0"}} key={i._id}>{i.movieName}
            <span onClick={()=>onViewClick(i.movieId)} style={{ cursor:"pointer", margin: "0 10px", color: "blue" }}>View Detail</span>
            <span onClick={()=>onRemove(i._id)} style={{ cursor:"pointer", margin: "0 10px", color: "red" }}>Remove</span>
            </li>
        )
    })}
</ul>
        </>
    )
}

export default MovieList