const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  number: Number,
  numEpisodes: Number,
  episodes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode'
  }]
});

const Season = mongoose.model('Season', seasonSchema);

module.exports = Season;