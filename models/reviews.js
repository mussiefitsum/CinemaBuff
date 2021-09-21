const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
    rating: {
        type: Number,
        required: true
    },
    body: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    contentId: {
        type: Number,
        required: true
    }
});

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;