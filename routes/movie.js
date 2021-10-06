const express = require('express');
const router = express.Router();
const catchAsync = require('../utility/catchAsync');
const movie = require('../controllers/movie');
const { isLoggedIn, validateReviewSchema } = require('../middleware');

router.get('/', catchAsync(movie.displayMovies))

router.get('/:id', catchAsync(movie.displayMovieDetails));

router.post('/:id/reviews', isLoggedIn, validateReviewSchema, catchAsync(movie.createReview));

router.delete('/:id/reviews/:reviewId', catchAsync(movie.deleteReview));

module.exports = router;