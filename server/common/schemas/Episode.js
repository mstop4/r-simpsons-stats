const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season'
  },
  number: Number,
  title: String,
  aired: Number,
  productionCode: String
});

const Episode = mongoose.model('Episode', episodeSchema);

module.exports = Episode;