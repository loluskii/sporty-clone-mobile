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
            <img src="/logos.png" alt="" />
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
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M4 5.75A2.75 2.75 0 0 1 6.75 3h10.5A2.75 2.75 0 0 1 20 5.75v8.5A2.75 2.75 0 0 1 17.25 17H9.4L5.5 20.25a.75.75 0 0 1-1.25-.57V17A2.75 2.75 0 0 1 4 14.25v-8.5Zm2.75-1.25A1.25 1.25 0 0 0 5.5 5.75v8.5A1.25 1.25 0 0 0 6.75 15.5h1.5V18l3-2.5h5.25a1.25 1.25 0 0 0 1.25-1.25v-8.5a1.25 1.25 0 0 0-1.25-1.25H6.75Z"
                    />
                  </svg>
                </router-link>
                <router-link
                  :to="{ name: 'account-deposit' }"
                  class="header-action-icon header-action-icon--deposit"
                  aria-label="Deposit"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12 3.25c.69 0 1.25.56 1.25 1.25v5.25h5.25a1.25 1.25 0 1 1 0 2.5h-5.25v5.25a1.25 1.25 0 1 1-2.5 0v-5.25H5.75a1.25 1.25 0 1 1 0-2.5h5.25V4.5c0-.69.56-1.25 1.25-1.25Z"
                    />
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

  // Load user data if authenticated
  if (authStore.isAuthenticated) {
    usersStore.loadCurrentUser()
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
