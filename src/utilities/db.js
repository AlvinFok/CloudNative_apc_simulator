const logger = require('./logger')('DB');
const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('config').db;

const client = new MongoClient(dbConfig.url);
var _db = undefined;

function connect() {
  if (_db && _db.serverConfig.isConnected()) return;
  logger.info('MongoDB successfully connected!');
  // connect to MongoDB
  client.connect();
  _db = client.db('apc');
  c_parameters = _db.collection('factor_parameters');
  for (const [key, value] of Object.entries(dbConfig.initValue)) {
    logger.info(`init default value: ${key}=${value}`);
    // reset or insert init value
    c_parameters.updateOne(
      { name: key },
      { $set: { name: key, value: value } },
      { upsert: true },
    );
  }
}

function disconnect() {
  if (!_db || !_db.serverConfig.isConnected()) return;
  logger.info('MongoDB successfully disconnected!');
  _db.close();
}

module.exports = {
  connect,
  disconnect,
  db: _db,
};
