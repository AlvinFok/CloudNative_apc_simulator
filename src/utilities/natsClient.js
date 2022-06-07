const { connect, StringCodec, consumerOpts, credsAuthenticator, AckPolicy } = require('nats');

const logger = require('./logger')('NATSClient');
const metrics = require('./metrics');


class NATSClient {
  constructor() {
    this.nc = null;
    this.jsm = null;
    this.js = null;
    this.sc = StringCodec();
    this.subs = {};
    this.handler = null;
  }

  async connect(name, servers, creds = null, apiPrefix = null) {
    const timer = metrics.natClientTimer.startTimer();

    try {
      this.nc = await connect({
        name,
        servers,
        ...(creds ? { authenticator: credsAuthenticator(new TextEncoder().encode(creds)) } : {}),
      });

      this.jsm = await this.nc.jetstreamManager({
        ...(apiPrefix ? { apiPrefix } : {}),
      });

      this.js = await this.nc.jetstream({
        ...(apiPrefix ? { apiPrefix } : {}),
      });

      this.handler = setInterval(() => {
        for (let sub of Object.values(this.subs)) {
          sub.pull({ batch: 10, expires: 10000 });
        }
      }, 10000);
      timer({method:'connect', success:true});
      logger.info('Successfully connect to NATS', { module: 'natsClient', method: 'connect' });
    } catch (err) {
      timer({method:'connect', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'connect' });
      throw err;
    }
  }

  async disconnect() {
    const timer = metrics.natClientTimer.startTimer();

    try {
      // unsubscribe the subscription
      if (this.subs) {
        const subjects = Object.keys(this.subs);
        for (let subject of subjects) {
          await this.unsubscribe(subject);
        }
      }

      // clear the interval with handler
      if (this.handler) {
        clearInterval(this.handler);
      }

      // close the connection
      if (this.nc) {
        const done = this.nc.closed();
        await this.nc.close();

        const err = await done;
        if (err) {
          throw err;
        }
      }

      this.nc = null;
      this.jsm = null;
      this.js = null;
      this.subs = {};
      this.handler = null;
      timer({method:'disconnect', success:true});
      logger.info('Successfully disconnect to NATS', { module: 'natsClient', method: 'disconnect' });
    } catch (err) {
      timer({method:'disconnect', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'disconnect' });
      throw err;
    }
  }

  isConnected() {
    if (!this.nc) {
      return false;
    }
    return true;
  }

  async listStreams() {
    const timer = metrics.natClientTimer.startTimer();
    try {
      const res = await this.jsm.streams.list().next();
      timer({method:'listStreams', success:true});
      return res;
    } catch (err) {
      timer({method:'listStreams', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'listStreams' });

      return [];
    }
  }

  async getStream(stream) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      const res = await this.jsm.streams.info(stream);
      timer({method:'getStream', success:true});
      return res;
    } catch (err) {
      timer({method:'getStream', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'getStream' });

      return null;
    }
  }

  async addStream(stream, subjects) {
    const timer = metrics.natClientTimer.startTimer();

    try {
      const res = await this.jsm.streams.add({ name: stream, subjects });
      timer({method:'addStream', success:true});
      return res;
    } catch (err) {
      timer({method:'addStream', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'addStream' });

      throw err;
    }
  }

  async deleteStream(stream) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      const res = await this.jsm.streams.delete(stream);
      timer({method:'deleteStream', success:true});
      return res;
    } catch (err) {
      timer({method:'deleteStream', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'deleteStream' });

      return;
    }
  }

  async listConsumers(stream) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      const res = await this.jsm.consumers.list(stream).next();
      timer({method:'listConsumers', success:true});
      return res;
    } catch (err) {
      timer({method:'listConsumers', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'listConsumers' });

      return [];
    }
  }

  async getConsumer(stream, consumer) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      const res = await this.jsm.consumers.info(stream, consumer);
      timer({method:'getConsumer', success:true});
      return res;
    } catch (err) {
      timer({method:'getConsumer', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'getConsumer' });

      return null;
    }
  }

  async addConsumer(stream, subject, consumer) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      const res = await this.jsm.consumers.add(stream, {
        durable_name: consumer,
        ack_policy: AckPolicy.Explicit,
        filter_subject: subject,
      });
      timer({method:'addConsumer', success:true});
      return res;
    } catch (err) {
      timer({method:'addConsumer', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'addConsumer' });
      throw err;
    }
  }

  async deleteConsumer(stream, consumer) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      const res = await this.jsm.consumers.delete(stream, consumer);
      timer({method:'deleteConsumer', success:true});
      return res;
    } catch (err) {
      timer({method:'deleteConsumer', success:true});
      logger.error(err.message, { module: 'natsClient', method: 'deleteConsumer' });
      throw err;
    }
  }

  async publish(subject, obj) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      const pa = await this.js.publish(subject, this.sc.encode(JSON.stringify(obj)));
      timer({method:'publish', success:true});
      return pa;
    } catch (err) {
      timer({method:'publish', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'publish' });
      throw err;
    }
  }

  async subscribe(stream, subject, consumerName, callback) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      if (this.subs[subject]) {
        return;
      }

      if (!callback) {
        throw new Error('the callback is null');
      }

      const opts = consumerOpts();
      opts.manualAck();
      opts.ackExplicit();
      opts.filterSubject(subject);

      if (consumerName) {
        opts.durable(consumerName);
        opts.bind(stream, consumerName);
      }

      const sub = await this.js.pullSubscribe(subject, opts);
      this.subs[subject] = sub;

      const done = (async () => {
        for await (const m of sub) {
          callback(this.sc.decode(m.data));

          m.ack();
        }
      })();
      timer({method:'subscribe', success:true});
    } catch (err) {
      timer({method:'subscribe', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'subscribe' });
      throw err;
    }
  }

  async unsubscribe(subject) {
    const timer = metrics.natClientTimer.startTimer();
    try {
      if (!this.subs[subject]) {
        return;
      }

      await this.subs[subject].unsubscribe();
      await this.subs[subject].destroy();

      delete this.subs[subject];
      timer({method:'unsubscribe', success:true});
    } catch (err) {
      timer({method:'unsubscribe', success:false});
      logger.error(err.message, { module: 'natsClient', method: 'unsubscribe' });
    }
  }
}

NATSClient._instance = null;
NATSClient.instance = () => {
  if (!NATSClient._instance) {
    NATSClient._instance = new NATSClient();
  }
  return NATSClient._instance;
};

module.exports = NATSClient;
