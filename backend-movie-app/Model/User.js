const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
name: {
type: String,
required: true,
},
favMovieList: [{
    movieId: {
        type: Number,
       
    },
    movieName: String

}],
});

const User = mongoose.model("User", UserSchema);

module.exports = User;