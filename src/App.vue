<script setup>
import AppFooter from '@/components/Footer.vue'
import MobileFooter from '@/components/MobileFooter.vue'
import { defineComponent, onBeforeUnmount, onMounted, ref, watch, computed } from 'vue'
import { useUtilsStore, useCouponStore } from '@/stores'
import CasinoDialog from '@/components/CasinoDialog.vue'
import CalendarBox from '@/components/CalendarBox.vue'
import BookBetModal from '@/components/Betslip/BookBetModal.vue'
import WinModal from '@/components/WinModal.vue'
import {
  fetchSportsbookFeatureConfig,
  fetchGlobalVars,
  getSportsMenu,
  loadBetslipByCode,
  getBets,
  getUserActiveBonus,
  CLIENT_ID,
  validateBetslipSelections,
  fetchBanners,
  getUserCashbackBonus,
  getBanksList,
  fetchUserNotifications
} from '@/helpers'
import Betlist from '@/components//Betslip/Betlist.vue'
import ErrorDialogue from './components/ErrorDialogue.vue'
import { useRoute, useRouter } from 'vue-router'
import emitter from './plugins/emitter'
import { useAuthStore, useUsersStore } from './stores'
import { checkVersion } from '@/utils/version'
import DepositWithdrawalCode from './components/DepositWithdrawalCode.vue'
import Cookies from 'js-cookie'
import ImageDialog from './components/ImageDialog.vue'
import BackToTopButton from './components/BackToTopButton.vue'

const utilsStore = useUtilsStore()
const couponStore = useCouponStore()
const showBetslip = ref(false)
const route = useRoute()
const router = useRouter()
const errorMessage = ref(null)
const nextRoute = ref(null)
const dialogueMessage = ref(null)
const usersStore = useUsersStore()
const authStore = useAuthStore()
const dialogueShown = ref(false)
const dialogueType = ref('')
const isLoading = ref(true)
const openBets = ref(0)
const casinoDailogShown = ref(false)
const customDatePickerShown = ref(false)
const dateRange = ref(null)
const mqttClient = ref(false)
const bookBetModalShown = ref(false)
const bookBetResponse = ref(null)
const casinoGameData = ref(null)
const depositWithdrawalShown = ref(false)
const depositWithdrawalData = ref(null)
const depositWithdrawalType = ref('')
const popupData = ref(null)
let notificationRequestInFlight = false
// Centralized handler to close betslip from child features (e.g., simulation end).
const closeBetslip = async () => {
  if (!showBetslip.value) return
  await toggleBetslip()
}
// Win modal state shared across app (simulation uses this now, other flows can reuse).
const winModalShown = ref(false)
const winModalAmount = ref(0)
const winModalCurrency = ref('')

const isAuthenticated = computed(() => {
  return authStore.isAuthenticated
})

const backToTopBlocked = computed(() => {
  return (
    showBetslip.value ||
    dialogueShown.value ||
    bookBetModalShown.value ||
    depositWithdrawalShown.value ||
    customDatePickerShown.value ||
    (route.name === 'home' && utilsStore.bonusModalShown === false && Boolean(casinoGameData.value)) ||
    (route.name === 'home' && utilsStore.popupDialogShown === false && Boolean(popupData.value))
  )
})

watch(
  () => [isAuthenticated.value, usersStore.currentUser?.id],
  ([authenticated, userId]) => {
    if (authenticated && userId) {
      loadUserNotifications()
    }
  },
  { immediate: true }
)

async function toggleBetslip() {
  couponStore.recordAbandonedBetslipInteraction()
  showBetslip.value = !showBetslip.value
  if (showBetslip.value) {
    document.body.style.overflowY = 'hidden'
    // Validate selections and subscribe to MQTT when betslip opens
    await couponStore.validateAndSubscribe()
  } else {
    document.body.style.overflowY = 'scroll'
    // Unsubscribe from MQTT when betslip closes
    couponStore.unsubscribeAll()
  }
}

function toggleDialogue() {
  dialogueShown.value = false
}

