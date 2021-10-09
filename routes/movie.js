const express = require('express');
const router = express.Router();
const catchAsync = require('../utility/catchAsync');
const movie = require('../controllers/movie');
const { isLoggedIn, validateReviewSchema } = require('../middleware');

// Trending movies route
router.get('/', catchAsync(movie.displayMovies))

// Movie details route
router.get('/:id', catchAsync(movie.displayMovieDetails));

// Post reviews in movie page
router.post('/:id/reviews', isLoggedIn, validateReviewSchema, catchAsync(movie.createReview));

// Deletes reviews that belong to a user
router.delete('/:id/reviews/:reviewId', isLoggedIn, catchAsync(movie.deleteReview));

module.exports = router;