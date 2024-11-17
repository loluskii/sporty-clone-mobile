<script setup>
import AppFooter from '@/components/Footer.vue'
import MobileFooter from '@/components/MobileFooter.vue'
import { defineComponent, onMounted, ref, watch, provide, onBeforeUnmount, onUnmounted } from 'vue'
import { useUtilstStore, useCouponStore } from '@/stores'
import CasinoDialog from '@/components/CasinoDialog.vue'
import CalendarBox from '@/components/CalendarBox.vue'
import {
  fetchBonusList,
  fetchGlobalVars,
  getSportsMenu,
  loadBetslipByCode,
  getBets,
  applyBranding,
  CLIENT_ID
} from '@/helpers'
import Betlist from './components/Betlist.vue'
import ErrorDialogue from './components/ErrorDialogue.vue'
import { useRoute, useRouter } from 'vue-router'
import emitter from './plugins/emitter'
import { useUsersStore } from './stores'
// import { $mqtt } from 'vue-paho-mqtt';
import mqtt from 'mqtt'

const utilsStore = useUtilstStore()
const couponStore = useCouponStore()
const showBetslip = ref(false)
const route = useRoute()
const router = useRouter()
const errorMessage = ref(null)
const nextRoute = ref(null)
const dialogueMessage = ref(null)
const usersStore = useUsersStore()
const dialogueShown = ref(false)
const dialogueType = ref('')
const isLoading = ref(true)
const openBets = ref(0)
const casinoDailogShown = ref(false)
const customDatePickerShown = ref(false)
const dateRange = ref(null)
const mqttClient = ref(false)

// const showLoadingOverlay = computed(() => {
//   const specificPages = ['/'] // Define the routes where you want to show the loading overlay
//   return specificPages.includes(route.path)
// })

