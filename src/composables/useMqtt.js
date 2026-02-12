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
    const host = import.meta.env.VITE_MQTT_HOST
    const port = import.meta.env.VITE_MQTT_PORT
    const mqttUrl = "wss://emqx.prod.sportsbookengine.com/mqtt"
    const username = "feeds"
    const password = "sportsbook123"

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
        console.error(`❌ MQTT: Error parsing message for ${topic}:`, error)
      }
    })

    mqttClient.on('error', (error) => {
      console.error('🔴 MQTT Error:', error)
    })

    mqttClient.on('close', () => {
      console.log('🟡 MQTT Disconnected')
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

// MQTT Data Flow
// Architecture Overview
// Single Wildcard Subscription Pattern: All components subscribe to the same wildcard topic sports/1/match/#, creating one MQTT subscription that receives all match updates.
// Data Flow Steps
// 1. MQTT Broker
//    ↓
//    Publishes message: sports/1/match/66196854/markets
//    {
//      match_id: 66196854,
//      market_id: 10,
//      outcomes: [{outcome_id: "9", odds: 1.21, active: 1}, ...]
//    }

// 2. useMqttService (Singleton)
//    ↓
//    mqttClient.on('message') receives the message
//    ↓
//    Parse JSON
//    ↓
//    Match topic against subscriptions:
//    - Subscription: "sports/1/match/#"
//    - Incoming: "sports/1/match/66196854/markets"
//    - Pattern: "sports/1/match/" ✅ matches!
//    ↓
//    Collect ALL callbacks registered to "sports/1/match/#"
//    ↓
//    Call each callback immediately (no queuing/batching)

// 3. Component Callbacks (Multiple components listening)
//    ↓
//    PrematchFixture #1 (matchId: 66196854)
//    - Receives message
//    - Checks: data.match_id === 66196854 ✅
//    - Calls handleMarketUpdate(data)
//    - Updates odds via requestAnimationFrame
   
//    PrematchFixture #2 (matchId: 99999999)
//    - Receives message
//    - Checks: data.match_id === 99999999 ❌
//    - Ignores silently
   
//    PrematchFixture #3 (matchId: 66196854)
//    - Receives message (same match, different component instance)
//    - Checks: data.match_id === 66196854 ✅
//    - Calls handleMarketUpdate(data)
//    - Updates odds via requestAnimationFrame

// 4. Component State Update
//    ↓
//    Updates updatedOutcomes ref with new odds
//    ↓
//    Updates visible outcomes array
//    ↓
//    Vue reactivity triggers re-render
//    ↓
//    Browser batches DOM updates in next frame
// Key Design Decisions
// Fan-out at Component Level: All components receive all messages, filter by match_id themselves
// No Service-Level Batching: Messages processed immediately upon arrival
// Component-Level Batching: Each component uses requestAnimationFrame to batch updates
// Single Subscription: One wildcard MQTT subscription shared by all components
// Efficient Cleanup: When last callback unsubscribes, MQTT topic is unsubscribed
// Performance Characteristics
// Latency: ~0ms (immediate callback invocation)
// Throughput: Limited only by MQTT client parsing speed
// Memory: O(n) where n = number of mounted components
// Network: Single subscription regardless of component count
