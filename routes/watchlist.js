const express = require('express');
const router = express.Router();
const catchAsync = require('../utility/catchAsync');
const { isLoggedIn } = require('../middleware');
const watchlist = require('../controllers/watchlist')

// Display user watchlist, add movie/show to watchlist, and delete item from watchlist routes
router.route('/:id/watchlist')
    .get(catchAsync(watchlist.displayWatchlist))
    .post(isLoggedIn, catchAsync(watchlist.addToWatchlist))
    .delete(catchAsync(watchlist.removeFromWatchlist));

module.exports = router;