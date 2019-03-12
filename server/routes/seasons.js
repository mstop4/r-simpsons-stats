const express = require('express');
const router = express.Router();
const { getSeasons } = require('../controllers/seasonsController');

router.get('/', (req, res) => {
  getSeasons()
    .then(results => {
      res.json(results);
    }, error => {
      res.json(error);
    });
});

module.exports = router;