function handleError(error) {
  dialogueShown.value = true
  errorMessage.value = typeof error === 'object' ? error.message : error
  nextRoute.value = error.next_route ? error.next_route : null
  dialogueType.value = 'error'
}

function handleBetslipConfirmation(data) {
  dialogueShown.value = true
  dialogueMessage.value = data
  dialogueType.value = 'betslip'
}

function showDialogue(data) {
  dialogueShown.value = true
  dialogueMessage.value = data
  dialogueType.value = 'withdrawal'
}

function showToaster(data) {
  dialogueShown.value = true
  dialogueMessage.value = data
  dialogueType.value = 'toaster'
}

function showWinModal(data = {}) {
  winModalShown.value = true
  winModalAmount.value = data?.amount ?? 0
  winModalCurrency.value = data?.currency ?? ''
}

function hideWinModal() {
  winModalShown.value = false
}

function getNotificationItems(payload) {
  const looksLikeNotification = (value) => {
    return Boolean(
      value &&
        typeof value === 'object' &&
        (value.id ||
          value.notificationId ||
          value.title ||
          value.subject ||
          value.body ||
          value.content ||
          value.text)
    )
  }
  const data = payload?.data ?? payload?.notifications ?? payload?.notification ?? payload

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.notifications)) return data.notifications
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.data)) return data.data
  if (looksLikeNotification(data)) return [data]

  return []
}

async function loadUserNotifications() {
  if (!isAuthenticated.value || !usersStore.currentUser?.id || notificationRequestInFlight) return

  const sessionKey = `sbe:notification-modal:${CLIENT_ID}:${usersStore.currentUser.id}`
  if (window.sessionStorage.getItem(sessionKey)) return

  notificationRequestInFlight = true
  try {
    const response = await fetchUserNotifications()
    const notifications = getNotificationItems(response)

    if (!notifications.length) return

    dialogueMessage.value = { notifications }
    dialogueType.value = 'notification'
    dialogueShown.value = true
    window.sessionStorage.setItem(sessionKey, '1')
  } catch (error) {
    console.warn('Failed to load user notifications:', error)
  } finally {
    notificationRequestInFlight = false
  }
}

function showDepositWithdrawal(data) {
  document.getElementById('body').classList.add('no-scroll')
  depositWithdrawalShown.value = true
  depositWithdrawalData.value = data
  depositWithdrawalType.value = data.type
}

async function loadBet(code) {
  try {
    const res = await loadBetslipByCode(code)
    if (res.status_code === 200 ) {
      const loadedSelections = await couponStore.rebuildBetslipFromLoadedSelections(res.data)
      if (loadedSelections) {
        // emitter.emit('openBetslip')
        return router.push({ name: 'home' })
      } else {
        emitter.emit('showDialogueToaster', 'All selections have expired')
      }
    } else {
      throw Error
    }
  } catch (error) {
    emitter.emit('showDialogueToaster', 'Invalid booking code. ')
  }
}

async function getBetsData() {
  if(route.name === 'bets-view') return
  const res = await getBets({status: -1})
  if (res.data.data) {
    openBets.value = res?.data?.data.length
  }
}

function showCasinoDialog(data = null) {
  if (route.name === 'home' || (data.bonus && data.game)) {
    casinoDailogShown.value = true
    casinoGameData.value = data
  }
}

function toggleDatePicker() {
  customDatePickerShown.value = !customDatePickerShown.value
}

function toggleBookBetModal(data) {
  bookBetResponse.value = data
  bookBetModalShown.value = true
}

function handleCustomDatePicker(data) {
  // console.log(data)
  emitter.emit('dateRangeSet', data)
}

function hideModal() {
  depositWithdrawalShown.value = false
  depositWithdrawalData.value = null
  depositWithdrawalType.value = ''
  document.getElementById('body').classList.remove('no-scroll')
}

