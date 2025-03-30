import './assets/css/base.css'
import './assets/css/main.css'
import './assets/css/loading.css'
import {
  createApp
} from 'vue'
import {
  createPinia
} from 'pinia'
import {
  createPahoMqttPlugin
} from 'vue-paho-mqtt'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VOtpInput from 'vue3-otp-input'
import VueDatePicker from '@vuepic/vue-datepicker'
import applyBranding from './helpers/utils'
import Vue3Marquee from 'vue3-marquee'
import { $mqtt } from 'vue-paho-mqtt'

import App from './App.vue'
import router from './router'
import {
  VueQueryPlugin
} from 'vue-query'

const startApp = async () => {
  try {
    const app = createApp(App)
    const pinia = createPinia()
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    await applyBranding()

    app.use(router)
    app.use(VueQueryPlugin)
    app.use(Vue3Marquee)

    // Configure MQTT client
    // const mqttPlugin = createPahoMqttPlugin({
    //   PluginOptions: {
    //     autoConnect: true,
    //     showNotifications: false,
    //     debug: true,
    //     onConnectionLost: (responseObject) => {
    //       console.log('MQTT connection lost:', responseObject)
    //     },
    //     onMessageArrived: (message) => {
    //       console.log('MQTT message arrived:', message.destinationName)
    //     },
    //     onConnect: () => {
    //       console.log('MQTT connected successfully')
    //     }
    //   },

    //   MqttOptions: {
    //     host: '206.189.229.191',
    //     port: 8083,
    //     clientId: import.meta.env.VITE_MQTT_CLIENTID + '-' + Math.random().toString(16).substr(2, 8),
    //     username: import.meta.env.VITE_MQTT_USERNAME,
    //     password: import.meta.env.VITE_MQTT_PASSWORD,
    //     mainTopic: 'feeds',
    //   },
    // })

    // app.use(mqttPlugin)

    app.component('v-otp-input', VOtpInput)
    app.component('VueDatePicker', VueDatePicker)

    // await $mqtt.connect()

    app.mount('#app')
  } catch (error) {
    console.error('Failed to load app:', error)
  }
}

  ; (async () => {
    await startApp()
  })()
