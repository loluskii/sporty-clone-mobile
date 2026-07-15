import mqtt from 'mqtt'
import { ref } from 'vue'

const isConnected = ref(false)
const subscriptions = new Map()
let mqttClient = null

export function useMqttService() {
  const connect = () => {
    if (mqttClient) {
      // console.log('🔵 MQTT: Reusing existing connection')
      return mqttClient
    }

    const clientId = `${import.meta.env.VITE_MQTT_CLIENTID}-${Math.random().toString(36).substr(2, 9)}`
    const mqttUrl = import.meta.env.VITE_MQTT_URI || 'wss://emqx-prod.sportsbookengine.com/mqtt'
    const username = "gaming"
    const password = "sbegaming"

    mqttClient = mqtt.connect(mqttUrl, {
      clientId,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30000,
      username,
      password
    })

    mqttClient.on('connect', () => {
      console.log('🔵 MQTT Connected successfully')
      isConnected.value = true

      // Resubscribe to existing topics
      if (subscriptions.size > 0) {
        // console.log('🔵 MQTT: Resubscribing to', subscriptions.size, 'topic(s)')
        subscriptions.forEach((_, topic) => {
          mqttClient.subscribe(topic, (err) => {
            if (err) {
              console.error('❌ MQTT: Failed to subscribe to', topic, err)
            } else {
              // console.log('✅ MQTT: Resubscribed to', topic)
            }
          })
        })
      }
    })

    mqttClient.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString())
        // Find all callbacks that match this topic
        // Note: MQTT broker sends specific topics (e.g. "sports/1/match/123/markets")
        // but subscriptions use wildcards (e.g. "sports/1/match/#")
        const matchingCallbacks = []

        subscriptions.forEach((callbacks, subscribedTopic) => {
          // Check if subscription pattern matches the incoming topic
          if (subscribedTopic.endsWith('/#')) {
            // Wildcard subscription: check if topic starts with the pattern
            const pattern = subscribedTopic.slice(0, -2) // Remove '/#'
            if (topic.startsWith(pattern + '/')) {
              matchingCallbacks.push(...callbacks)
            }
          } else if (subscribedTopic === topic) {
            // Exact match (in case we ever use non-wildcard subscriptions)
            matchingCallbacks.push(...callbacks)
          }
        })

        // Call all matching callbacks immediately
        // Pass both data and topic to callbacks for routing
        // Component-level filtering (by match_id) + Vue's reactivity handles batching
        matchingCallbacks.forEach((callback) => {
          try {
            callback(data, topic)
          } catch (error) {
            console.error(`❌ MQTT: Error in callback for ${topic}:`, error)
          }
        })
      } catch (error) {
        // Silent fail for message parsing errors
      }
    })

    mqttClient.on('error', () => {
      // Silent fail for MQTT errors
    })

    mqttClient.on('close', () => {
      isConnected.value = false
    })

    return mqttClient
  }

  const subscribe = (topic, callback) => {
    connect()

    if (!subscriptions.has(topic)) {
      subscriptions.set(topic, [])
      // console.log('🔵 MQTT: New subscription to topic:', topic)
      mqttClient.subscribe(topic, (err) => {
        if (err) {
          console.error('❌ MQTT: Failed to subscribe to', topic, err)
        } else {
          // console.log('✅ MQTT: Successfully subscribed to', topic)
        }
      })
    } else {
      // Only log in development to reduce noise
      const callbackCount = subscriptions.get(topic).length
      // console.log(`🔵 MQTT: Adding callback #${callbackCount + 1} to existing subscription: ${topic}`)
    }

    const callbacks = subscriptions.get(topic)
    callbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = subscriptions.get(topic) || []
      const index = callbacks.indexOf(callback)

      if (index !== -1) {
        callbacks.splice(index, 1)

        if (callbacks.length === 0) {
          // console.log('🧹 MQTT: Unsubscribing from topic (no more callbacks):', topic)
          mqttClient?.unsubscribe(topic)
          subscriptions.delete(topic)
        }
      }
    }
  }

  return {
    isConnected,
    subscribe
  }
}
