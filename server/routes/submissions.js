const express = require('express');
const request = require('request');
const router = express.Router();

router.get('/', (req, res) => {
  const baseUrl = 'https://api.pushshift.io/reddit/submission/search';
  const query = {
    subreddit: 'TheSimpsons',
    limit: 50
  };

  request({
    url: baseUrl,
    qs: query
  }, (error, response, body) => {

    if (error) {
      res.json(error);
    }

    else {
      res.json(JSON.parse(body));
    }
  });
});

module.exports = router;