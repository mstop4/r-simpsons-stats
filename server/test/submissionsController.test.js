process.env.ENV = 'test';

const request = require('request');
const expect = require('chai').expect;
const sinon = require('sinon');
const rewire = require('rewire');
const Submission = require('../schemas/Submission');
const Meta = require('../schemas/Meta');
const subCon = rewire('../controllers/submissionsController');

const processedTestData = require('./data/processedTestData');
const rawTestData = require('./data/rawTestData');
const seasonTestData = require('./data/seasonData');

describe('Submissions Controller', () => {
  describe('_processSubmissions', () => {
    const _processSubmissions = subCon.__get__('_processSubmissions');

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
      subCon.__set__('seasonData', seasonTestData);
    });

    after(() => {
      subCon.__set__('seasonData', null);
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
    const _updateDatabase = subCon.__get__('_updateDatabase');

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

    it('should update the database', async () => {
      const stubMeta = sinon.stub(Meta, 'findOneAndUpdate').yields(null);
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);
      await _updateDatabase(processedTestData);
      
      expect(fakeBulk.updateOne.called).to.equal(true);
      expect(fakeBulk.execute.calledOnce).to.equal(true);
      stubBulk.restore();
      stubMeta.restore();
    });

    it('should not update the database due to an error with updating metadata', async () => {
      const stubMeta = sinon.stub(Meta, 'findOneAndUpdate').yields({ error: 'yes' });
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);
      
      try {
        await _updateDatabase(processedTestData);
      }
      
      catch (error) {
        expect(fakeBulk.updateOne.called).to.equal(false);
        expect(fakeBulk.execute.calledOnce).to.equal(false);
      }
      
      finally {
        stubBulk.restore();
        stubMeta.restore();
      }
    });

    it('should not update the database due to an error with excuting bulk', async () => {
      const modFakeBulk = {...fakeBulk};
      modFakeBulk.execute = sinon.stub().yields({ error: 'yes' }, { updated: 'no' });
      const stubMeta = sinon.stub(Meta, 'findOneAndUpdate').yields(null);
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(modFakeBulk);
      
      try {
        await _updateDatabase(processedTestData);
      }
      
      catch (error) {
        expect(modFakeBulk.updateOne.called).to.equal(true);
        expect(modFakeBulk.execute.calledOnce).to.equal(true);
      }
      
      finally {
        stubBulk.restore();
        stubMeta.restore();
      }
    });

    it('should update the database with no changes', async () => {
      const noSubs = {...processedTestData};
      noSubs.submissions = [];
      const stubMeta = sinon.stub(Meta, 'findOneAndUpdate').yields(null);
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);

      await _updateDatabase(noSubs);
      expect(fakeBulk.updateOne.called).to.equal(false);
      expect(fakeBulk.execute.calledOnce).to.equal(false);
      stubBulk.restore();
      stubMeta.restore();
    });
    
    it('should not update the database due to bad data', async () => {
      const wrongSubs = {...processedTestData};
      wrongSubs.submissions = { name: 'Homer Thompson '};
      const stubMeta = sinon.stub(Meta, 'findOneAndUpdate').yields(null);
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);

      try {
        await _updateDatabase(wrongSubs);
      }
      
      catch (error) {
        expect(fakeBulk.updateOne.called).to.equal(false);
        expect(fakeBulk.execute.calledOnce).to.equal(false);
      }
      
      finally {
        stubBulk.restore();
        stubMeta.restore();
      }
    });

    it('should not update the database due to undefined data', async () => {
      const wrongSubs = {...processedTestData};
      wrongSubs.submissions = undefined;
      const stubMeta = sinon.stub(Meta, 'findOneAndUpdate').yields(null);
      const stubBulk = sinon.stub(Submission.collection, 'initializeOrderedBulkOp').returns(fakeBulk);

      try {
        await _updateDatabase(wrongSubs);
      }
      
      catch (error) {
        expect(fakeBulk.updateOne.called).to.equal(false);
        expect(fakeBulk.execute.calledOnce).to.equal(false);
      }
      
      finally {
        stubBulk.restore();
        stubMeta.restore();
      }
    });
  });

  describe('_querySubreddit', () => {
    const _processSubmissions = sinon.stub().returns(processedTestData);
    const _querySubreddit = subCon.__get__('_querySubreddit');

    const rawDataString = JSON.stringify({
      data: rawTestData
    });

    // TODO: Test "before" and "after" arguments with something other than null and undefined
    //       Test cases where the server requests more submissions than the API can provide

    before(() => {
      subCon.__set__('seasonData', seasonTestData);
    });

    after(() => {
      subCon.__set__('seasonData', null);
    });

    it('should resolve with supplied arguments', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit(10, 5, null, undefined, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 45 submissions processed');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });

    it('should resolve using default arguments', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit();

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 9 submissions processed');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });

    it('should be rejected due to inability to connect with external API', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields({ error: 'yes'}, { statusCode: 404 }, null);

      try {
        await _querySubreddit(10, 5, null, undefined, 250);
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot connect to external API');
        expect(error.data).to.equal(undefined);
      }

      finally {
        fakeRequest.restore();
      }
    });

    it('should be rejected due to inability to find external API resource', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 404 }, null);

      try {
        await _querySubreddit(10, 5, null, undefined, 250);
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot find external API resource');
        expect(error.data).to.equal(undefined);
      }

      finally {
        fakeRequest.restore();
      }
    });

    // it('should prematurely resolve after requesting more submissions that available', async () => {
    //   const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, processedDataString);

    //   const result = await _querySubreddit(10, 5, null, undefined, -250);

    //   expect(result.status).to.equal('ok');
    //   expect(result.message).to.equal('only 45 submissions processed');
    //   expect(result.data).to.not.equal(undefined);
    //   fakeRequest.restore();
    // });

    it('should resolve even with a negative result limit', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit(-10, 5, null, undefined, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 45 submissions processed');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });

    it('should resolve even with a negative page limit', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit(10, -5, null, undefined, 250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 9 submissions processed');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });

    it('should resolve even with a negative delay', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, rawDataString);

      const result = await _querySubreddit(10, 5, null, undefined, -250);

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('all 45 submissions processed');
      expect(result.data).to.not.equal(undefined);
      fakeRequest.restore();
    });
  });

  describe('queryDatabase', () => {
    before(() => {
      subCon.__set__('seasonData', seasonTestData);
    });

    after(() => {
      subCon.__set__('seasonData', null);
    });

    it('should resolve with a status of \'ok\'', async () => {
      const fakeFind = sinon.stub(Submission, 'find').yields(null, [1, 2, 3] );
      const result = await subCon.queryDatabase({}, 1, false);
      
      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('ok');
      expect(result.data).to.not.equal(undefined);
      fakeFind.restore();
    });

    it('should be rejected with a status of \'error\'', async () => {
      const fakeFind = sinon.stub(Submission, 'find').yields({ error: 'yes' }, null);
      try {
        await subCon.queryDatabase({}, 1, false);
      } 
      
      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Could not query database.');
        expect(error.data).to.equal(undefined);
      } 
      
      finally {
        fakeFind.restore();
      }
    });

    it('should resolve with season stats only', async () => {
      const fakeFind = sinon.stub(Submission, 'find').yields(null, processedTestData.submissions);
      const result = await subCon.queryDatabase({}, 1, true);
      
      expect(result.status).to.equal('ok');
      expect(result.message).to.equal('season stats only');
      expect(result.data).to.have.length(30);
      fakeFind.restore();
    });
  });

  describe('checkRateLimit', () => {
    it('should update default request delay', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 200 }, JSON.stringify({ server_ratelimit_per_minute: 200 }));

      const result = await subCon.checkRateLimit();

      expect(result.status).to.equal('ok');
      expect(result.message).to.equal(300);
      fakeRequest.restore();
    });

    it('should be rejected due to inability to connect with external API', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields({ error: 'yes'}, { statusCode: 404 }, null);

      try {
        await subCon.checkRateLimit();
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot connect to external API');
      }

      finally {
        fakeRequest.restore();
      }
    });

    it('should be rejected due to inability to find external API resource', async () => {
      const fakeRequest = sinon.stub(request, 'get').yields(null, { statusCode: 404 }, null);

      try {
        await subCon.checkRateLimit();
      }

      catch (error) {
        expect(error.status).to.equal('error');
        expect(error.message).to.equal('Cannot find external API resource');
      }

      finally {
        fakeRequest.restore();
      }
    });
  });
});
