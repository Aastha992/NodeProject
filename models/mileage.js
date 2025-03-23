const mongoose = require('mongoose');
const TripSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    startLocation: {
        type: String,
        required: true,
    },
    constructionSites: {
        type: [String],
        required: true,
    },
    totalDistance: {
        type: Number,
        required: true,
    },
    expenses: {
        type: Number,
        required: true,
    },
    routeCoordinates: {
        type: [Object], // Or String, if you store the encoded polyline
        required: false,
    },
});

module.exports = mongoose.model('Trip', TripSchema);