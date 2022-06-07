const logger = require('./logger')('DB');
const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('config').db;

const client = new MongoClient(process.env.MONGODB_SERVICE_CONNECTION || dbConfig.url);
let db = undefined;

const connect = () => {
  if (db) return db;
  // connect to MongoDB
  client.connect();
  db = client.db(dbConfig.dbName);

  logger.info('MongoDB successfully connected!');

  for (const [key, value] of Object.entries(dbConfig.initValue)) {
    logger.info(`init default value: ${key}=${value}`);
    // reset or insert init value
    getCollection('factors').updateOne(
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

const getCollection = (collectionName) => {
  if (!db) {
    logger.error('The database is not connected, you should call `connect()` first.');
    return;
  }
  return db.collection(collectionName);
}

module.exports = {
  connect,
  disconnect,
  getCollection,
};
