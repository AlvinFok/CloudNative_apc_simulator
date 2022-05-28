const logger = require('./logger')('DB');
const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('config').db;

const client = new MongoClient(dbConfig.url);
let db = undefined;

const connect = () => {
  if (db) return db;
  logger.info('MongoDB successfully connected!');
  // connect to MongoDB
  client.connect();

  db = client.db(dbConfig.dbName);

  for (const [key, value] of Object.entries(dbConfig.initValue)) {
    logger.info(`init default value: ${key}=${value}`);
    // reset or insert init value
    db.collection('factor_parameters').updateOne(
      { name: key },
      { $set: { name: key, value: value } },
      { upsert: true },
    );
  }
  return db;
}

const disconnect = () => {
  if (!db) return;
  logger.info('MongoDB successfully disconnected!');
  client.close();
}

module.exports = {
  db,
  connect,
  disconnect,
};
