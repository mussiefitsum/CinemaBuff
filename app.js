if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const axios = require('axios');
const ejsMate = require('ejs-mate')
const path = require('path')

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

const key = process.env.TMDB_API_KEY;


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
    const similarMovies = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/similar?api_key=${ key }&language=en-US&page=1`)
    const cast = movieCredits.data.cast;
    const crew = movieCredits.data.crew;
    const movie = movieDetails.data;
    const similarTitles = similarMovies.data.results;
    const ageRating = movieAgeRating.data.results.filter(x => x.iso_3166_1 === 'US').map(x => x.release_dates).flat();
    const genres = movieDetails.data.genres.map(x => x.name);
    const directors = crew.filter(x => x.job === 'Director').map(x => x.name);
    const writers = crew.filter(x => x.job === 'Writer').map(x => x.name);
    const movieRuntime = (movie.runtime / 60).toString();
    const videos = movieVideos.data.results;
    res.render('movies/details', { movie, cast, crew, directors, writers, genres, ageRating, movieRuntime, videos, similarTitles });
});

app.listen(3000, () => {
    console.log('Listening on Port 3000');
});