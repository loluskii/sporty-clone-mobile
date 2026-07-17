import { defineStore } from 'pinia'

import { login, getUserActiveBonus, getUserCashbackBonus } from '@/helpers'
import { getActivePinia } from 'pinia'
import { useUsersStore } from '@/stores'
import router from '../router'
import Cookies from 'js-cookie'

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    mobile_number: null,
    isAuthenticated: null,
    returnUrl: null,
    loading: false,
    authError: null
  }),
  getters: {
    isTokenValid: () => Boolean(Cookies.get('SBE-TOKEN'))
  },
  actions: {
    async doLogin(payload) {
      this.loading = true
      this.authError = ''
      try {
        const res = await login(payload)
        const token = res?.data?.token ?? res?.token
        if (token) {
          this.isAuthenticated = true
          Cookies.set('SBE-TOKEN', token, {
            expires: 7, // 7 days
            // secure: true, // Only send over HTTPS
            sameSite: 'strict' // CSRF protection
          })
          this.mobile_number = payload.username
          const userStore = useUsersStore()
          const safeLoad = (promise) =>
            promise.catch((err) => {
              console.error('Data loading failed:', err)
              return null
            })

          const [, activeBonus, cashbackData] = await Promise.all([
            safeLoad(userStore.loadCurrentUser()),
            safeLoad(getUserActiveBonus()),
            safeLoad(getUserCashbackBonus())
          ])

          if(activeBonus?.data){
            let bonusIsCasino = ["feature_trigger", "free_rounds"].includes(activeBonus?.data?.bonusType)
            if(bonusIsCasino){
              userStore.casinoActiveBonus = activeBonus?.data
            }else{
              userStore.activeBonus = activeBonus?.data
            }
            userStore.activeCashback = userStore.currentUser.sportBonusBalance > 0 ? null : cashbackData
          }else{
            userStore.activeCashback = cashbackData?.data;
          }

          this.loading = false
          const redirectTo = typeof this.returnUrl === 'string' && this.returnUrl ? this.returnUrl : '/'
          this.returnUrl = null
          return router.push(redirectTo)
        } else {
          throw new Error(res?.error || res?.message || 'Login failed')
        }
      } catch (error) {
        this.loading = false
        this.authError = error.message || 'Login failed'
        console.error('Login error:', error)
      }
    },
    clearStores() {
      // map through that list and use the **$reset** fn to reset the state
      getActivePinia()._s.forEach((store) => store.$reset())
    },
    async logout() {
      Cookies.remove('SBE-TOKEN')
      this.mobile_number = null
      this.clearStores()
      window.location.href = '/'
    }
  },
  persist: {
    storage: localStorage
  }
})
