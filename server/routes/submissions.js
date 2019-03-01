const express = require('express');
const router = express.Router();

const { querySubreddit } = require('../helpers/submissions');

router.get('/', (req, res) => {
  const baseUrl = 'https://api.pushshift.io/reddit/submission/search';
  const query = {
    subreddit: 'TheSimpsons',
    limit: req.query.limit,
  };

  const startTime = new Date;
  startTime.setDate(startTime.getDate() - 0);
  const startUtime = Math.floor(startTime.getTime() / 1000);

  querySubreddit(baseUrl, query, startUtime, req.query.pages, 250)
    .then((results) => {
      res.json(results);
    });
});

module.exports = router;