async function validateSelections() {
  if (!couponStore.coupon.selections.length) return

  const selections = couponStore.coupon.selections.map((event) => ({
    match_id: parseInt(event.matchId),
    market_id: parseInt(event.marketId),
    outcome_id: String(event.outcomeId),
    producer_id: event.producerId || 0,
    specifier: event.specifier || ''
  }))
  const res = await validateBetslipSelections(selections)

  if (res.status_code === 200 && res.data) {
    // data is already an array
    const validatedSelections = Array.isArray(res.data) ? res.data : Object.values(res.data)
    let hasSelectionChange = false

    // Update each selection with the new odds and active status
    validatedSelections.forEach((validatedSelection) => {
      const selection = couponStore.coupon.selections.find(
        (sel) =>
          String(sel.matchId) === String(validatedSelection.match_id) &&
          String(sel.marketId) === String(validatedSelection.market_id) &&
          String(sel.outcomeId) === String(validatedSelection.outcome_id) &&
          String(sel.specifier || '') === String(validatedSelection.specifier || '')
      )

      if (selection) {
        // Handle different status states based on status_name
        const statusName = validatedSelection.status_name || ''
        const nextOdds = Number(validatedSelection.odds)
        const previousOdds = Number(selection.odds)
        const nextSuspended = statusName === 'Suspended'
        const nextUnavailable = statusName === 'Deactivated'
        const didChange =
          nextOdds !== previousOdds ||
          selection.suspended !== nextSuspended ||
          selection.unavailable !== nextUnavailable

        selection.odds = validatedSelection.odds
        selection.suspended = nextSuspended
        selection.unavailable = nextUnavailable
        selection.changed = didChange

        if (didChange) {
          hasSelectionChange = true
          couponStore.coupon.acceptChanges = false
        }

        // Reset the changed flag after 1 second
        setTimeout(() => {
          selection.changed = false
        }, 1000)
      }
    })

    // Recalculate winnings after updating all selections
    couponStore.updateWinnings({
      stake: couponStore.coupon.totalStake,
      id: 'all',
      skipPreview: !hasSelectionChange
    })

    emitter.emit('odds-validated', validatedSelections)
  }
}

const safeLoad = (promise) =>
  promise.catch((err) => {
    console.error('Data loading failed:', err)
    return null
  })

  watch(
    () => route.query.shareCode,
    async (code) => {
      // get booking code
      if (code) {
        await loadBet(code)
      }
    },
    { immediate: true } // Trigger the watch callback immediately on component mount
  )

