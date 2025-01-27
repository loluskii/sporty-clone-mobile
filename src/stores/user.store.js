import { defineStore } from 'pinia'

import { getUserDetailsByToken, formatNumber } from '@/helpers'
import { getUserActiveBonus } from '../helpers'

export const useUsersStore = defineStore({
  id: 'users',
  state: () => ({
    currentUser: null,
    activeBonus: null,
    casinoActiveBonus: null
  }),
  getters: {
    balance: (state) => (state.currentUser ? state.currentUser.availableBalance : 0),
    details: (state) => (state.currentUser ? state.currentUser : null),
    bonus: (state) => (state.activeBonus ? state.activeBonus : null),
    sportBonusBalance: (state) => (state.currentUser ? state.currentUser.sportBonusBalance : 0),
    casinoBonusBalance: (state) => (state.currentUser ? state.currentUser.casinoBonusBalance : 0),
    virtualBonusBalance: (state) => (state.currentUser ? state.currentUser.virtualBonusBalance : 0),
    TrustBalance: (state) => (state.currentUser ? state.currentUser.trustBalance : 0)
  },
  actions: {
    async loadCurrentUser() {
      // this.currentUser contains all user properties. E.g. this.currentUser.first_name
      const res = await getUserDetailsByToken()
      this.currentUser = res.data
    },
    setActiveBonus(bonus) {
      this.activeBonus = bonus;
    }, 
    async getActiveBonus() {
      const res = await getUserActiveBonus()
      if(res && res.data){
        this.casinoActiveBonus = res.data
      }
    }
  },
  persist: {
    storage: localStorage
  }
})
