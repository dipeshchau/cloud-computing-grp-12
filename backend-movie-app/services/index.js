const User = require("../Model/User")

const login = async (req,res) => {
    const {name} = req.body
    const isAlreadySaved = await User.findOne({name: name})
    if(isAlreadySaved) {
        return res.status(200).json({name:isAlreadySaved.name})
    } else {
        const newUser = new User({name:name})
        const saveRes = await newUser.save()
       
        return res.status(200).json({name:saveRes.name })
    }
}

const getDetail = async (req,res) => {
    const {name} = req.params
    const isAlreadySaved = await User.findOne({name: name})
    if(isAlreadySaved) {
        return res.status(200).json({name:isAlreadySaved.name, favMovieList:isAlreadySaved.favMovieList })
    } else {
        return res.status(400).json("NO User")
    }
}

const addFavMovie = async (req,res) => {
    const {user, movieId, movieName} = req.body
console.log(req.body)
    const isAlreadySaved = await User.findOne({name: user})
    if(!isAlreadySaved) {
        return res.status(400).json("NO User found")
    } else {
        const updateRes = await User.findOneAndUpdate({
            name: user,
           
        }, {
            $push: {
              favMovieList: {
                  movieId, 
                  movieName
              }
            }
        }, {new:true})
        if (!updateRes) {
            return res.status(400).json('Error. May be movie already saved')
       
        }
        return res.status(200).json("OK")
    }
}

const removeFavMovie = async (req,res) => {
    const {id, user} = req.params

    const isAlreadySaved = await User.findOne({name: user})
    if(!isAlreadySaved) {
        return res.status(400).json("NO User found")
    } else {
        const updateRes = await User.findOneAndUpdate({
            name: user,
           
        }, {
            $pull: {
              favMovieList: {
                  _id: id
              }
            }
        }, {new:true})
        if (!updateRes) {
            return res.status(400).json('Error. May be movie already saved')
       
        }
        return res.status(200).json("OK")
    }
}

module.exports = {login,getDetail,addFavMovie,removeFavMovie}