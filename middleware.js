const ExpressError = require('./utility/ExpressError');
const { reviewSchema } = require('./schema');
const Review = require('./models/reviews')

// Checks if user is logged in before hitting a route that requires user authorization
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash('error', 'Need to be logged in!');
        return res.redirect('/login');
    }
    next();
}

// Checks if review contains the necessary information before hitting post route
module.exports.validateReviewSchema = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(x => x.message).join(',');
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
}