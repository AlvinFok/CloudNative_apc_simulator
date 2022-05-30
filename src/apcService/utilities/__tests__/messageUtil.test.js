const { natsMessageHandler } = require('../messageUtil');
const db = require('../../../utilities/db');

describe('Module messageUtil', () => {
  const fakeType = 'FACTOR_THICKNESS';
  const fakeFactor = 0.5;

  db.connect();

  it('Method natsMessageHandler for success', async () => {
    const factors = db.getCollection('factors');
    natsMessageHandler(
      JSON.stringify({
        type: fakeType,
        factor: fakeFactor,
      })
    );
    // wait for db init
    await new Promise(r => setTimeout(r, 3000));
    expect((await factors.findOne({name: fakeType}))?.value).toBe(fakeFactor);
  });

  it('Method natsMessageHandler for failed', async () => {
    const factors = db.getCollection('factors');
    natsMessageHandler(
      JSON.stringify({
        type: 'FAKE_TYPE',
        factor: fakeFactor,
      })
    );
    // wait for db init
    await new Promise(r => setTimeout(r, 3000));
    expect((await factors.findOne({name: fakeType})).value).toBe(fakeFactor);
    expect((await factors.findOne({name: 'FAKE_TYPE'}))).toBe(null);
  });
});

afterAll(done => {
  db.disconnect();
  done();
});
