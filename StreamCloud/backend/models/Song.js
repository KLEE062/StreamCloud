const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    title: String,
    artist: String,
    album: String,
    duration: Number,
    audioUrl: String,
    coverArt: String,
    plays: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Song', songSchema); 
