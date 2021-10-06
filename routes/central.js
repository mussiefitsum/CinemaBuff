const express = require('express');
const router = express.Router();
const passport = require('passport');
const catchAsync = require('../utility/catchAsync');
const central = require('../controllers/central');

router.get('/', catchAsync(central.displayHome));

router.get('/results', catchAsync(central.displayResults));

router.route('/register')
    .get(central.registerForm)
    .post(catchAsync(central.registerUser));

router.route('/login')
    .get(central.loginForm)
    .post(passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), catchAsync(central.loginUser));

router.get('/logout', central.logoutUser);

module.exports = router;