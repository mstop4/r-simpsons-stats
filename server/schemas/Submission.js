const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  _id: String,
  season: Number,
  episode: Number,
  score: Number,
  date: Number,
  link: String
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;