<template>
  <div class="game-play">
    <template v-if="isLoading">
      <div>
        <img src="/logos.png" alt="" style="height: 50px" />
        <LoadingSpinner></LoadingSpinner>
      </div>
    </template>
    <div v-if="errorState" class="error-message">
      Failed to load Casino. Please try again later.
    </div>
    <!-- <iframe
      v-if="!isLoading"
      title="casino"
      style="border-style: none; width: 100%; height: calc(100% - 60px)"
      :src="gameURL"
    /> -->
  </div>
</template>

<script setup>
import { watch, ref, onMounted } from 'vue'
import { getGameLobbyUrl } from '@/helpers'
import { useRouter } from 'vue-router'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import { useUsersStore } from '@/stores'
import Cookies from 'js-cookie'


const router = useRouter()
const isLoading = ref(false)
const { currentUser } = useUsersStore()
const previousRoute = ref(null)
const errorState = ref(false)

async function getCasinoURL() {
  isLoading.value = true

  try {
    const { username, id, authCode } = currentUser || {}
    const bearerToken = Cookies.get('SBE-TOKEN') || undefined

    if (!bearerToken) {
      return router.push({ name: 'sign-in' })
    }

    let payload = {
      playerId: String(id),
      currency: 'NGN',
      country: 'NG',
      lang: 'en_US',
      device: 'desktop',
      walletSessionId: bearerToken,
      mode: 'real'
    }
    console.log(payload)

    const res = await getGameLobbyUrl(payload)
    return window.location.assign(res.url)
  } catch (error) {
    errorState.value = true
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await getCasinoURL()
  router.beforeEach((to, from, next) => {
    previousRoute.value = from.fullPath // Store the previous route
    next()
  })
})
</script>

<style scoped>
.game-play {
  background-color: black;
  height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.error-message {
  color: #ff4444;
  text-align: center;
  padding: 1rem;
  background-color: rgba(255, 68, 68, 0.1);
  border-radius: 8px;
  margin: 1rem 15px;
  font-size: 0.95rem;
}
</style>
