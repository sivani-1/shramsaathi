import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

let client = null;
let pendingSubscriptions = [];

export function connect() {
  if (client) return client;
  client = new Client({
    brokerURL: undefined,
    connectHeaders: {},
    debug: function () {
      // suppress verbose logging in prod
    },
    reconnectDelay: 5000,
    webSocketFactory: () => new SockJS('http://localhost:8083/ws'),
    onStompError: (frame) => {
      console.error('Broker reported error: ' + (frame.headers && frame.headers['message']));
    },
  });

  client.onConnect = () => {
    // flush pending subscriptions now that the connection is active
    pendingSubscriptions.forEach((p) => {
      try {
        const sub = client.subscribe(p.topic, (msg) => {
          try {
            const body = JSON.parse(msg.body);
            p.handler(body);
          } catch (e) {
            console.error('Failed to parse STOMP message', e);
          }
        });
        p._sub = sub;
      } catch (e) {
        console.error('Failed to subscribe to', p.topic, e);
      }
    });
    // keep pendingSubscriptions entries so callers can unsubscribe later via the returned object
  };

  client.activate();
  return client;
}

/**
 * Subscribe to a STOMP topic. If the client is not yet connected, subscription is queued
 * and the returned object provides an unsubscribe() method to cancel before connection.
 */
export function subscribe(topic, handler) {
  if (!client) {
    // ensure connect() called lazily
    connect();
  }

  // If connected, subscribe immediately
  if (client && client.connected) {
    const sub = client.subscribe(topic, (msg) => {
      try {
        const body = JSON.parse(msg.body);
        handler(body);
      } catch (e) {
        console.error('Failed to parse STOMP message', e);
      }
    });
    return sub;
  }

  // Otherwise queue the subscription and return a handle with unsubscribe()
  const pending = { topic, handler, _sub: null };
  pendingSubscriptions.push(pending);

  return {
    unsubscribe: () => {
      // if not yet subscribed, remove from pending queue
      const idx = pendingSubscriptions.indexOf(pending);
      if (idx !== -1) {
        pendingSubscriptions.splice(idx, 1);
      }
      // if already subscribed, unsubscribe underlying
      if (pending._sub) {
        try {
          pending._sub.unsubscribe();
        } catch (e) {
          // ignore
        }
      }
    },
  };
}

export function send(destination, payload) {
  if (!client || !client.connected) {
    console.warn('STOMP client not connected; cannot send to', destination);
    return;
  }
  try {
    client.publish({ destination, body: JSON.stringify(payload) });
  } catch (e) {
    console.error('Failed to publish STOMP message', e);
  }
}

export function disconnect() {
  if (!client) return;
  try {
    client.deactivate();
  } catch (e) {
    // ignore
  }
  client = null;
  pendingSubscriptions = [];
}
