const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  season: Number,
  episode: Number,
  score: Number,
  link: String
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;