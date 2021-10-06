const axios = require('axios');
const Review = require('../models/reviews');

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const key = process.env.TMDB_API_KEY;

module.exports.displayTv = async (req, res) => {
    const discoverOne = await axios.get(`https://api.themoviedb.org/3/discover/tv?api_key=${ key }&language=en-US&sort_by=popularity.desc&page=1&timezone=America%2FNew_York&include_null_first_air_dates=false&watch_region=US&with_watch_monetization_types=flatrate`);
    const discoverTwo = await axios.get(`https://api.themoviedb.org/3/discover/tv?api_key=${ key }&language=en-US&sort_by=popularity.desc&page=2&timezone=America%2FNew_York&include_null_first_air_dates=false&watch_region=US&with_watch_monetization_types=flatrate`)
    const shows = discoverOne.data.results;
    const pageTwo = discoverTwo.data.results;
    shows.push(...pageTwo);
    res.render('tv/index', { shows });
}

module.exports.displayTvDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const tvDetails = await axios.get(`https://api.themoviedb.org/3/tv/${ id }?api_key=${ key }&language=en-US`);
        const tvAgeRating = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/content_ratings?api_key=${ key }&language=en-US`);
        const credits = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/credits?api_key=${ key }&language=en-US`);
        const tvVideos = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/videos?api_key=${ key }&language=en-US`);
        const similarShows = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/similar?api_key=${ key }&language=en-US&page=1`);
        const recommendedShows = await axios.get(`https://api.themoviedb.org/3/tv/${ id }/recommendations?api_key=${ key }&language=en-US&page=1`);
        const show = tvDetails.data;
        const cast = credits.data.cast;
        const videos = tvVideos.data.results
        const ratings = tvAgeRating.data.results
        const similars = similarShows.data.results;
        const recommendations = recommendedShows.data.results;
        let rating = ratings.find(x => x.iso_3166_1 === 'US');
        if (rating === undefined) {
            rating = ratings.pop().rating;
        } else {
            rating = rating.rating;
        }
        const genres = tvDetails.data.genres.map(x => x.name).join(', ');
        const runTime = Math.round(show.episode_run_time.reduce((a, b) => a + b) / show.episode_run_time.length);
        const reviews = await Review.find({ contentId: id }).populate('author');
        res.render('tv/details', { show, rating, genres, cast, videos, runTime, similars, recommendations, reviews })
    } catch (e) {
        console.log(e);
        req.flash('error', 'Oops something went wrong!');
        res.redirect('/tv');
    }
}

module.exports.createReview = async (req, res) => {
    const { id } = req.params;
    const { rating, body } = req.body;
    const review = new Review({ rating, body });
    review.author = req.user._id;
    review.contentId = id;
    await review.save();
    req.flash('success', 'Successfully posted review!');
    res.redirect(`/tv/${ id }`);
}

module.exports.deleteReview = async (req, res) => {
    const { reviewId, id } = req.params;
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/tv/${ id }`);
}