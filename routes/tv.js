const express = require('express');
const router = express.Router();
const catchAsync = require('../utility/catchAsync');
const tv = require('../controllers/tv')
const { isLoggedIn, validateReviewSchema } = require('../middleware');

router.get('/', catchAsync(tv.displayTv));

router.get('/:id', catchAsync(tv.displayTvDetails))

router.post('/:id/reviews', isLoggedIn, validateReviewSchema, catchAsync(tv.createReview));

router.delete('/:id/reviews/:reviewId', catchAsync(tv.deleteReview));

module.exports = router;