onMounted(async () => {
  if (route.path !== '/') {
    isLoading.value = false
  }

  const clickId = new URLSearchParams(window.location.search).get('clickid')
  if (clickId) {
    Cookies.set('clickId', clickId, { expires: 30 }) // expires in 30 days
  }

  const [globalVarsResult, sportsResult, , banksResult, featureConfigResult, bannersResult] =
    await Promise.allSettled([
      fetchGlobalVars(),
      getSportsMenu(),
      validateSelections(),
      getBanksList(),
      fetchSportsbookFeatureConfig(),
      fetchBanners()
    ])

  couponStore.sportsbookBonusList = []
  couponStore.SportsbookGlobalVariable =
    globalVarsResult.status === 'fulfilled'
      ? globalVarsResult.value?.data?.data || { ...utilsStore.SportsbookGlobalVariable }
      : { ...utilsStore.SportsbookGlobalVariable }

  couponStore.SportsbookGlobalVariable.Currency =
    couponStore.SportsbookGlobalVariable.Currency || '₦'
  couponStore.SportsbookGlobalVariable.CurrencyCode =
    couponStore.SportsbookGlobalVariable.CurrencyCode || 'NGN'
  couponStore.SportsbookGlobalVariable.DialCode =
    couponStore.SportsbookGlobalVariable.DialCode || '+234'

  couponStore.sportsbookFeatureConfig =
    featureConfigResult.status === 'fulfilled'
      ? featureConfigResult.value
      : { ...utilsStore.SportsbookFeatureConfig }

  utilsStore.sportsbookBonusList = couponStore.sportsbookBonusList
  utilsStore.SportsbookGlobalVariable = couponStore.SportsbookGlobalVariable
  utilsStore.SportsbookFeatureConfig = couponStore.sportsbookFeatureConfig

  utilsStore.sportsMenu =
    sportsResult.status === 'fulfilled' && Array.isArray(sportsResult.value?.data)
      ? sportsResult.value.data.filter((sport) => sport.games > 0)
      : []

  utilsStore.banksList =
    banksResult.status === 'fulfilled' && Array.isArray(banksResult.value?.data)
      ? banksResult.value.data
      : []

  if (bannersResult.status === 'fulfilled' && bannersResult.value?.data) {
    utilsStore.banners = Object.values(bannersResult.value.data).filter(
      (banner) => banner.target === 'mobile'
    )
  } else {
    utilsStore.banners = []
  }

  isLoading.value = false

  if (isAuthenticated.value) {
    const [, activeBonus, cashbackData] = await Promise.all([
      safeLoad(usersStore.loadCurrentUser()),
      safeLoad(getUserActiveBonus()),
      safeLoad(getUserCashbackBonus()),
      safeLoad(getBetsData())
    ])

    if (activeBonus?.data) {
      let bonusIsCasino = ["feature_trigger", "free_rounds"].includes(activeBonus?.data?.bonusType)
      if (bonusIsCasino) {
        usersStore.casinoActiveBonus = activeBonus?.data
      } else {
        usersStore.activeBonus = activeBonus?.data
      }
      usersStore.activeCashback = usersStore.currentUser.sportBonusBalance > 0 ? null : cashbackData
    } else {
      usersStore.activeCashback = cashbackData?.data;
    }

    if (utilsStore.bonusModalShown === null) {
      casinoGameData.value = activeBonus?.data
      utilsStore.bonusModalShown = false
    }
    isLoading.value = false
  }

  await loadUserNotifications()
  couponStore.startAbandonedBetslipTracker()

  emitter.on('openBetslip', toggleBetslip)
  emitter.on('showErrorMessage', handleError)
  emitter.on('showBetslipConfirmation', handleBetslipConfirmation)
  emitter.on('showDialogueMessage', showDialogue)
  emitter.on('showDialogueToaster', showToaster)
  emitter.on('hideDialogueToaster', toggleDialogue)
  emitter.on('showCasinoDialog', showCasinoDialog)
  emitter.on('showCustomDatePicker', toggleDatePicker)
  emitter.on('showBookBetModal', toggleBookBetModal)
  emitter.on('showDepositWithdrawalModal', showDepositWithdrawal)
  emitter.on('showWinModal', showWinModal)
  emitter.on('closeBetslip', closeBetslip)
})

onBeforeUnmount(() => {
  couponStore.stopAbandonedBetslipTracker()
})

defineComponent({
  name: 'app',
  components: { AppFooter, MobileFooter }
})
</script>

