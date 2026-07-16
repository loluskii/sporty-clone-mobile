<template>
  <div>
    <!-- Spacer div to match header height -->
    <div :style="`min-height: ${headerHeight}`"></div>
    <div
      ref="myHeader"
      class="mobile-navbar-wrap"
      style="position: fixed; top: 0rem; z-index: 1000"
    >
      <header class="mobile-navbar">
        <div class="navbar-wraper">
          <a href="/" class="mobile-navbar-logo">
            <img src="/logo.png" alt="" />
          </a>
          <div class="mobile-navbar-right">
            <span class="x-icon-search" @click="$router.push({ name: 'search' })"></span>
            <span v-if="authStore.isAuthenticated" class="x-login-yes">
              <span class="x-btn-deposit">
                <router-link
                  :to="{ name: 'notifications' }"
                  class="header-action-icon header-action-icon--messages"
                  aria-label="Messages"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" color="#ffffff" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M15.5 18C15.5 19.933 13.933 21.5 12 21.5C10.067 21.5 8.5 19.933 8.5 18"></path>
    <path d="M19.2311 18H4.76887C3.79195 18 3 17.208 3 16.2311C3 15.762 3.18636 15.3121 3.51809 14.9803L4.12132 14.3771C4.68393 13.8145 5 13.0514 5 12.2558V9.5C5 5.63401 8.13401 2.5 12 2.5C15.866 2.5 19 5.634 19 9.5V12.2558C19 13.0514 19.3161 13.8145 19.8787 14.3771L20.4819 14.9803C20.8136 15.3121 21 15.762 21 16.2311C21 17.208 20.208 18 19.2311 18Z"></path>
</svg>
                </router-link>
                <div class="avatar-box" @click="$router.push({ name: 'account-me' })">
                  <span class="currency">{{ SportsbookGlobalVariable.Currency }}</span>
                  <span> {{ usersStore.balance }}</span>
                </div>
              </span>
            </span>
            <div v-else class="x-login-not">
              <div class="x-btn-join-now">
                <router-link :to="{ name: 'sign-up' }">Join Now</router-link>
              </div>
              <div class="x-btn-login">
                <router-link :to="{ name: 'sign-in' }">Log in</router-link>
              </div>
            </div>
          </div>
        </div>
      </header>
      <div class="drawer langs-drawer" style="display: none">
        <div class="drawer__mask"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore, useUsersStore } from '@/stores'
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useUtilsStore } from '../stores'

const authStore = useAuthStore()
const usersStore = useUsersStore()
const { SportsbookGlobalVariable } = useUtilsStore()
const myHeader = ref()
const headerHeight = ref('48px')
// Create a ResizeObserver to dynamically track header height
const resizeObserver = new ResizeObserver(() => {
  if (myHeader.value) {
    headerHeight.value = `${myHeader.value.offsetHeight}px`
  }
})

onMounted(() => {
  // Observe the header element
  if (myHeader.value) {
    resizeObserver.observe(myHeader.value)
  }
})

onBeforeUnmount(() => {
  // Disconnect the observer when the component is unmounted
  resizeObserver.disconnect()
})
</script>

<style scoped>
@import '@/assets/css/header-home.css';
</style>
