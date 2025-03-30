// src/services/mqttService.js
import mqtt from 'mqtt'
import { ref } from 'vue'

// Singleton MQTT client
let mqttClient = null
const isConnected = ref(false)
const connectionError = ref(null)

// Map of topic subscriptions
const subscriptions = new Map()

export function useMqttService() {
  const connect = () => {
    // console.log('🔄 MQTT: Attempting to connect or reuse existing connection')
    
    if (mqttClient) {
      // console.log('✅ MQTT: Reusing existing connection')
      return mqttClient
    }
    
    const clientId = import.meta.env.VITE_MQTT_CLIENTID + '-' + Math.random().toString(16).substr(2, 8)
    const host = '206.189.229.191'
    const port = '8083'
    const connectUrl = `ws://${host}:${port}/mqtt`
    
    // console.log(`🔌 MQTT: Creating new connection to ${connectUrl} with clientId ${clientId}`)
    
    mqttClient = mqtt.connect(connectUrl, {
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
      
      // Resubscribe to all topics
      if (subscriptions.size > 0) {
        // console.log(`🔄 MQTT: Resubscribing to ${subscriptions.size} topics after connection`)
        subscriptions.forEach((callbacks, topic) => {
          // console.log(`📩 MQTT: Resubscribing to topic: ${topic}`)
          mqttClient.subscribe(topic)
        })
      }
    })
    
    mqttClient.on('message', (topic, message) => {
      // console.log(`📨 MQTT: Message received on topic: ${topic}`)
      
      // Find callbacks for this topic
      const callbacks = subscriptions.get(topic) || []
      
      // console.log(`🔔 MQTT: Notifying ${callbacks.length} callbacks for topic: ${topic}`)
      
      // Call all callbacks with the message
      callbacks.forEach((callback, index) => {
        try {
          // console.log(`⚙️ MQTT: Executing callback #${index + 1} for topic: ${topic}`)
          callback(JSON.parse(message.toString()))
        } catch (error) {
          // console.error(`❌ MQTT: Error processing message for topic ${topic}:`, error)
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
    // console.log(`📝 MQTT: Component requesting subscription to topic: ${topic}`)
    
    connect()
    
    // Add callback to subscriptions map
    if (!subscriptions.has(topic)) {
      // console.log(`🆕 MQTT: First subscription to topic: ${topic}`)
      subscriptions.set(topic, [])
      
      // console.log(`📩 MQTT: Subscribing to MQTT topic: ${topic}`)
      mqttClient.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ MQTT: Error subscribing to topic ${topic}:`, err)
        } else {
          console.log(`✅ MQTT: Successfully subscribed to topic: ${topic}`)
        }
      })
    } else {
      // console.log(`📊 MQTT: Adding another callback to existing topic: ${topic}`)
    }
    
    const callbackIndex = subscriptions.get(topic).length
    subscriptions.get(topic).push(callback)
    console.log(`✅ MQTT: Added callback #${callbackIndex + 1} to topic: ${topic}`)
    
    // Return unsubscribe function
    const unsubscribeFunction = () => {
      // console.log(`🗑️ MQTT: Component requesting to unsubscribe from topic: ${topic}`)
      
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
        } else {
          // console.log(`📊 MQTT: ${callbacks.length} callbacks still active for topic: ${topic}`)
        }
      } else {
        // console.warn(`⚠️ MQTT: Callback not found for topic: ${topic}`)
      }
    }
    
    // console.log(`🔙 MQTT: Returning unsubscribe function for topic: ${topic}`)
    return unsubscribeFunction
  }
  
  return {
    isConnected,
    connectionError,
    subscribe
  }
}