const express = require('express');
const client = require('prom-client')
const logger = require('./logger')('METRICS');


const app = express();

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

const natClientTimer = new client.Histogram({
    name: 'nat_client_operation_duration_seconds',
    help: 'Duration of nat client operation in seconds',
    labelNames: ['method', 'success']
})

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
    
    databaseResponseTimeHistogram,
    httpRequestTimer,
    steakTypeCounter,
    natClientTimer
    };




// const Gauge = require('../').Gauge;
const g = new client.Gauge({
    name: 'test_gauge',
    help: 'Example of a gauge',
    labelNames: ['method', 'code'],
});
