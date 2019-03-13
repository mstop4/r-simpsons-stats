const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  id: String,
  season: Number,
  episode: Number,
  score: Number,
  date: Number,
  subLink: String,
  mediaLink: String,
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;