const axios = require('axios');
const User = require('../models/users');

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const key = process.env.TMDB_API_KEY;

module.exports.displayWatchlist = async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const { watchlist } = user;
    const collection = [];
    for (let mediaId of watchlist) {
        if (mediaId[0] === 'm') {
            let movie = await axios.get(`https://api.themoviedb.org/3/movie/${ mediaId.slice(1) }?api_key=${ key }&language=en-US`);
            collection.push(movie.data);
        } else {
            let tv = await axios.get(`https://api.themoviedb.org/3/tv/${ mediaId.slice(1) }?api_key=${ key }&language=en-US`);
            collection.push(tv.data);
        }
    }
    res.render('users/watchlist', { collection });
}

module.exports.addToWatchlist = async (req, res) => {
    const { id } = req.params;
    const { media } = req.body;
    const user = await User.findById(id);
    user.watchlist.push(media);
    await user.save();
    req.flash('success', 'Content has been added to your watchlist!');
    res.redirect(`/user/${ id }/watchlist`);
}

module.exports.removeFromWatchlist = async (req, res) => {
    const { id } = req.params;
    const { media } = req.body;
    const user = await User.findById(id);
    user.watchlist = user.watchlist.filter(x => x !== media);
    await user.save();
    req.flash('success', 'Content has been removed from your watchlist!');
    res.redirect(`/user/${ id }/watchlist`);
}