<template>
  <div>
    <div v-if="isLoading">
      <transition name="move">
        <div class="loading-overlay">
          <div class="loading-spinner">
            <img
              src="/logos.png"
              class="scaling-image"
              style="height: 60px; margin-bottom: 20px"
              alt="logo"
            />
            <div><img src="/loader.gif" alt="" srcset="" style="height: 3.5rem" /></div>
          </div>
        </div>
      </transition>
    </div>
    <div v-else class="page-content page-content--ng">
      <!-- Main content -->
      <div class="x-main x-layout-main">
        <div class="x-main-mid x-has-bottom-nav">
          <RouterView />
          <div v-show="utilsStore.showFooter">
            <AppFooter></AppFooter>
          </div>
          <MobileFooter @show-betslip="toggleBetslip" :open-bet-count="openBets"></MobileFooter>
          <CasinoDialog v-if="
            utilsStore.bonusModalShown === false && casinoGameData && route.name === 'home'
          " :data="casinoGameData" @hide-dialogue="utilsStore.bonusModalShown = true" />
          <ImageDialog v-if="utilsStore.popupDialogShown === false && popupData && route.name === 'home'"
            :image="popupData" @hide-dialogue="utilsStore.popupDialogShown = true" />

        </div>
        <Betlist @toggle-betslip="toggleBetslip" v-if="showBetslip" @update-betcount="getBetsData"></Betlist>
          <ErrorDialogue v-if="dialogueShown" @hide-dialogue="toggleDialogue" :dialogue-message="dialogueMessage"
          :error-message="errorMessage" :dialogue-type="dialogueType" :next-route="nextRoute"></ErrorDialogue>
        <WinModal
            v-if="winModalShown"
            :amount="winModalAmount"
            :currency="winModalCurrency"
            @close="hideWinModal"
          />
        <BackToTopButton :blocked="backToTopBlocked" />
      </div>
  
      <!-- <transition name="move">
        <div class="loading-overlay" v-if="isLoading">
          <div class="loading-spinner">
            <img
              src="/logo.png"
              class="scaling-image"
              style="height: 60px; margin-bottom: 20px"
              alt="logo"
            />
            <div><img src="/loader.gif" alt="" srcset="" style="height: 3.5rem" /></div>
          </div>
        </div>
      </transition> -->
      <CalendarBox
        v-if="customDatePickerShown"
        @hide="toggleDatePicker"
        @set-date="handleCustomDatePicker"
      />
      <template v-if="route.name === 'account-deposit' || route.name === 'account-withdraw'">
        <DepositWithdrawalCode
          v-if="depositWithdrawalShown"
          :data="depositWithdrawalData"
          @hide-modal="hideModal"
        />
      </template>
      <div
        class="dialog-mask"
        v-if="bookBetModalShown"
        style="background-color: rgba(0, 0, 0, 0); z-index: 1000"
      >
        <div class="dialog-wrapper" style="align-items: center; inset: auto; overflow: auto">
          <div class="dialog-container" style="overflow: auto">
            <BookBetModal @hide-modal="bookBetModalShown = false" :betDetails="bookBetResponse"></BookBetModal>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
@import url('./assets/css/loading.css');

html,
body {
  width: 100%;
}

.no-scroll {
  overflow: hidden !important;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #fafafa;
  /* semi-transparent white */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  /* ensure overlay is on top */
}

.loading-spinner {
  font-size: 20px;
  /* Add additional styles for the loading spinner */
}

.scaling-image {
  transition: transform 0.5s ease;
  /* Add a transition effect on the transform property */
}

.x-layout-main {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}

.loading-spinner {
  text-align: center;
}

.loading-bar {
  width: 100px;
  height: 4px;
  background-color: #3498db;
  margin-top: 10px;
  animation: loading 2s infinite;
}

@keyframes loading {
  0% {
    width: 0;
  }

  50% {
    width: 100px;
  }

  100% {
    width: 0;
  }
}

.x-layout-main .fade-enter-active,
.x-layout-main .fade-leave-active {
  -webkit-transition: opacity 0.3s;
  transition: opacity 0.3s;
}

.x-layout-main .fade-enter,
.x-layout-main .fade-leave-to {
  opacity: 0;
}

.x-layout-main>* {
  min-height: 100%;
}

.x-layout-main .x-main-left,
.x-layout-main .x-main-right {
  background-color: rgba(0, 0, 0, 0.7);
  left: 0px;
  position: fixed;
  width: 100%;
  z-index: 800;
}

.x-layout-main .x-main-left {
  top: 0px;
}

.x-layout-main .x-main-right {
  bottom: 0px;
}

.x-layout-main .x-main-mid {
  left: 0px;
  position: absolute;
  top: 0px;
  width: 100%;
  z-index: 2;
}

.x-layout-main .x-main-mid.has-bg-color {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
}

.x-layout-main .x-main-mid.x-has-bottom-nav .x-footer {
  padding-bottom: 5rem;
}

.x-layout-main .refresh-page {
  margin-top: 64px;
}

@keyframes easeOutLeft {
  0% {
    transform: translateX(0);
  }

  100% {
    transform: translateX(-100%);
  }
}

.move-leave-active {
  animation: easeOutLeft 0.2s ease-out forwards;
}

.move-enter-active {
  transition: transform 0.1s ease;
}

.move-enter,
.move-leave-to{
  transform: translateX(0);
}
</style>
