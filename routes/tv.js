const express = require('express');
const router = express.Router();
const catchAsync = require('../utility/catchAsync');
const tv = require('../controllers/tv')
const { isLoggedIn, validateReviewSchema } = require('../middleware');

// Trending TV shows route
router.get('/', catchAsync(tv.displayTv));

// TV show details route
router.get('/:id', catchAsync(tv.displayTvDetails))

// Post reviews for TV Show route
router.post('/:id/reviews', isLoggedIn, validateReviewSchema, catchAsync(tv.createReview));

//Delete TV show review
router.delete('/:id/reviews/:reviewId', catchAsync(tv.deleteReview));

module.exports = router;