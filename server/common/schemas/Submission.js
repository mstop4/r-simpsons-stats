const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  id: String,
  season: Number,
  episode: Number,
  title: String,
  postedBy: String,
  score: Number,
  comments: Number,
  date: Number,
  subLink: String,
  mediaLink: String,
  ingestLevel: Number
});

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = Submission;