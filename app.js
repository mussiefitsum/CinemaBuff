if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const axios = require('axios');
const ejsMate = require('ejs-mate');
const path = require('path');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;

const User = require('./models/users')

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/CinemaBuff');
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected')
});

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

const key = process.env.TMDB_API_KEY;

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.get('/', async (req, res) => {
    res.send('Home');
});

app.get('/movies', async (req, res) => {
    const discoverOne = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${ key }&language=en-US&region=US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_watch_monetization_types=flatrate`);
    const discoverTwo = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${ key }&language=en-US&region=US&sort_by=popularity.desc&include_adult=false&include_video=false&page=2&with_watch_monetization_types=flatrate`);
    const movies = discoverOne.data.results;
    const pageTwo = discoverTwo.data.results;
    movies.push(...pageTwo);
    res.render('movies/index', { movies });
});

app.get('/tv', async (req, res) => {
    const discoverOne = await axios.get(`https://api.themoviedb.org/3/discover/tv?api_key=${ key }&language=en-US&sort_by=popularity.desc&page=1&timezone=America%2FNew_York&include_null_first_air_dates=false&watch_region=US&with_watch_monetization_types=flatrate`);
    const discoverTwo = await axios.get(`https://api.themoviedb.org/3/discover/tv?api_key=${ key }&language=en-US&sort_by=popularity.desc&page=2&timezone=America%2FNew_York&include_null_first_air_dates=false&watch_region=US&with_watch_monetization_types=flatrate`)
    const shows = discoverOne.data.results;
    const pageTwo = discoverTwo.data.results;
    shows.push(...pageTwo);
    res.render('tv/index', { shows });
});

app.get('/movies/:id', async (req, res) => {
    const { id } = req.params;
    const movieDetails = await axios.get(`https://api.themoviedb.org/3/movie/${ id }?api_key=${ key }&language=en-US`);
    const movieCredits = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/credits?api_key=${ key }&language=en-US`);
    const movieAgeRating = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/release_dates?api_key=${ key }`);
    const movieVideos = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/videos?api_key=${ key }&language=en-US`);
    const similarMovies = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/similar?api_key=${ key }&language=en-US&page=1`);
    const recommendedMovies = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/recommendations?api_key=${ key }&language=en-US&page=1`);
    const cast = movieCredits.data.cast;
    const crew = movieCredits.data.crew;
    const movie = movieDetails.data;
    const similarTitles = similarMovies.data.results;
    const recommendations = recommendedMovies.data.results;
    const videos = movieVideos.data.results;
    const ageRating = movieAgeRating.data.results.filter(x => x.iso_3166_1 === 'US').map(x => x.release_dates).flat();
    const genres = movieDetails.data.genres.map(x => x.name);
    const directors = crew.filter(x => x.job === 'Director').map(x => x.name);
    const writers = crew.filter(x => x.job === 'Writer').map(x => x.name);
    const movieRuntime = (movie.runtime / 60).toString();
    res.render('movies/details', { movie, cast, crew, directors, writers, genres, ageRating, movieRuntime, videos, similarTitles, recommendations });
});

app.get('/tv/:id', async (req, res) => {
    const { id } = req.params;
    const tvDetails = await axios.get(`https://api.themoviedb.org/3/tv/${ id }?api_key=${ key }&language=en-US`);
    const tvAgeRating = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/content_ratings?api_key=${ key }&language=en-US`);
    const credits = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/credits?api_key=${ key }&language=en-US`);
    const tvVideos = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/videos?api_key=${ key }&language=en-US`);
    const similarShows = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/similar?api_key=${ key }&language=en-US&page=1`);
    const recommendedShows = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/recommendations?api_key=${ key }&language=en-US&page=1`);
    const show = tvDetails.data;
    const cast = credits.data.cast;
    const videos = tvVideos.data.results
    const ratings = tvAgeRating.data.results
    const similars = similarShows.data.results;
    const recommendations = recommendedShows.data.results;
    let rating = ratings.find(x => x.iso_3166_1 === 'US');
    if (rating === undefined) {
        rating = ratings.pop().rating;
    } else {
        rating = rating.rating;
    }
    const genres = tvDetails.data.genres.map(x => x.name).join(', ');
    const runTime = Math.round(show.episode_run_time.reduce((a, b) => a + b) / show.episode_run_time.length);
    res.render('tv/details', { show, rating, genres, cast, videos, runTime, similars, recommendations })
})

app.get('/register', async (req, res) => {
    res.render('users/register');
})

app.listen(3000, () => {
    console.log('Listening on Port 3000');
});