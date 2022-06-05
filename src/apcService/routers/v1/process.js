const express = require('express');

const { strategyOfType } = require('../../utilities/strategyUtil');

const db = require('../../../utilities/db');
const logger = require('../../../utilities/logger')('APC_SERVICE');
const metrics = require("../../../utilities/metrics");

const router = express.Router();

router.post('/api/v1/process', async (req, res) => {
  const timer = metrics.httpRequestTimer.startTimer();
  const steakCounter = metrics.steakTypeCounter;

  const { id, type, thickness, moisture } = req.body;

  const handle = logger.begin({
    id,
    type,
    thickness,
    moisture,
  });

  try {
    const factors = db.getCollection('factors');
    if (!factors) {
      throw new Error('The database is not connected.');
    }
    const tFactor = (await factors.findOne({name: 'FACTOR_THICKNESS'})).value;
    const mFactor = (await factors.findOne({name: 'FACTOR_MOISTURE'})).value;

    let strategy = strategyOfType(type);
    let data = strategy({thickness, tFactor, moisture, mFactor});

    logger.end(handle, { tFactor, mFactor, ...data }, `process (${id}) of APC has completed`);

    timer({route:req.route.path, code:res.statusCode, method:req.method})//collect http request info to prometheus
    steakCounter.inc({ type: type, success: true });//collect steak type info to prometheus
    return res.status(200).send({ ok: true, data: { ...data, tFactor, mFactor } });
  } catch (err) {

    logger.fail(handle, { tFactor, mFactor }, err.message);
    timer({route:req.route.path, code:res.statusCode, method:req.method})//collect http request info to prometheus
    steakCounter.inc({ type: type, success: false });//collect steak type info to prometheus

    return res.status(500).send({ ok: false, message: err.message });
  }
});

module.exports = router;
