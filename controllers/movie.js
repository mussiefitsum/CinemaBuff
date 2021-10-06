const axios = require('axios');
const Review = require('../models/reviews');

if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}

const key = process.env.TMDB_API_KEY;

module.exports.displayMovies = async (req, res) => {
    const discoverOne = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${ key }&language=en-US&region=US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1&with_watch_monetization_types=flatrate`);
    const discoverTwo = await axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${ key }&language=en-US&region=US&sort_by=popularity.desc&include_adult=false&include_video=false&page=2&with_watch_monetization_types=flatrate`);
    const movies = discoverOne.data.results;
    const pageTwo = discoverTwo.data.results;
    movies.push(...pageTwo);
    res.render('movies/index', { movies });
}

module.exports.displayMovieDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const movieDetails = await axios.get(`https://api.themoviedb.org/3/movie/${ id }?api_key=${ key }&language=en-US`);
        const movieCredits = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/credits?api_key=${ key }&language=en-US`);
        const movieAgeRating = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/release_dates?api_key=${ key }`);
        const movieVideos = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/videos?api_key=${ key }&language=en-US`);
        const similarMovies = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/similar?api_key=${ key }&language=en-US&page=1`);
        const recommendedMovies = await axios.get(`https://api.themoviedb.org/3/movie/${ id }/recommendations?api_key=${ key }&language=en-US&page=1`);
        const cast = movieCredits.data.cast;
        const crew = movieCredits.data.crew;
        const movie = movieDetails.data;
        const similarTitles = similarMovies.data.results;
        const recommendations = recommendedMovies.data.results;
        const videos = movieVideos.data.results;
        const ageRating = movieAgeRating.data.results.filter(x => x.iso_3166_1 === 'US').map(x => x.release_dates).flat();
        const genres = movieDetails.data.genres.map(x => x.name);
        const directors = crew.filter(x => x.job === 'Director').map(x => x.name);
        const writers = crew.filter(x => x.job === 'Writer').map(x => x.name);
        const movieRuntime = (movie.runtime / 60).toString();
        const reviews = await Review.find({ contentId: id }).populate('author');
        res.render('movies/details', { movie, cast, crew, directors, writers, genres, ageRating, movieRuntime, videos, similarTitles, recommendations, reviews });
    } catch (e) {
        console.log(e);
        req.flash('error', 'Oops something went wrong!');
        res.redirect('/movie');
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
    res.redirect(`/movie/${ id }`);
}

module.exports.deleteReview = async (req, res) => {
    const { reviewId, id } = req.params;
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review!');
    res.redirect(`/movie/${ id }`);
}