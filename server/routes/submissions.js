const express = require('express');
const router = express.Router();

const { queryDatabase, getSubmissions, checkRateLimit, getMetaDataFromDB, getOldestSubFromDB, getNewestSubFromDB } = require('../controllers/submissionsController');
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

router.put('/update/oldest', (req, res) => {
  if (routeIsReady) {
    checkRateLimit()
      .then((delay) => {
        console.log(`Setting request delay to ${delay.message} ms`);
        console.log('Getting oldest submission...');

        getOldestSubFromDB()
          .then((oldest) => {
            console.log(`Getting submissions before ${oldest.data.date}...`);

            getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages), oldest.data.date)
              .then(results => {
                res.json(results);
              }, error => {
                res.json(error);
              });
          });
      });
  }

  else {
    res.json({
      status: 'error',
      message: '/submissions is not ready yet'
    });
  }
});

router.put('/update/newest', (req, res) => {
  if (routeIsReady) {
    checkRateLimit()
      .then((delay) => {
        console.log(`Setting request delay to ${delay.message} ms`);
        console.log('Getting newest submission...');

        getNewestSubFromDB()
          .then((newest) => {
            console.log(`Getting submissions after ${newest.data.date}...`);

            getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages), null, newest.data.date)
              .then(results => {
                res.json(results);
              }, error => {
                res.json(error);
              });
          });
      });
  }

  else {
    res.json({
      status: 'error',
      message: '/submissions is not ready yet'
    });
  }
});

router.put('/', (req, res) => {
  if (routeIsReady) {
    checkRateLimit()
      .then((delay) => {
        console.log(`Setting request delay to ${delay.message} ms`);
        console.log('Getting submissions...');

        getSubmissions(parseInt(req.query.limit), parseInt(req.query.pages), parseInt(req.query.before), parseInt(req.query.after))
          .then(results => {
            res.json(results);
          }, error => {
            res.json(error);
          });
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