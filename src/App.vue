<script setup>
import AppFooter from "@/components/Footer.vue";
import MobileFooter from "@/components/MobileFooter.vue";
import { defineComponent, onMounted, ref, watch, onBeforeUnmount } from "vue";
import { useUtilstStore, useCouponStore } from "@/stores";
import CasinoDialog from "@/components/CasinoDialog.vue";
import CalendarBox from "@/components/CalendarBox.vue";
import BookBetModal from "@/components/Betslip/BookBetModal.vue";
import {
  fetchBonusList,
  fetchGlobalVars,
  getSportsMenu,
  loadBetslipByCode,
  getBets,
  applyBranding,
  CLIENT_ID,
  validateBetslipSelections
} from "@/helpers";
import Betlist from "@/components//Betslip/Betlist.vue";
import ErrorDialogue from "./components/ErrorDialogue.vue";
import { useRoute, useRouter } from "vue-router";
import emitter from "./plugins/emitter";
import { useUsersStore } from "./stores";

const utilsStore = useUtilstStore();
const couponStore = useCouponStore();
const showBetslip = ref(false);
const route = useRoute();
const router = useRouter();
const errorMessage = ref(null);
const nextRoute = ref(null);
const dialogueMessage = ref(null);
const usersStore = useUsersStore();
const dialogueShown = ref(false);
const dialogueType = ref("");
const isLoading = ref(true);
const openBets = ref(0);
const casinoDailogShown = ref(false);
const customDatePickerShown = ref(false);
const dateRange = ref(null);
const mqttClient = ref(false);
const bookBetModalShown = ref(false);
const bookBetResponse = ref(null);
const casinoGameData = ref(null)

// const showLoadingOverlay = computed(() => {
//   const specificPages = ['/'] // Define the routes where you want to show the loading overlay
//   return specificPages.includes(route.path)
// })

function toggleBetslip() {
  showBetslip.value = !showBetslip.value;
  if (showBetslip.value) {
    document.body.style.overflowY = "hidden";
  } else {
    document.body.style.overflowY = "scroll";
  }
}

function toggleDialogue() {
  dialogueShown.value = false;
}

function handleError(error) {
  dialogueShown.value = true;
  errorMessage.value = typeof error === "object" ? error.message : error;
  nextRoute.value = error.next_route ? error.next_route : null;
  dialogueType.value = "error";
}

function handleBetslipConfirmation(data){
  dialogueShown.value = true;
  dialogueMessage.value = data;
  dialogueType.value = "betslip";
}

function showDialogue(data) {
  dialogueShown.value = true;
  dialogueMessage.value = data;
  dialogueType.value = "withdrawal";
}

function showToaster(data) {
  dialogueShown.value = true;
  dialogueMessage.value = data;
  dialogueType.value = "toaster";
}

async function loadBet(code) {
  try {
    const res = await loadBetslipByCode(code);
    if (res.success) {
      if (res.data.selections.length) {
        couponStore.coupon.selections = res.data.selections;
        couponStore.coupon.totalOdds = res.data.totalOdd;
        couponStore.coupon.totalStake = res.data.stake;
        couponStore.coupon.stake = res.data.stake;
        couponStore.coupon.maxWin = res.data.possibleWin;
        couponStore.coupon.source = "mobile";
        if (res.data.selections.length === 1) {
          couponStore.coupon.bet_type = "Single";
          couponStore.coupon.betslip_type = "Single";
        } else {
          couponStore.coupon.bet_type = "Multiple";
          couponStore.coupon.betslip_type = "Multiple";
        }
        // emitter.emit('openBetslip')
        return router.push({ name: "home" });
      } else {
        emitter.emit("showDialogueToaster", "All selections have expired");
      }
    } else {
      throw Error;
    }
  } catch (error) {
    emitter.emit("showDialogueToaster", "Invalid booking code. ");
  }
}

async function getBetsData() {
  let payload = {
    clientId: CLIENT_ID,
    date: "",
    status: 0,
    userId: usersStore.currentUser.id,
  };
  const res = await getBets(payload);
  if (res.bets) {
    openBets.value = res.bets.length;
  }
}

function showCasinoDialog(data = null) {
  if(route.name === 'home' || (data.bonus && data.game)){
    casinoDailogShown.value = true;
    casinoGameData.value = data
  }
}

function toggleDatePicker() {
  customDatePickerShown.value = !customDatePickerShown.value;
}

function toggleBookBetModal(data) {
  bookBetResponse.value = data;
  bookBetModalShown.value = true;
}

function handleCustomDatePicker(data) {
  // console.log(data)
  emitter.emit("dateRangeSet", data);
}

