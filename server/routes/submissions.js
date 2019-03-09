const express = require('express');
const router = express.Router();

const { querySubreddit, getSubmissions } = require('../controllers/submissions');

router.get('/', (req, res) => {
  querySubreddit(parseInt(req.query.limit), parseInt(req.query.pages), 250)
    .then(results => {
      res.json(results);
    }, error => {
      res.send(error);
    });
});

router.post('/', (req, res) => {
  getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages))
    .then(results => {
      res.json(results);
    }, error => {
      res.send(error);
    });
});

module.exports = router;