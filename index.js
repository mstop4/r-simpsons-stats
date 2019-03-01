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

  // request.get({
  //   url: baseUrl,
  //   qs: query
  // })
  request('http://www.google.com')
    .on('response', (error, response, body) => {
      if (error) {
        console.log('Error');
        console.log(response);
        res.json(error);
      }

      else {
        console.log('Success!');
        console.log(response);
        res.json(body);
      }
    });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));