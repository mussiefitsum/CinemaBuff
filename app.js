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
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');

const User = require('./models/users');
const Review = require('./models/reviews')

const centralRoutes = require('./routes/central');
const movieRoutes = require('./routes/movie');
const tvRoutes = require('./routes/tv');
const userRoutes = require('./routes/watchlist')

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

app.use('/', centralRoutes);
app.use('/movie', movieRoutes);
app.use('/tv', tvRoutes);
app.use('/user', userRoutes);

app.listen(3000, () => {
    console.log('Listening on Port 3000');
});