<template lang="">
  <div> <div style="min-height: 48px"></div> <div class="mobile-navbar-wrap"
  style="position: fixed; top: 0rem; z-index: 1000"> <header class="mobile-navbar"> <div
  class="navbar-wraper"> <a href="/" class="mobile-navbar-logo"> <img
  src="@/assets/images/logo-white.png" alt="" srcset="" /> </a> <div
  class="mobile-navbar-right"> <span class="x-icon-search" @click="$router.push({ name:
  'search' })"></span> <span v-if="isAuthenticated" class="x-login-yes"> <span
  class="x-btn-deposit"> <span class="x-btn-text" @click="$router.push({ name:
  'account-deposit' })" >Deposit</span > <div class="avatar-box" @click="$router.push({
  name: 'account-me' })"> <span class="currency">NGN</span> <span> {{ balance }}</span>
  </div> </span> </span> <div v-else class="x-login-not"> <div class="x-btn-join-now">
  <router-link :to="{ name: 'sign-up' }">Join Now</router-link> </div> <div
  class="x-btn-login"> <router-link :to="{ name: 'sign-in' }">Log in</router-link> </div>
  </div> </div> </div> </header> <div class="drawer langs-drawer" style="display: none">
  <div class="drawer__mask"></div> </div> </div> </div>
</template>
<script setup>
import { useAuthStore, useUsersStore } from "@/stores";
import { computed } from "vue";
const { isAuthenticated } = useAuthStore();
const usersStore = useUsersStore();

const balance = computed(() => {
  if (usersStore.currentUser) {
    return usersStore.balance.toLocaleString("en");
  }
  return "0.00";
});
</script>
<style scoped>
@import "@/assets/css/header-home.css";
</style>
