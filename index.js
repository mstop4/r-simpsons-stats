const express = require('express');
const request = require('request');
const app = express();
const port = 5000;

app.get('/', (req, res) => {
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

app.listen(port, () => console.log(`Example app listening on port ${port}!`));