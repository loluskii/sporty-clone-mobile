import {
  defineStore
} from "pinia";

import {
  login,
  getUserActiveBonus,
  getUserCashbackBonus
} from "@/helpers";
import {
  getActivePinia
} from "pinia";
import {
  useUsersStore
} from "@/stores";
import router from "../router";

export const useAuthStore = defineStore({
  id: "auth",
  state: () => ({
    mobile_number: null,
    token: null,
    returnUrl: null,
    loading: false,
    authError: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async doLogin(payload) {
      this.loading = true;
      this.authError = "";
      try {
        const res = await login(payload);
        if (res.data && res.data.token) {
          this.token = res.data.token;
          this.mobile_number = payload.username;
          const userStore = useUsersStore();
          const safeLoad = (promise) => promise.catch(err => {
            console.error('Data loading failed:', err);
            return null;
          });
          
          const [, , cashbackData] = await Promise.all([
            safeLoad(userStore.loadCurrentUser()),
            safeLoad(getUserActiveBonus()),
            safeLoad(getUserCashbackBonus())
          ]);
          if (cashbackData?.data) {
            userStore.activeCashback = cashbackData.data;
          }
          this.loading = false;
          return router.push(this.returnUrl || '/');
        } else {
          throw new Error(res.error || 'Login failed');
        }
      } catch (error) {
        this.loading = false;
        this.authError = error.message || 'Login failed';
        console.error('Login error:', error);
      }
    },
    clearStores() {
      // map through that list and use the **$reset** fn to reset the state
      getActivePinia()._s.forEach((store) => store.$reset())
    },
    async logout() {
      this.token = null;
      this.mobile_number = null;
      this.clearStores();
      window.location.href = "/"
    },
  },
  persist: {
    storage: localStorage,
  },
});