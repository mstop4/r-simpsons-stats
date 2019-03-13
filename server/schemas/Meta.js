const mongoose = require('mongoose');

const metaSchema = new mongoose.Schema({
  lastUpdated: Number,
  subsAnalyzed: Number,
  episodeCount: Number,
  newsCount: Number,
  ocCount: Number,
  shitpostCount: Number,
  invalidCount: Number,
  unknownCount: Number
});

const Meta = mongoose.model('Meta', metaSchema);

module.exports = Meta;