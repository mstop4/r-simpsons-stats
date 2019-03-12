const mongoose = require('mongoose');

const episodeSchema = new mongoose.Schema({
  season: Number,
  number: Number,
  title: String,
  aired: Number,
  productionCode: String
});

const Episode = mongoose.model('Episode', episodeSchema);

module.exports = Episode;