const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportLocalMongoose = require('passport-local-mongoose')

const userSchema = Schema({
    email: {
        type: String,
        require: true,
        unique: true
    },

    username: {
        type: String,
        require: true,
        unique: true
    },

    watchlist: {
        type: [String]
    }
})

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);