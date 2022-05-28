const db = require('../../utilities/db');
const logger = require('../../utilities/logger')('APC_SERVICE');

const natsMessageHandler = (message) => {
  const parameters = db.getCollection('factor_parameters');
  if (!parameters) {
    return;
  }

  const msgObj = JSON.parse(message);
  if (msgObj.type === 'FACTOR_THICKNESS' || msgObj.type === 'FACTOR_MOISTURE') {
    parameters.updateOne(
      { name: msgObj.type },
      { $set: { name: msgObj.type, value: msgObj.factor } },
      { upsert: true },
    );

    logger.info(`receive ${msgObj.type} factor: ${msgObj.factor}`);
  }
};

module.exports = {
  natsMessageHandler,
};
