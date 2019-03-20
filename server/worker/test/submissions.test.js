process.env.ENV = 'test';

const request = require('request');
const expect = require('chai').expect;
const sinon = require('sinon');
const rewire = require('rewire');
const Submission = require('../../common/schemas/Submission');
const Meta = require('../../common/schemas/Meta');
const Season = require('../../common/schemas/Season');
let subLib = rewire('../libs/submissions');

const processedTestData = require('../../common/test/data/processedTestData');
const rawTestData = require('../../common/test/data/rawTestData');
const seasonTestData = require('../../common/test/data/seasonData');

describe('Submissions Library', () => {
  const fakeRequest = sinon.stub(request, 'get');
  const stubFind = sinon.stub(Season, 'find');

  after(() => {
    fakeRequest.restore();
    stubFind.restore();
  });

  describe('_processSubmissions', () => {
    const _processSubmissions = subLib.__get__('_processSubmissions');

    const templateProcessedData = {
      episodeCount: 0,
      newsCount: 0,
      ocCount: 0,
      shitpostCount: 0,
      unknownCount: 0,
      submissions: []
    };

    const invalidProcessedData = {
      secretIngredient: 'love'
    };

    before(() => {
      subLib.__set__('seasonData', seasonTestData);
    });

    after(() => {
      subLib.__set__('seasonData', null);
    });

    it('should process and tally all submissions', () => {
      const processedData = {
        episodeCount: 0,
        newsCount: 0,
        ocCount: 0,
        shitpostCount: 0,
        unknownCount: 0,
        submissions: []
      };
  
      _processSubmissions(rawTestData, processedData);

      expect(processedData.episodeCount).to.equal(9);
      expect(processedData.newsCount).to.equal(0);
      expect(processedData.ocCount).to.equal(3);
      expect(processedData.shitpostCount).to.equal(1);
      expect(processedData.unknownCount).to.equal(37);
      expect(processedData.submissions).to.have.lengthOf(9);
    });

    it('should process nothing with empty raw data array', () => {
      const rawData = [];
      const processedData = {...templateProcessedData};
  
      _processSubmissions(rawData, processedData);

      expect(processedData).to.deep.equal(templateProcessedData);
    });

    it('should not process anything with no raw data at all', () => {
      const rawData = undefined;
      const processedData = {...templateProcessedData};
  
      _processSubmissions(rawData, processedData);

      expect(processedData).to.deep.equal(templateProcessedData);
    });

    it('should process nothing with invalid process data container', () => {
      const processedData = {...invalidProcessedData};
  
      _processSubmissions(rawTestData, processedData);
  
      expect(processedData).to.deep.equal(invalidProcessedData);
    });

    it('should process nothing with no process data container', () => {
      const processedData = undefined;
  
      _processSubmissions(rawTestData, processedData);
  
      expect(processedData).to.equal(undefined);
    });
  });

  describe('_updateDatabase', () => {
    const _updateDatabase = subLib.__get__('_updateDatabase');
    const stubMeta = sinon.stub(Meta, 'findOneAndUpdate');
    const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp');

    const fakeBulk = { 
      find: function () {
        return this;
      },

      upsert: function () {
        return this;
      }, 

      updateOne: sinon.spy(),
      execute: sinon.stub().yields(null, { updated: 'ok' })
    };

    beforeEach(() => {
      fakeBulk.updateOne.resetHistory();
      fakeBulk.execute.resetHistory();
    });

    afterEach(() => {
      stubBulk.reset();
      stubMeta.reset();
    });

    after(() => {
      stubBulk.restore();
      stubMeta.restore();
    });

    it('should update the database', async () => {
      stubMeta.yields(null);
      stubBulk.returns(fakeBulk);
      await _updateDatabase(processedTestData);
      
      expect(fakeBulk.updateOne.called).to.equal(true);
      expect(fakeBulk.execute.calledOnce).to.equal(true);
    });

    it('should not update the database due to an error with updating metadata', async () => {
      stubMeta.yields({ error: 'yes' });
      stubBulk.returns(fakeBulk);
      
      try {
        await _updateDatabase(processedTestData);
      }
      
      catch (error) {
        expect(fakeBulk.updateOne.called).to.equal(false);
        expect(fakeBulk.execute.calledOnce).to.equal(false);
      }
    });

    it('should not update the database due to an error with executing bulk', async () => {
      const modFakeBulk = {...fakeBulk};
      modFakeBulk.execute = sinon.stub().yields({ error: 'yes' }, { updated: 'no' });
      stubMeta.yields(null);
      stubBulk.returns(modFakeBulk);
      
      try {
        await _updateDatabase(processedTestData);
      }
      
      catch (error) {
        expect(modFakeBulk.updateOne.called).to.equal(true);
        expect(modFakeBulk.execute.calledOnce).to.equal(true);
      }
    });

    it('should update the database with no changes', async () => {
      const noSubs = {...processedTestData};
      noSubs.submissions = [];
      stubMeta.yields(null);
      stubBulk.returns(fakeBulk);

      await _updateDatabase(noSubs);

      expect(fakeBulk.updateOne.called).to.equal(false);
      expect(fakeBulk.execute.calledOnce).to.equal(false);
    });
    
    it('should not update the database due to bad data', async () => {
      const wrongSubs = {...processedTestData};
      wrongSubs.submissions = { name: 'Homer Thompson '};
      stubMeta.yields(null);
      stubBulk.returns(fakeBulk);

      try {
        await _updateDatabase(wrongSubs);
      }
      
      catch (error) {
        expect(fakeBulk.updateOne.called).to.equal(false);
        expect(fakeBulk.execute.calledOnce).to.equal(false);
      }
    });

    it('should not update the database due to undefined data', async () => {
      const wrongSubs = {...processedTestData};
      wrongSubs.submissions = undefined;
      stubMeta.yields(null);
      stubBulk.returns(fakeBulk);

      try {
        await _updateDatabase(wrongSubs);
      }
      
      catch (error) {
        expect(fakeBulk.updateOne.called).to.equal(false);
        expect(fakeBulk.execute.calledOnce).to.equal(false);
      }
    });
  });

  describe('_querySubreddit', () => {
    const _querySubreddit = subLib.__get__('_querySubreddit');
    const _processSubmissions = sinon.stub().returns(processedTestData);


    const rawDataString = JSON.stringify({
      data: rawTestData
    });

    // TODO: Test "before" and "after" arguments with something other than null and undefined
    //       Test cases where the server requests more submissions than the API can provide

    before(() => {
      subLib.__set__('seasonData', seasonTestData);
      subLib.__set__('_processSubmissions', _processSubmissions);
    });

    afterEach(() => {
      fakeRequest.reset();
    });

    after(() => {
      subLib = rewire('../libs/submissions');
    });

    it('should resolve with supplied arguments', async () => {
      fakeRequest.yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit(10, 5, null, undefined, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 10 submissions processed');
      expect(result.data).to.not.equal(undefined);
    });

    it('should resolve using default arguments', async () => {
      fakeRequest.yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit();

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 10 submissions processed');
      expect(result.data).to.not.equal(undefined);
    });

    it('should be rejected due to inability to connect with external API', async () => {
      fakeRequest.yields({ error: 'yes'}, { statusCode: 404 }, null);

      try {
        await _querySubreddit(10, 5, null, undefined, 250);
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot connect to external API');
        expect(error.data).to.equal(undefined);
      }
    });

    it('should be rejected due to inability to find external API resource', async () => {
      fakeRequest.yields(null, { statusCode: 404 }, null);

      try {
        await _querySubreddit(10, 5, null, undefined, 250);
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot find external API resource');
        expect(error.data).to.equal(undefined);
      }
    });

    xit('should prematurely resolve after requesting more submissions that available', async () => {
      fakeRequest.yields(null, { statusCode: 200 }, processedTestData);

      const result = await _querySubreddit(10, 5, null, undefined, -250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('only 45 submissions processed');
      expect(result.data).to.not.equal(undefined);
    });

    it('should resolve even with a negative result limit', async () => {
      fakeRequest.yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit(-10, 5, null, undefined, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 10 submissions processed');
      expect(result.data).to.not.equal(undefined);
    });

    it('should resolve even with a negative page limit', async () => {
      fakeRequest.yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit(10, -5, null, undefined, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 10 submissions processed');
      expect(result.data).to.not.equal(undefined);
    });

    it('should resolve even with a negative delay', async () => {
      fakeRequest.yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit(10, 5, null, undefined, -250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 10 submissions processed');
      expect(result.data).to.not.equal(undefined);
    });
  });

  describe('checkRateLimit', () => {

    afterEach(() => {
      fakeRequest.reset();
    });

    it('should update default request delay', async () => {
      fakeRequest.yields(null, { statusCode: 200 }, JSON.stringify({ server_ratelimit_per_minute: 200 }));

      const result = await subLib.checkRateLimit();

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal(300);
    });

    it('should be rejected due to inability to connect with external API', async () => {
      fakeRequest.yields({ error: 'yes'}, { statusCode: 404 }, null);

      try {
        await subLib.checkRateLimit();
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot connect to external API');
      }
    });

    it('should be rejected due to inability to find external API resource', async () => {
      fakeRequest.yields(null, { statusCode: 404 }, null);

      try {
        await subLib.checkRateLimit();
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot find external API resource');
      }
    });
  });

  describe('getSeasonDataFromDB', () => {
    
    afterEach(() => {
      stubFind.reset();
      subLib.__set__('seasonData', null);
    });

    after(() => {
      subLib = rewire('../libs/submissions');
    });

    it('should resolve with a status of \'ok\'', async () => {
      stubFind.yields(null, { status: 'ok', message: 'ok' });
      
      const result = await subLib.getSeasonDataFromDB();
      const seasonData = subLib.__get__('seasonData');

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
      expect(seasonData).to.not.equal(null);
    });

    it('should be rejected due to being unable to query database', async () => {
      stubFind.yields({ error: 'yes' }, null);
      let seasonData;

      try {
        await subLib.getSeasonDataFromDB();
      }

      catch (error) {
        seasonData = subLib.__get__('seasonData');
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Could not query database.');
        expect(error.data).to.equal(undefined);
        expect(seasonData).to.equal(null);
      }
    });
  });

  describe('getPastDate', () => {
    const stubMeta = sinon.stub(Meta, 'findOne');

    afterEach(() => {
      stubMeta.reset();
    });

    after(() => {
      stubMeta.restore();
    });

    it('should resolve with a status of \'ok\'', async () => {
      stubMeta.yields(null, { lastUpdated: 123456 });
      const result = await subLib.getPastDate(456);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.date).to.equal(123000);
    });

    it('should be rejected due to being unable to query database', async () => {
      stubMeta.yields({ error: 'yes' }, null);

      try {
        await subLib.getPastDate(456);
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Could not get past date.');
        expect(error.date).to.equal(0);
      }
    });
  });

  describe('getOldestSubByDate', () => {
    const stubFind = sinon.stub(Submission, 'find');

    afterEach(() => {
      stubFind.reset();
    });

    after(() => {
      stubFind.restore();
    });

    it('should resolve with a status of \'ok\' with some submissions found', async () => {
      stubFind.yields(null, [{ date: 123456 }]);
      const result = await subLib.getOldestSubByDate();

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
    });

    it('should resolve with a status of \'ok\' with no submissions found', async () => {
      stubFind.yields(null, []);
      const result = await subLib.getOldestSubByDate();

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('no submissions found');
      expect(result.data.date).to.equal(0);
    });

    it('should be rejected due to being unable to query database', async () => {
      stubFind.yields({ error: 'yes' }, null);

      try {
        await subLib.getOldestSubByDate();
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Could not get submission.');
        expect(error.data).to.equal(undefined);
      }
    });
  });

  describe('getSubmissions', () => {
    const _querySubreddit = sinon.stub();
    const _updateDatabase = sinon.stub();

    before(() => {
      subLib.__set__('_querySubreddit', _querySubreddit);
      subLib.__set__('_updateDatabase', _updateDatabase);
    });

    afterEach(() => {
      _querySubreddit.reset();
      _updateDatabase.reset();
    });

    after(() => {
      subLib = rewire('../libs/submissions');
    });

    xit('should get submissions and update the database', async () => {
      _querySubreddit.yields({ status: 'ok', message: 'all 5 submissions processed', data: [{ id: 12345 }]});
      _updateDatabase.yields({ status: 'ok', message: 'Finished updating database!'});

      const result = await getSubmissions(10, 1, 12345, 0);
    });
  });
});
