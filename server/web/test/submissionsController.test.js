process.env.ENV = 'test';

const expect = require('chai').expect;
const sinon = require('sinon');
const rewire = require('rewire');
const Submission = require('../../common/schemas/Submission');
const Season = require('../../common/schemas/Season');
const Meta = require('../../common/schemas/Meta');
const subCon = rewire('../controllers/submissionsController');

const processedTestData = require('../../common/test/data/processedTestData');
const seasonTestData = require('../../common/test/data/seasonData');

describe('getSeasonDataFromDB', () => {
  let seasonData;

  beforeEach(() => {
    seasonData = subCon.__get__('seasonData');
  });

  afterEach(() => {
    seasonData = subCon.__set__('seasonData', null);
  });

  it('should resolve with a status of \'ok\'', async () => {
    const stubFind = sinon.stub(Season, 'find').yields(null, { status: 'ok', message: 'ok' });
    const result = await subCon.getSeasonDataFromDB();

    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('ok');
    expect(result.data).to.not.equal(undefined);
    expect(seasonData).to.not.equal(null);

    stubFind.restore();
  });

  it('should be rejected due to being unable to query database', async () => {
    const stubFind = sinon.stub(Season, 'find').yields({ error: 'yes'}, null);

    try {
      await subCon.getSeasonDataFromDB();
    } 
    
    catch (error) {
      expect(error.status).to.equal('error');
      expect(error.message).to.equal('Could not query database.');
      expect(error.data).to.equal(undefined);
      expect(seasonData).to.equal(null);
    } 
    
    finally {
      stubFind.restore();
    }
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
    const stubMeta = sinon.stub(Meta, 'findOne').yields(null, { lastUpdated: 12345678 });
    const stubFind = sinon.stub(Submission, 'find').yields(null, [1, 2, 3] );
    const result = await subCon.queryDatabase({}, 1, false);
    
    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('ok');
    expect(result.data).to.not.equal(undefined);
    stubFind.restore();
    stubMeta.restore();
  });

  it('should be rejected due to being unable to query database', async () => {
    const stubMeta = sinon.stub(Meta, 'findOne').yields(null, { lastUpdated: 12345678 });
    const stubFind = sinon.stub(Submission, 'find').yields({ error: 'yes' }, null);
    try {
      await subCon.queryDatabase({}, 1, false);
    } 
    
    catch (error) {
      expect(error.status).to.equal('error');
      expect(error.message).to.equal('Could not query database.');
      expect(error.data).to.equal(undefined);
    } 
    
    finally {
      stubFind.restore();
      stubMeta.restore();
    }
  });

  it('should be rejected due to being unable to get metadata', async () => {
    const stubMeta = sinon.stub(Meta, 'findOne').yields({ error: 'yes '}, null);
    const stubFind = sinon.stub(Submission, 'find').yields(null, null);
    try {
      await subCon.queryDatabase({}, 1, false);
    } 
    
    catch (error) {
      expect(error.status).to.equal('error');
      expect(error.message).to.equal('Could not get metadata.');
      expect(error.data).to.equal(undefined);
    } 
    
    finally {
      stubFind.restore();
      stubMeta.restore();
    }
  });

  it('should resolve with season stats only', async () => {
    const stubMeta = sinon.stub(Meta, 'findOne').yields(null, { lastUpdated: 12345678 });
    const stubFind = sinon.stub(Submission, 'find').yields(null, processedTestData.submissions);
    const result = await subCon.queryDatabase({}, 1, true);
    
    expect(result.status).to.equal('ok');
    expect(result.message).to.equal('season stats only');
    expect(result.data).to.have.length(30);
    stubFind.restore();
    stubMeta.restore();
  });
});