if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const session = require('express-session');
const app = express();
const axios = require('axios');
const ejsMate = require('ejs-mate');
const path = require('path');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const catchAsync = require('./utility/catchAsync');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

const User = require('./models/users');
const Review = require('./models/reviews')

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

const secret = 'topsecret15'

const store = MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/CinemaBuff',
    secret,
    touchAfter: 24 * 60 * 60
});

const sessionConfig = {
    store,
    name: 'sess1500',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(methodOverride('_method'))
app.use(flash());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

const key = process.env.TMDB_API_KEY;

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'Need to be logged in!');
        return res.redirect('/login');
    }
    next();
}


app.get('/', async (req, res) => {
    res.send('Home');
});

app.get('/movie', catchAsync(async (req, res) => {
    const discoverOne = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${ key }&language=en-US&region=US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_watch_monetization_types=flatrate`);
    const discoverTwo = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${ key }&language=en-US&region=US&sort_by=popularity.desc&include_adult=false&include_video=false&page=2&with_watch_monetization_types=flatrate`);
    const movies = discoverOne.data.results;
    const pageTwo = discoverTwo.data.results;
    movies.push(...pageTwo);
    res.render('movies/index', { movies });
}));

app.get('/tv', catchAsync(async (req, res) => {
    const discoverOne = await axios.get(`https://api.themoviedb.org/3/discover/tv?api_key=${ key }&language=en-US&sort_by=popularity.desc&page=1&timezone=America%2FNew_York&include_null_first_air_dates=false&watch_region=US&with_watch_monetization_types=flatrate`);
    const discoverTwo = await axios.get(`https://api.themoviedb.org/3/discover/tv?api_key=${ key }&language=en-US&sort_by=popularity.desc&page=2&timezone=America%2FNew_York&include_null_first_air_dates=false&watch_region=US&with_watch_monetization_types=flatrate`)
    const shows = discoverOne.data.results;
    const pageTwo = discoverTwo.data.results;
    shows.push(...pageTwo);
    res.render('tv/index', { shows });
}));

app.get('/results', async (req, res) => {
    const query = req.query.q;
    const searchResults = await axios.get(`https://api.themoviedb.org/3/search/multi?api_key=${ key }&language=en-US&query=${ query }&page=1&include_adult=false&region=US`);
    const results = searchResults.data.results.filter(x => x.media_type !== 'person' && x.poster_path !== null && x.release_date !== '');
    const capitalize = (str) => str[0].toUpperCase() + str.slice(1);
    res.render('search/results', { results, query, capitalize })
});

app.get('/movie/:id', catchAsync(async (req, res) => {
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
    const reviews = await Review.find({ contentId: id }).populate('author');
    res.render('movies/details', { movie, cast, crew, directors, writers, genres, ageRating, movieRuntime, videos, similarTitles, recommendations, reviews });
}));

app.get('/tv/:id', catchAsync(async (req, res) => {
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
    const reviews = await Review.find({ contentId: id }).populate('author');
    res.render('tv/details', { show, rating, genres, cast, videos, runTime, similars, recommendations, reviews })
}))

app.post('/movie/:id/reviews', catchAsync(async (req, res) => {
    const { id } = req.params;
    const { rating, body } = req.body;
    const review = new Review({ rating, body });
    review.author = req.user._id;
    review.contentId = id;
    await review.save();
    req.flash('success', 'Successfully posted review!');
    res.redirect(`/movies/${ id }`);
}));

app.delete('/movie/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { reviewId, id } = req.params;
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/movies/${ id }`);
}));

app.post('/tv/:id/reviews', catchAsync(async (req, res) => {
    const { id } = req.params;
    const { rating, body } = req.body;
    const review = new Review({ rating, body });
    review.author = req.user._id;
    review.contentId = id;
    await review.save();
    req.flash('success', 'Successfully posted review!');
    res.redirect(`/tv/${ id }`);
}));

app.delete('/tv/:id/reviews/:reviewId', catchAsync(async (req, res) => {
    const { reviewId, id } = req.params;
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/tv/${ id }`);
}));

app.get('/register', (req, res) => {
    res.render('users/register');
})

app.post('/register', catchAsync(async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to CinemaBuff!');
            res.redirect('/movies');
        });
    }
    catch (e) {
        req.flash('error', e.message);
        res.redirect('/register');
    }
}));

app.get('/login', (req, res) => {
    res.render('users/login');
});

app.post('/login', passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), catchAsync(async (req, res) => {
    req.flash('success', 'Welcome Back!')
    const redirectUrl = req.session.returnTo || '/movies';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}));

app.get('/logout', (req, res) => {
    req.logout();
    req.flash('success', 'Successfully logged out!');
    res.redirect('/movies');
});

app.listen(3000, () => {
    console.log('Listening on Port 3000');
});