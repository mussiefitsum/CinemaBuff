const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utility/catchAsync');
const central = require('../controllers/central');

// Route for home page
router.get('/', catchAsync(central.displayHome));

// Route for search results
router.get('/results', catchAsync(central.displayResults));

// Routes to display register form and create a user
router.route('/register')
    .get(central.registerForm)
    .post(catchAsync(central.registerUser));

// Routes to display login form and authenticate a user
router.route('/login')
    .get(central.loginForm)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), catchAsync(central.loginUser));

// Logout route
router.get('/logout', central.logoutUser);

module.exports = router;