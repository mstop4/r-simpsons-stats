const express = require('express');
const router = express.Router();

const { queryDatabase, getMetaDataFromDB } = require('../controllers/submissionsController');
let routeIsReady = false;

getMetaDataFromDB()
  .then(() => {
    routeIsReady = true;
  }, error => {
    console.log(`Metadata error: ${error.message}`);
  });

router.get('/', (req, res) => {
  if (routeIsReady) {
    const query = {};
    const seasonStats = req.query.seasonstats ? req.query.seasonstats.toLowerCase() === 'true' : false;

    if (req.query.season !== '0') {
      query.season = parseInt(req.query.season);
    }

    queryDatabase(query, parseInt(req.query.limit), seasonStats)
      .then(results => {
        res.json(results);
      }, error => {
        res.json(error);
      });
  }

  else {
    res.json({
      status: 'error',
      message: '/submissions is not ready yet'
    });
  }
});

module.exports = router;