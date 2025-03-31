import mqtt from 'mqtt'
import { ref } from 'vue'

const isConnected = ref(false)
const connectionError = ref(null)

const subscriptions = new Map()

export function useMqttService() {
  const connect = () => {

    if (mqttClient) {
      return mqttClient
    }

    const clientId = import.meta.env.VITE_MQTT_CLIENTID +
      "-" +
      Math.floor(Math.random() * (9 * Math.pow(10, n))) +
      Math.pow(10, n)
    const host = '206.189.229.191'
    const port = '8083'
    const connectUrl = `wss://${host}:${port}/mqtt`

    mqttClient = mqtt.connect(import.meta.env.VITE_MQTT_URI, {
      clientId,
      username: import.meta.env.VITE_MQTT_USERNAME,
      password: import.meta.env.VITE_MQTT_PASSWORD,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    })

    mqttClient.on('connect', () => {
      console.log('✅ MQTT: Connected successfully')
      isConnected.value = true
      connectionError.value = null

      if (subscriptions.size > 0) {
        subscriptions.forEach((callbacks, topic) => {
          mqttClient.subscribe(topic)
        })
      }
    })

    mqttClient.on('message', (topic, message) => {

      const callbacks = subscriptions.get(topic) || []
      callbacks.forEach((callback, index) => {
        try {
          callback(JSON.parse(message.toString()))
        } catch (error) {
          console.error(`❌ MQTT: Error processing message for topic ${topic}:`, error)
        }
      })
    })

    mqttClient.on('error', (error) => {
      console.error('❌ MQTT: Connection error:', error)
      connectionError.value = error
    })

    mqttClient.on('close', () => {
      console.log('🔌 MQTT: Connection closed')
      isConnected.value = false
    })

    return mqttClient
  }

  const subscribe = (topic, callback) => {
    connect()

    if (!subscriptions.has(topic)) {
      subscriptions.set(topic, [])
      mqttClient.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ MQTT: Error subscribing to topic ${topic}:`, err)
        } else {
          console.log(`✅ MQTT: Successfully subscribed to topic: ${topic}`)
        }
      })
    } else {
    }

    const callbackIndex = subscriptions.get(topic).length
    subscriptions.get(topic).push(callback)
    console.log(`✅ MQTT: Added callback #${callbackIndex + 1} to topic: ${topic}`)

    // Return unsubscribe function
    const unsubscribeFunction = () => {

      const callbacks = subscriptions.get(topic) || []
      const index = callbacks.indexOf(callback)

      if (index !== -1) {
        console.log(`🗑️ MQTT: Removing callback #${index + 1} from topic: ${topic}`)
        callbacks.splice(index, 1)

        // If no more callbacks, unsubscribe from topic
        if (callbacks.length === 0) {
          console.log(`🗑️ MQTT: No more callbacks for topic: ${topic}, unsubscribing`)
          mqttClient.unsubscribe(topic, (err) => {
            if (err) {
              console.error(`❌ MQTT: Error unsubscribing from topic ${topic}:`, err)
            } else {
              console.log(`✅ MQTT: Successfully unsubscribed from topic: ${topic}`)
            }
          })
          subscriptions.delete(topic)
        }
      }
    }

    return unsubscribeFunction
  }

  return {
    isConnected,
    connectionError,
    subscribe
  }
}