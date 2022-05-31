const logger = require('../../utilities/logger')('APC_SERVICE');
const XMLHttpRequest = require('xhr2');

const natsMessageHandler = (message) => {
  if (!global.cache) {
    return;
  }

  const msgObj = JSON.parse(message);
  if (msgObj.type === 'FACTOR_THICKNESS') {
    global.cache.set('FACTOR_THICKNESS', msgObj.factor);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:8123/thickness");
    xhr.send();

    logger.info(`receive thickness factor: ${msgObj.factor}`);
  } else if (msgObj.type === 'FACTOR_MOISTURE') {
    global.cache.set('FACTOR_MOISTURE', msgObj.factor);

    var xhr = new XMLHttpRequest();
    xhr.open("GET", "http://localhost:8123/moisture");
    xhr.send();

    logger.info(`receive moisture factor: ${msgObj.factor}`);
  }
};

module.exports = {
  natsMessageHandler,
};
