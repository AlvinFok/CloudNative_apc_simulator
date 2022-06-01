const express = require('express');

const { defaultStrategy, sharonStrategy } = require('../../utilities/strategyUtil');

const db = require('../../../utilities/db');
const logger = require('../../../utilities/logger')('APC_SERVICE');

const router = express.Router();

router.post('/api/v1/process', async (req, res) => {
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

    let data = null;
    if (type === 'SHARON') {
      data = sharonStrategy(thickness, tFactor);
    } else {
      data = defaultStrategy(moisture, mFactor);
    }

    logger.end(handle, { tFactor, mFactor, ...data }, `process (${id}) of APC has completed`);

    return res.status(200).send({ ok: true, data: { ...data, tFactor, mFactor } });
  } catch (err) {
    logger.fail(handle, { tFactor, mFactor }, err.message);

    return res.status(500).send({ ok: false, message: err.message });
  }
});

module.exports = router;
