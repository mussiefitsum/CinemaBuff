const axios = require('axios');
const User = require('../models/users');

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const key = process.env.TMDB_API_KEY;

module.exports.displayHome = async (req, res) => {
    const trendingMedia = await axios.get(`https://api.themoviedb.org/3/trending/all/day?api_key=${ key }`);
    const popularMovies = await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=${ key }&language=en-US&page=1&region=US`);
    const popularShows = await axios.get(`https://api.themoviedb.org/3/tv/popular?api_key=${ key }&language=en-US&page=1`);
    const trending = trendingMedia.data.results.filter(x => x.media_type !== 'person').slice(0, 6);
    const movies = popularMovies.data.results;
    const shows = popularShows.data.results;
    res.render('home', { trending, movies, shows });
}

module.exports.displayResults = async (req, res) => {
    const query = req.query.q;
    const searchResults = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${ key }&language=en-US&query=${ query }&page=1&include_adult=false&region=US`);
    const results = searchResults.data.results.filter(x => x.media_type !== 'person' && x.poster_path !== null && x.release_date !== '');
    const capitalize = (str) => str[0].toUpperCase() + str.slice(1);
    res.render('search/results', { results, query, capitalize })
}

module.exports.registerForm = (req, res) => {
    res.render('users/register');
}

module.exports.registerUser = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to CinemaBuff!');
            res.redirect('/movie');
        });
    }
    catch (e) {
        req.flash('error', e.message);
        console.log(e);
        res.redirect('/register');
    }
}

module.exports.loginForm = (req, res) => {
    res.render('users/login');
}

module.exports.loginUser = async (req, res) => {
    req.flash('success', 'Welcome Back!')
    const redirectUrl = req.session.returnTo || '/movie';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logoutUser = (req, res) => {
    req.logout();
    req.flash('success', 'Successfully logged out!');
    res.redirect('/movie');
}