function toggleBetslip() {
  showBetslip.value = !showBetslip.value
  if (showBetslip.value) {
    document.body.style.overflowY = 'hidden'
  } else {
    document.body.style.overflowY = 'scroll'
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

function initMqtt() {
  try {
    if (mqttClient.value !== false) {
      mqttClient.value.end()
    }

    var n = 10

    // connection option
    const options = {
      clean: true, // retain session
      connectTimeout: 4000, // Timeout period
      // Authentication information
      clientId:
        import.meta.env.VITE_MQTT_CLIENTID +
        '-' +
        Math.floor(Math.random() * (9 * Math.pow(10, n))) +
        Math.pow(10, n),
      username: import.meta.env.VITE_MQTT_USERNAME,
      password: import.meta.env.VITE_MQTT_PASSWORD
    }

    const subscriptions = [`feeds/live/odds_change/+`, `feeds/live/bet_stop/+`]

    mqttClient.value = mqtt.connect(import.meta.env.VITE_MQTT_URI, options)

    if (mqttClient.value.on) {
      mqttClient.value.on('connect', () => {
        // this.connecting = false;
        // console.log("MQTT Connection succeeded!");
      })
      // this.mqttClient.on("reconnect", this.handleOnReConnect);
      mqttClient.value.on('error', (error) => {
        // console.log("MQTT Connection failed", error);
      })
      mqttClient.value.subscribe(subscriptions, (error, res) => {
        if (error) {
          // console.log('Subscribe to odd change error', error)
          return
        }
        // console.log('Subscribe to topics res', res)
      })
      mqttClient.value.on('message', (topic, message) => {
        // message is string
        const payload = JSON.parse(message)
        // split the topic to get the type of message
        const topicArr = topic.split('/')

        // console.log(`Received message from topic ${topicArr[2]}`);

        switch (topicArr[2]) {
          case 'odds_change':
            emitter.emit(`odds-change-${payload.match_id}`, payload)
            updateBetslip(payload, 'odds_change')
            break
          case 'bet_stop':
            emitter.emit(`bet-stop-${payload.match_id}`, payload)
            updateBetslip(payload, 'bet_stop')
            break
          default:
            break
        }
      })
    }
  } catch (e) {
    mqttClient.value = false
    console.log('mqtt.connect error', e)
  }
}
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

async function loadBet(code) {
  try {
    const res = await loadBetslipByCode(code)
    if (res.success) {
      if (res.data.selections.length) {
        couponStore.coupon.selections = res.data.selections
        couponStore.coupon.totalOdds = res.data.totalOdd
        couponStore.coupon.totalStake = res.data.stake
        couponStore.coupon.stake = res.data.stake
        couponStore.coupon.maxWin = res.data.possibleWin
        couponStore.coupon.source = 'mobile'
        if (res.data.selections.length === 1) {
          couponStore.coupon.bet_type = 'Single'
          couponStore.coupon.betslip_type = 'Single'
        } else {
          couponStore.coupon.bet_type = 'Multiple'
          couponStore.coupon.betslip_type = 'Multiple'
        }
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
  let payload = {
    clientId: CLIENT_ID,
    date: '',
    status: 0,
    userId: usersStore.currentUser.id
  }
  const res = await getBets(payload)
  if (res.bets) {
    openBets.value = res.bets.length
  }
}

function showCasinoDialog() {
  casinoDailogShown.value = true
}

function toggleDatePicker() {
  customDatePickerShown.value = !customDatePickerShown.value
}

function handleCustomDatePicker(data) {
  // console.log(data)
  emitter.emit('dateRangeSet', data)
}

function updateBetslip(eventMessage, event_type) {
  const matchIdFromEvent = eventMessage.match_id
  // Find the selection with the matching match_id in the betslip
  const selection = couponStore.coupon.selections.find((sel) => sel.matchId === matchIdFromEvent)

  // If a matching selection is found
  if (selection) {
    // Handle bet_stop event
    if (event_type === 'bet_stop') {
      selection.suspended = true
    }

    // Handle odds_change event
    if (event_type === 'odds_change') {
      couponStore.coupon.acceptChanges = false
      selection.suspended = false
      selection.changed = true;
      
      const market = eventMessage.markets.find(
        (m) => m.id === selection.marketId && m.specifiers === selection.specifier
      )

      if (market && market.outcomes) {
        
        let newOutcome = market.outcomes.find((m) => m.id === selection.outcomeId && m.specifier === selection.specifier);

        selection.odds = newOutcome.odds;
        selection.suspended = !newOutcome.active
        couponStore.updateWinnings({
          stake: couponStore.coupon.totalStake,
          id: selection.selectionId
        })
      } else {
        selection.suspended = true
        selection.unavailable = true
        selection.odds = 0
      }
    }
  }
}

onMounted(async () => {
  // connect to mqtt
  initMqtt()

  if (route.path !== '/') {
    isLoading.value = false
  }

  if (usersStore.currentUser) {
    // await usersStore.loadCurrentUser()
    Promise.all([usersStore.loadCurrentUser(), getBetsData()])
      .then((res) => {
        console.log(res[2])
      })
      .catch(() => {
        isLoading.value = false
      })
      .finally(() => {
        isLoading.value = false
      })
  }

  Promise.all([fetchBonusList(), fetchGlobalVars(), getSportsMenu()])
    .then((res) => {
      couponStore.sportsbookBonusList = res[0].data
      couponStore.SportsbookGlobalVariable = res[1].data.data
      utilsStore.sportsMenu = res[2].sports // Update loading state after delay
      isLoading.value = false
    })
    .catch(() => {
      isLoading.value = false
    })

  emitter.on('openBetslip', toggleBetslip)
  emitter.on('showErrorMessage', handleError)
  emitter.on('showDialogueMessage', showDialogue)
  emitter.on('showDialogueToaster', showToaster)
  emitter.on('hideDialogueToaster', toggleDialogue)
  emitter.on('showCasinoDialog', showCasinoDialog)
  emitter.on('showCustomDatePicker', toggleDatePicker)

  // listen to live odds change
  // $mqtt.subscribe(`live/odds_change/+`, (message) => {
  //   try {
  //     const data = JSON.parse(message)
  //     // console.log(`received odds change for ${data.match_id}`);
  //     emitter.emit(`odds-change-${data.match_id}`, data);
  //   } catch(e) {
  //     console.log('error processing odds change', e.message)
  //   }
  // })
  // // listen to live bet_stop
  // $mqtt.subscribe(`live/bet_stop/+`, (message) => {
  //   try {
  //     const data = JSON.parse(message)
  //     // console.log(`received bet stop for ${data.match_id}`);
  //     emitter.emit(`bet-stop-${data.match_id}`, data);
  //   } catch(e) {
  //     console.log('error processing bet stop', e.message)
  //   }
  // })

  // emitter.on('added-selection', (matchId) => {
  //   console.log('added selection')

  //   // listen to odds change for new selection
  //   $mqtt.subscribe(`+/odds_change/${matchId}`, (message) => {
  //     console.log(`Received odds change message for ${matchId}:`,  message);
  //   });
  //   // listen to bet stop for match
  //   $mqtt.subscribe(`+/bet_stop/${matchId}`, (message) => {
  //     console.log(`Received bet stop message for ${matchId}:`,  message);
  //   });
  // })

  // emitter.on('removed-selection', (matchId) => {
  //   console.log('removed selection')
  //   // unsubscribe from odds change message for match
  //   $mqtt.unsubscribe(`+/odds_change/${matchId}`);
  //   // unsubscribe from bet stop message for match
  //   $mqtt.unsubscribe(`+/bet_stop/${matchId}`);
  // })

  // // unsubscribe from all subscription when betslip is cleared
  // emitter.on('clear-selections', () => {
  //   console.log('cleared selection')
  //   // $mqtt.unsubscribeAll();
  // })
})

onUnmounted(() => {
  // $mqtt.unsubscribe(`live/odds_change/+`, true)
  // $mqtt.unsubscribe(`live/bet_stop/+`, true)
})
onBeforeUnmount(() => {
  if (mqttClient.value !== false) mqttClient.value.end()
})

defineComponent({
  name: 'app',
  components: { AppFooter, MobileFooter }
})
</script>

<template>
  <div class="page-content page-content--ng">
    <!-- Main content -->
    <div class="x-main x-layout-main" v-show="!isLoading">
      <div class="x-main-mid x-has-bottom-nav">
        <RouterView />
        <AppFooter v-show="utilsStore.showFooter"></AppFooter>
        <MobileFooter @show-betslip="toggleBetslip" :open-bet-count="openBets"></MobileFooter>
        <ErrorDialogue
          v-if="dialogueShown"
          @hide-dialogue="toggleDialogue"
          :dialogue-message="dialogueMessage"
          :error-message="errorMessage"
          :dialogue-type="dialogueType"
          :next-route="nextRoute"
        ></ErrorDialogue>
        <CasinoDialog v-if="casinoDailogShown" @hide-dialogue="casinoDailogShown = false" />
      </div>
      <Betlist
        @toggle-betslip="toggleBetslip"
        v-if="showBetslip"
        @update-betcount="getBetsData"
      ></Betlist>
    </div>

    <transition name="move">
      <div class="loading-overlay" v-if="isLoading">
        <div class="loading-spinner">
          <img
            src="/logo.svg"
            class="scaling-image"
            style="height: 60px; margin-bottom: 20px"
            alt="logo"
          />
          <div><img src="/loader.gif" alt="" srcset="" style="height: 3.5rem" /></div>
        </div>
      </div>
    </transition>
    <CalendarBox
      v-if="customDatePickerShown"
      @hide="toggleDatePicker"
      @set-date="handleCustomDatePicker"
    />
  </div>
</template>

{ "match_id": 54227925, "event_id": 54227925, "event_prefix": "sr", "event_type": "match",
"timestamp": 1728122025056, "sport_event_status": { "status": 1, "match_status": 8, "home_score":
"0", "away_score": "0", "clock": { "stopped": false } }, "markets":[], "product": 1 }

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
  background-color: #fafafa; /* semi-transparent white */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999; /* ensure overlay is on top */
}

.loading-spinner {
  font-size: 20px;
  /* Add additional styles for the loading spinner */
}

.scaling-image {
  transition: transform 0.5s ease; /* Add a transition effect on the transform property */
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
.x-layout-main > * {
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
  height: 100%;
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

.move-enter, .move-leave-to /* .fade-leave-active in <2.1.8 */ {
  transform: translateX(0);
}
</style>
