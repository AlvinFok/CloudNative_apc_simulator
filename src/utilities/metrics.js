const express = require('express');
const client = require('prom-client')
const logger = require('./logger')('METRICS');


const app = express();

const restResponseTimeHistogram = new client.Histogram({
    name: 'rest_response_time_duration_seconds',
    help: 'REST API response time in second',
    labelNames: ['method', 'route', 'status_code']
});

const databaseResponseTimeHistogram = new client.Histogram({
    name: 'db_response_time_duration_seconds',
    help: 'Database API response time in second',
    labelNames: ['operation', 'success']
});



const httpRequestTimer = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10] // 0.1 to 10 seconds
});

const steakTypeCounter = new client.Counter({
    name: 'steak_type_counter',
    help: 'Counter of each type of steak',
    labelNames: ['type', 'success'],
});

const run = () =>{
    const collectDefaultMetrics = client.collectDefaultMetrics;
    collectDefaultMetrics();

    app.get("/metrics", async(req, res) =>{
        res.set("Content-Type", client.register.contentType);
        return res.send(await client.register.metrics());
    });

    app.listen(8001, ()=>{
        logger.info("Metrics server started at http://localhost:8001/metrics")
    });
}

module.exports = {
    run,
    restResponseTimeHistogram,
    databaseResponseTimeHistogram,
    httpRequestTimer,
    steakTypeCounter
    };




// const Gauge = require('../').Gauge;
const g = new client.Gauge({
    name: 'test_gauge',
    help: 'Example of a gauge',
    labelNames: ['method', 'code'],
});
