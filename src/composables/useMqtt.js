// src/composables/useMqtt.js
import mqtt from 'mqtt';
import { ref, onMounted, onUnmounted } from 'vue';

export function useMqtt({ uri, options = {}, topicHandlers = [], onConnectedHandler = (client) => {}, type }) {
  const client = ref(null);

  const connect = () => {
    if (client.value) return;

    try {
      client.value = mqtt.connect(uri, options);
    } catch (error) {
      console.error("MQTT connection error", error);
    }

    client.value.on('connect', () => {
      console.log('MQTT connected successfully');
      if (onConnectedHandler) onConnectedHandler(client.value);
    });

    client.value.on('message', (topic, rawPayload, packet) => {
      let finalTopic;
      const splitTopic = topic.split('/');
      if (splitTopic[2] === 'odds_change') {
        finalTopic = 'feeds/live/odds_change/+';
      } else {
        finalTopic = 'feeds/live/bet_stop/+';
      }

      const handler = topicHandlers.find(th => th.topic === finalTopic);
      let payload;
      try {
        payload = JSON.parse(rawPayload);
        console.log(payload);
      } catch {
        payload = rawPayload;
      }

      if (handler) handler.handler({ topic, payload, packet });
    });

    topicHandlers.forEach(th => {
      client.value.subscribe(th.topic);
    });

    if (type !== 'live') {
      topicHandlers.forEach(th => {
        client.value.unsubscribe(th.topic);
      });
      client.value.end();
    }
  };

  onMounted(connect);

  onUnmounted(() => {
    if (client.value) {
      topicHandlers.forEach(th => {
        client.value.unsubscribe(th.topic);
      });
      client.value.end();
    }
  });
}

export default useMqtt;
