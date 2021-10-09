if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const express = require('express');
const session = require('express-session');
const mongoSanitize = require('express-mongo-sanitize');
const app = express();
const ejsMate = require('ejs-mate');
const path = require('path');
const ExpressError = require('./utility/ExpressError');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const helmet = require('helmet')

const User = require('./models/users');

const centralRoutes = require('./routes/central');
const movieRoutes = require('./routes/movie');
const tvRoutes = require('./routes/tv');
const userRoutes = require('./routes/watchlist')

const mongoose = require('mongoose');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/CinemaBuff';

mongoose.connect(dbUrl);
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Database connected')
});

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const secret = process.env.SECRET || 'topsecret15'

const store = MongoStore.create({
    mongoUrl: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on('error', function (e) {
    console.log('SESSION STORE ERROR', e);
})

const sessionConfig = {
    store,
    name: 'sess1500',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

app.use(session(sessionConfig));
app.use(mongoSanitize());
app.use(helmet({ contentSecurityPolicy: false, }));
app.use(methodOverride('_method'));
app.use(flash());

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));

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

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) {
        err.message = 'Oh No. Something Went Wrong.'
    }
    res.status(statusCode).render('error', { err });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Listening on Port ${ port }`);
});