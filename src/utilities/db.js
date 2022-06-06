const logger = require('./logger')('DB');
const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('config').db;
const metrics = require('./metrics');

const client = new MongoClient(dbConfig.url);
let db = undefined;

const connect = () => {
  const timer = metrics.databaseResponseTimeHistogram.startTimer();

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

  timer({operation:'connect', success:true});
  return db;
}

const disconnect = () => {
  const timer = metrics.databaseResponseTimeHistogram.startTimer();

  if (!db) return;
  logger.info('MongoDB successfully disconnected!');
  client.close();
  timer({operation:'disconnect', success:true});

}

const getCollection = (collectionName) => {
  const timer = metrics.databaseResponseTimeHistogram.startTimer();
  
  if (!db) {
    logger.error('The database is not connected, you should call `connect()` first.');
    return;
  }

  timer({operation:'getCollection', success:true});

  return db.collection(collectionName);
}

module.exports = {
  connect,
  disconnect,
  getCollection,
};
