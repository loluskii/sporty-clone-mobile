<template>
  <div class="game-play">
    <template v-if="isLoading">
      <div>
        <img src="/logo.png?v=2" alt="" style="height: 50px" />
        <LoadingSpinner></LoadingSpinner>
      </div>
    </template>
    <div v-if="errorState" class="error-message">Failed to load Game. Please try again later.</div>
  </div>
</template>

<script setup>
import { watch, ref } from 'vue'
import {
  getCasinoStartUrl,
  getCasinoGameById,
  getGoldenRaceLobbyUrl,
  getQtechLaunchUrl
} from '@/helpers'
import { useRoute } from 'vue-router'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import { useUsersStore } from '@/stores'
import Cookies from 'js-cookie'
import { CASINO_PROVIDER_PUBLIC_API, CLIENT_ID } from '@/helpers/constants'

const route = useRoute()
const isLoading = ref(false)
const { currentUser } = useUsersStore()
const errorState = ref(false)

watch(
  () => [route.params.game_id],
  async ([game_id]) => {
    await getCasinoURL()
  },
  { immediate: true }
)

async function getCasinoURL() {
  isLoading.value = true

  try {
    const { game_id } = route.params
    const { bonusId, balanceType, bonusType } = route.query
    const { username, id, authCode } = currentUser || {}
    const bearerToken = Cookies.get('SBE-TOKEN') || undefined
    const selectedGame = game_id === 'smat_virtual' ? null : await getCasinoGameById(game_id)
    const isGoldenRace = String(selectedGame?.providerId || selectedGame?.provider_id || '') === '3'
    const isQtechGames = String(selectedGame?.providerId || selectedGame?.provider_id || '') === '4'
    const gameCode = String(selectedGame?.gameCode || selectedGame?.game_code || game_id || '')

    let payload = {
      gameId: parseInt(game_id),
      clientId: CLIENT_ID,
      username,
      userId: id,
      demo: false,
      isMobile: true,
      homeUrl: import.meta.env.VITE_SITE_URL,
      authCode,
      balanceType: 'real'
    }

    if (bonusId && balanceType === 'bonus') {
      Object.assign(payload, {
        isBonus: true,
        bonusType,
        bonusId,
        balanceType: 'bonus'
      })
    }

    let res

    if (isGoldenRace) {
      res = await getGoldenRaceLobbyUrl(
        {
          client_id: import.meta.env.VITE_CLIENT_ID,
          provider_id: String(selectedGame?.providerId || selectedGame?.provider_id || ''),
          mode: '1',
          language: 'en',
          group: 'master',
          game: gameCode,
          category_id: String(selectedGame?.categoryId || selectedGame?.category_id || ''),
          currency: 'NGN'
        },
        bearerToken
      )
    } else if (isQtechGames) {
      res = await getQtechLaunchUrl(
        gameCode,
        {
          playerId: id,
          currency: 'NGN',
          country: 'NG',
          lang: 'en_US',
          device: 'desktop',
          walletSessionId: bearerToken,
          lobbyUrl: `${CASINO_PROVIDER_PUBLIC_API}/providers/qtech/accounts/${id}/session?gameId=${gameCode}`,
          mode: 'real'
        },
        bearerToken
      )
    } else {
      res = await getCasinoStartUrl(payload, 'real')
    }

    const launchUrl = res?.launchUrl || res?.url || res?.data?.launchUrl || res?.data?.url

    if (!launchUrl) {
      throw new Error(`Casino launch response did not include a launch URL: ${JSON.stringify(res)}`)
    }

    window.location.href = launchUrl
  } catch (error) {
    errorState.value = true
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
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
