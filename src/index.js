const dotenv = require('dotenv');
dotenv.config();

const { nats } = require('config');

const NodeCache = require('node-cache');

const logger = require('./utilities/logger')('INDEX');
const NATSClient = require('./utilities/natsClient');
const db = require('./utilities/db');

const measureService = require('./measureService');
const apcService = require('./apcService');
const paramsService = require('./paramsService');
const metrics = require('./utilities/metrics')

let measureHandle = null;
let paramsHandle = null;

const initGlobalNATSClient = async () => {
  // instantiate the nats client
  global.natsClient = NATSClient.instance();

  const connection = process.env.NATS_SERVICE_CONNECTION || nats.connection;

  logger.info(`nats-server connection: ${connection}`);

  await global.natsClient.connect(nats.name, [connection]);

  // clear stream and consumer by existence
  let stream = await global.natsClient.getStream(nats.stream);
  if (stream) {
    let consumer = await global.natsClient.getConsumer(nats.stream, `${nats.consumer}_params`);
    if (consumer) {
      await global.natsClient.deleteConsumer(nats.stream, `${nats.consumer}_params`);
    }
    await global.natsClient.deleteStream(nats.stream);
  }

  // add the stream
  await global.natsClient.addStream(nats.stream, [`${nats.subject}.>`]);

  // add the consumer
  await global.natsClient.addConsumer(nats.stream, `${nats.subject}.params`, `${nats.consumer}_params`);
};

const run = async () => {
  // connect to MongoDB
  db.connect();

  // initialize the global resource
  await initGlobalNATSClient();

  // run all services
  await apcService.run();
  paramsHandle = await paramsService.run();
  measureHandle = await measureService.run();
  metrics.run();
};

run();

process.on('SIGINT', async () => {
  db.disconnect();

  if (global.natsClient) {
    await global.natsClient.disconnect();
    global.natsClient = null;
  }

  if (paramsHandle) {
    clearInterval(paramsHandle);
  }

  if (measureHandle) {
    clearInterval(measureHandle);
  }

  process.exit();
});
