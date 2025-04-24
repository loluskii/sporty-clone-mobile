import './assets/css/base.css'
import './assets/css/main.css'
import './assets/css/loading.css'
import {
  createApp
} from 'vue'
import {
  createPinia
} from 'pinia'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import VOtpInput from 'vue3-otp-input'
import VueDatePicker from '@vuepic/vue-datepicker'
import applyBranding from './helpers/utils'
import Vue3Marquee from 'vue3-marquee'

import App from './App.vue'
import router from './router'
import {
  VueQueryPlugin
} from 'vue-query'

const startApp = async () => {
  try {
    const app = createApp(App)
    const pinia = createPinia()
    
    // Add performance monitoring
    app.config.performance = true
    
    pinia.use(piniaPluginPersistedstate)
    app.use(pinia)
    
    // Add error boundary
    app.config.errorHandler = (err, vm, info) => {
      console.error('Vue error:', err)
      // Handle error appropriately
    }
    
    await applyBranding()
    app.use(router)
    app.use(VueQueryPlugin)
    app.use(Vue3Marquee)

    // Lazy load components
    app.component('v-otp-input', () => import('vue3-otp-input'))
    app.component('VueDatePicker', () => import('@vuepic/vue-datepicker'))

    app.mount('#app')
  } catch (error) {
    console.error('Failed to load app:', error)
  }
}

// Add performance monitoring
const startTime = performance.now()
startApp().then(() => {
  const loadTime = performance.now() - startTime
  console.log('App initialization time:', loadTime)
})
