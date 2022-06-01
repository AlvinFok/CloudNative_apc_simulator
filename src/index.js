const dotenv = require('dotenv');
dotenv.config();

const { nats } = require('config');

const NodeCache = require('node-cache');

const logger = require('./utilities/logger')('INDEX');
const NATSClient = require('./utilities/natsClient');

const measureService = require('./measureService');
const apcService = require('./apcService');
const paramsService = require('./paramsService');

const express = require('express');
const Prometheus = require('prom-client');

let measureHandle = null;
let paramsHandle = null;

const app = express();
const port = 8123;
const metricsInterval = Prometheus.collectDefaultMetrics();
const counter = new Prometheus.Counter({
  name: 'myapp_requests',
  help: 'Demo counter metric to record request count',
  labelNames: ['factor'],
});
const gauge = new Prometheus.Gauge({ 
  name: 'myapp_factor',
  help: 'factor value',
  labelNames: ['factor'] ,
});

app.get('/thickness', (req, res, next) => {
  counter.labels("thickness").inc();
  gauge.labels("thickness").set(parseFloat(req.query.value));
});

app.get('/moisture', (req, res, next) => {
  counter.labels("moisture").inc();
  gauge.labels("moisture").set(parseFloat(req.query.value));
});

app.get('/metrics', (req, res) => {
  res.set('Content-Type', Prometheus.register.contentType);
  res.end(Prometheus.register.metrics());
});

// Error handler
app.use((err, req, res, next) => {
  res.statusCode = 500;
  // Do not expose your error in production
  res.json({ error: err.message });
  next();
});

const server = app.listen(port, () => {
  console.log(`listening on port ${port}`)
});

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

const initGlobalCache = async () => {
  global.cache = new NodeCache();

  global.cache.set('FACTOR_THICKNESS', 0.5);
  counter.labels("thickness").inc();
  gauge.labels("thickness").set(0.5);

  global.cache.set('FACTOR_MOISTURE', 0.5);
  counter.labels("moisture").inc();
  gauge.labels("moisture").set(0.5);
};

const run = async () => {
  // initialize the global resource
  await initGlobalNATSClient();
  await initGlobalCache();

  // run all services
  await apcService.run();
  paramsHandle = await paramsService.run();
  measureHandle = await measureService.run();
};

run();

process.on('SIGINT', async () => {
  if (global.cache) {
    await global.cache.close();
    global.cache = null;
  }

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

  if(metricsInterval) {
    clearInterval(metricsInterval);
  }
  
  server.close((err) => {
    if (err) {
      console.error(err);
    }
  })

  process.exit();
});