async function validateSelections(){
  if(!couponStore.coupon.selections.length) return;

  const selections = couponStore.coupon.selections.map((event) => ({
    matchId: parseInt(event.matchId),
    marketId: event.marketId.toString(),
    outcomeId: event.outcomeId,
    specifier: event.specifier
  }))
  const res = await validateBetslipSelections({events: selections})
  
  if(res.success){
    // Convert response object to array of validated selections
    const validatedSelections = Object.values(res.data);
    
    // Update each selection with the new odds and active status
    validatedSelections.forEach(validatedSelection => {
      const selection = couponStore.coupon.selections.find(sel => 
        String(sel.matchId) === String(validatedSelection.matchId) && 
        String(sel.marketId) === validatedSelection.marketId && 
        String(sel.outcomeId) === validatedSelection.outcomeId
      );
      
      if(selection) {
        selection.odds = validatedSelection.odds;
        selection.suspended = !validatedSelection.active;
        selection.unavailable = !validatedSelection.active;
        selection.changed = true;
        
        // Reset the changed flag after 5 seconds
        setTimeout(() => {
          selection.changed = false;
        }, 5000);
      }
    });

    // Recalculate winnings after updating all selections
    couponStore.updateWinnings({
      stake: couponStore.coupon.totalStake,
      id: "all"
    });
  }
}

watch(
  () => route.query.shareCode,
  async (code) => {
    // get booking code
    if (code) {
      await loadBet(code);
    }
  },
  { immediate: true } // Trigger the watch callback immediately on component mount
);

onMounted(async () => {

  if (route.path !== "/") {
    isLoading.value = false;
  }

  if (usersStore.currentUser) {
    Promise.all([usersStore.loadCurrentUser(), getBetsData()])
      .then((res) => {
        console.log(res[2]);
      })
      .catch(() => {
        isLoading.value = false;
      })
      .finally(() => {
        isLoading.value = false;
      });
  }

  Promise.all([fetchBonusList(), fetchGlobalVars(), getSportsMenu(), validateSelections()])
    .then((res) => {
      couponStore.sportsbookBonusList = res[0].data;
      couponStore.SportsbookGlobalVariable = res[1].data.data;
      utilsStore.sportsbookBonusList = res[0].data;
      utilsStore.SportsbookGlobalVariable = res[1].data.data;
      utilsStore.sportsMenu = res[2].sports; // Update loading state after delay
      isLoading.value = false;
    })
    .catch(() => {
      isLoading.value = false;
    });

  emitter.on("openBetslip", toggleBetslip);
  emitter.on("showErrorMessage", handleError);
  emitter.on("showBetslipConfirmation", handleBetslipConfirmation);
  emitter.on("showDialogueMessage", showDialogue);
  emitter.on("showDialogueToaster", showToaster);
  emitter.on("hideDialogueToaster", toggleDialogue);
  emitter.on("showCasinoDialog", showCasinoDialog);
  emitter.on("showCustomDatePicker", toggleDatePicker);
  emitter.on("showBookBetModal", toggleBookBetModal);
});

defineComponent({
  name: "app",
  components: { AppFooter, MobileFooter },
});
</script>

<template>
  <div class="page-content page-content--ng">
    <!-- Main content -->
    <div class="x-main x-layout-main">
      <div class="x-main-mid x-has-bottom-nav">
        <RouterView />
        <AppFooter v-show="utilsStore.showFooter"></AppFooter>
        <MobileFooter
          @show-betslip="toggleBetslip"
          :open-bet-count="openBets"
        ></MobileFooter>
        <ErrorDialogue
          v-if="dialogueShown"
          @hide-dialogue="toggleDialogue"
          :dialogue-message="dialogueMessage"
          :error-message="errorMessage"
          :dialogue-type="dialogueType"
          :next-route="nextRoute"
        ></ErrorDialogue>
        <CasinoDialog
          v-if="casinoDailogShown"
          @hide-dialogue="casinoDailogShown = false"
          :data="casinoGameData"
        />
      </div>
      <Betlist
        @toggle-betslip="toggleBetslip"
        v-if="showBetslip"
        @update-betcount="getBetsData"
      ></Betlist>
    </div>

    <!-- <transition name="move">
      <div class="loading-overlay" v-if="isLoading">
        <div class="loading-spinner">
          <img
            src="/default.png"
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
    <div
      class="dialog-mask"
      v-if="bookBetModalShown"
      style="background-color: rgba(0, 0, 0, 0); z-index: 1000"
    >
      <div
        class="dialog-wrapper"
        style="align-items: center; inset: auto; overflow: auto"
      >
        <div class="dialog-container" style="overflow: auto">
          <BookBetModal
            @hide-modal="bookBetModalShown = false"
            :betDetails="bookBetResponse"
          ></BookBetModal>
        </div>
      </div>
    </div>
  </div>
</template>
<style>
@import url("./assets/css/loading.css");
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
