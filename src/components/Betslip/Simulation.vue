<template>
  <div id="Simulate">
    <div
      class=""
      style="
        height: 100px;
        text-align: center;
        background-color: #ececec;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: green;
      "
    >
      <span style="font-size: 30px">{{
        timerStarted || timerEnded ? `${currentTime * 10}'` : "Starting Game..."
      }}</span>
    </div>
    <div class="ticket-wrapper">
      <div class="ticket">
        <div class="events-container">
          <!-- Loop over each selection -->
          <div
            v-for="selection in couponStore.coupon.selections"
            :key="selection.matchId"
            class="simulate-card pd-h-16 sim-card-mb-8"
          >
            <div class="team-match size-12 pd-v-15">
              <span></span>
              <span class="teamName size-12">{{ selection.homeTeam }}</span>
              <div class="teamScore size-20">
                <div class="teamScore__finished size-16">
                  <!-- Display the current (animated) score -->
                  <span>{{ getCurrentScore(selection.matchId).home }}</span>
                  <span> - </span>
                  <span>{{ getCurrentScore(selection.matchId).away }}</span>
                </div>
                <!-- Optionally, show half-time score -->
                <div class="teamScore__half size-10">
                  <span> </span>
                  <template v-if="timerEnded">
                    <span data-cms-key="first_half" data-cms-page="simulate_game">
                      First Half
                    </span>
                    <span>{{ getHalfTimeScore(selection.matchId).home }}</span>
                    <span>-</span>
                    <span>{{ getHalfTimeScore(selection.matchId).away }}</span>
                  </template>
                </div>
              </div>
              <span class="teamName size-12">{{ selection.awayTeam }}</span>
              <span></span>
            </div>
            <div class="event-bet pd-t-10 pd-b-12">
              <div class="info">
                <span class="type__name">{{ selection.marketName }}</span>
                <div class="info-odds">
                  {{ selection.outcomeName }} @ {{ selection.odds }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="buttons h-48 size-16" @click="exitSimulation">
      <div data-op="sim-ok-button" class="button__ok">
        <span>{{ timerEnded ? "OK" : "Skip to Results" }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useCouponStore } from "@/stores";

// Get the selections from the coupon store
const couponStore = useCouponStore();
const props = defineProps(["simulationResults"]);

/**
 * Process the simulation events:
 * 1. For each event, we build an array of goal events.
 * 2. Each goal event gets a scaled time in seconds.
 *    (Using the formula: (goalTime / maxTime) * 9)
 */
const simulationData = computed(() => {
  const events = JSON.parse(props.simulationResults.events);
  const data = {};

  events.forEach((ev) => {
    const matchId = Number(ev.reference);
    const playout = ev.playout;

    let goalEvents = [];

    if (playout.homeCompetitorGoals) {
      playout.homeCompetitorGoals.forEach((time) => {
        goalEvents.push({ time: time / 10, team: "home" });
      });
    }
    if (playout.awayCompetitorGoals) {
      playout.awayCompetitorGoals.forEach((time) => {
        goalEvents.push({ time: time / 10, team: "away" });
      });
    }

    // No need for dynamic scaling since maximum is always 90 (i.e. 90/10 = 9 seconds)
    // Sorting events is still useful to process them in order.
    goalEvents.sort((a, b) => a.time - b.time);

    data[matchId] = {
      goalEvents,
      finalScore: {
        home: playout.homeCompetitorScore,
        away: playout.awayCompetitorScore,
      },
      halfTime: {
        home: playout.homeCompetitorHalfTimeScore,
        away: playout.awayCompetitorHalfTimeScore,
      },
    };
  });

  return data;
});

// --- Result State ---
const resultVisible = ref(false);
const ticketResult = ref("");

// --- Function to Display Result ---
const showResult = () => {
  // You can perform additional calculations here.
  // For this example, we simply use the response from the API.
  if (res.success) {
    ticketResult.value = `Ticket ${res.betslipId} finished. Stake: ${res.stake}. Possible win: ${res.possibleWin}.`;
  } else {
    ticketResult.value = "Ticket lost!";
  }
  resultVisible.value = true;
};

// --------------------------
// Timer State: from 0 to 9 seconds
// --------------------------
// We use a 100ms interval to update the timer in 0.1-second increments.
const currentTime = ref(null);
let intervalId = null;

const timerStarted = computed(() => currentTime.value > 0);
const timerEnded = computed(() => currentTime.value >= 9);

onMounted(() => {
  currentTime.value = "Starting Game...";
  setTimeout(() => {
    currentTime.value = 0;

    intervalId = setInterval(() => {
      currentTime.value = +(currentTime.value + 0.1).toFixed(1);
      if (currentTime.value >= 9) {
        currentTime.value = 9;
        clearInterval(intervalId);
        showResult();
      }
    }, 250);
  }, 2000); // 2000ms = 2 seconds delay
});

onUnmounted(() => {
  clearInterval(intervalId);
});

/**
 * getCurrentScore(matchId)
 * Returns the current score (number of goals that have "occurred")
 * based on the timer's current time and the scaled times of goal events.
 */
const getCurrentScore = (matchId) => {
  const simulation = simulationData.value[matchId];
  if (!simulation) return { home: 0, away: 0 };

  // Count goal events that have occurred based on currentTime.
  const homeGoals = simulation.goalEvents.filter(
    (g) => g.team === "home" && g.time <= currentTime.value
  ).length;
  const awayGoals = simulation.goalEvents.filter(
    (g) => g.team === "away" && g.time <= currentTime.value
  ).length;
  return { home: homeGoals, away: awayGoals };
};

const getHalfTimeScore = (matchId) => {
  const simulation = simulationData.value[matchId];
  if (!simulation) return { home: 0, away: 0 };
  return timerEnded.value ? simulation.halfTime : "--:--";
};

const exitSimulation = () => {
  if(timerStarted.value && !timerEnded.value){
    // Skip
    currentTime.value = 9;
    clearInterval(intervalId);
    return
  }else if(timerEnded.value){
    couponStore.isSimulating = false;
  }
};
</script>

<style scoped>
#Simulate {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: #353a45;
  color: var(--text-type1-primary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
#Simulate.pc .size-16 {
  font-size: 16px;
}
#Simulate.pc .h-48 {
  height: 48px;
}
#Simulate.pc .pd-h-16 {
  padding: 0 16px;
}
#Simulate.pc .mr-12 {
  margin-right: 12px;
}
#Simulate.pc .w-h-18 {
  height: 18px;
  width: 18px;
}
#Simulate.pc .w-h-14 {
  height: 14px;
  width: 14px;
}
#Simulate.pc .pd-7-16 {
  padding: 7px 16px;
}
#Simulate.pc .insure-info-block {
  padding: 8px 16px;
}
#Simulate.pc .ticker-bar .insure-info-block {
  padding: 0 8px;
}
#Simulate .insure-info-block {
  padding: 0.66666667rem 1.33333333rem;
}
#Simulate .ticker-bar .insure-info-block {
  padding: 0 0.66666667rem;
  margin-right: auto;
}
#Simulate .ticket-wrapper {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  overflow: auto;
}
#Simulate .ticket-wrapper .ticker-bar {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
}
#Simulate .ticket-wrapper .ticker-bar .left {
  font-family: "Roboto-Medium";
}
#Simulate .ticket-wrapper .ticker-bar .rotate {
  -webkit-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
}
#Simulate .buttons {
  cursor: pointer;
  -webkit-flex-shrink: 0;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  font-family: "Roboto-Bold";
}
#Simulate .buttons > div {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
}
#Simulate .buttons .button__ok {
  background-color: #fafd00;
  background-color: var(--sim-primary);
  color: #000000;
}
#Simulate .size-16 {
  font-size: 1.33333333rem;
}
#Simulate .h-48 {
  height: 4rem;
}
#Simulate .pd-h-16 {
  padding: 0 1.33333333rem;
}
#Simulate .mr-12 {
  margin-right: 1rem;
}
#Simulate .w-h-18 {
  height: 1.5rem;
  width: 1.5rem;
}
#Simulate .w-h-14 {
  height: 1.16666667rem;
  width: 1.16666667rem;
}
#Simulate .pd-7-16 {
  padding: 0.58333333rem 1.33333333rem;
}
#Simulate .border-bottom {
  border-bottom: 1px solid #eaecef;
  border-bottom-color: #eaecef;
}
#Simulate .c-pointer {
  cursor: pointer;
}
#Simulate .m-icon-won::before {
  content: "\e69c";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
#Simulate .m-icon-won::before {
  color: #0d9737;
}
#Simulate .m-icon-won::before {
  color: var(--brand-secondary);
}
#Simulate .m-icon-won::before {
  font-size: 1.66666667rem;
}
#Simulate .flex-center {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
#Simulate .sim-card-mb-8:not(:last-child) {
  margin-bottom: 0.66666667rem;
}
.simulate-card {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
}
.simulate-card.pc .size-10 {
  font-size: 10px;
}
.simulate-card.pc .size-16 {
  font-size: 16px;
}
.simulate-card .teamScore {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1.8;
  -webkit-flex: 1.8;
  -ms-flex: 1.8;
  flex: 1.8;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-box-pack: space-evenly;
  -webkit-justify-content: space-evenly;
  -ms-flex-pack: space-evenly;
  justify-content: space-evenly;
}
.simulate-card .teamScore .teamScore__finished {
  font-weight: bold;
}
.simulate-card .teamScore .teamScore__half {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-family: "Roboto-Medium";
}
.simulate-card .result {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-family: "Roboto-Bold";
}
.simulate-card .size-10 {
  font-size: 0.83333333rem;
}
.simulate-card .size-16 {
  font-size: 1.33333333rem;
}
.simulate-card .m-icon-won::before {
  content: "\e69c";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.simulate-card .m-icon-won::before {
  color: #0d9737;
}
.simulate-card .m-icon-won::before {
  color: var(--brand-secondary);
}

.team-match {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-justify-content: space-around;
  -ms-flex-pack: distribute;
  justify-content: space-around;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  text-align: center;
  border-bottom: 1px solid #eaecef;
  border-bottom-color: #eaecef;
  font-family: "Roboto-Medium";
}
.team-match.pc .size-12 {
  font-size: 12px;
}
.team-match.pc .size-20 {
  font-size: 20px;
}
.team-match.pc .pd-v-15 {
  padding: 15px 0;
}
.team-match > * {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  width: 4rem;
}
.team-match .teamScore {
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-box-flex: 1.8;
  -webkit-flex: 1.8;
  -ms-flex: 1.8;
  flex: 1.8;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-pack: space-evenly;
  -webkit-justify-content: space-evenly;
  -ms-flex-pack: space-evenly;
  justify-content: space-evenly;
  font-family: "Roboto-Bold";
}
.team-match .teamName {
  -webkit-box-flex: 1.3;
  -webkit-flex: 1.3;
  -ms-flex: 1.3;
  flex: 1.3;
}
.size-12 {
  font-size: 1rem;
}
.size-20 {
  font-size: 1.66666667rem;
}
.pd-v-15 {
  padding: 1.25rem 0;
}
.event-bet {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-family: "Roboto-Regular";
}
.event-bet.pc.pd-t-10 {
  padding-top: 10px;
}
.event-bet.pc.pd-b-12 {
  padding-bottom: 12px;
}
.event-bet.pc .mr-r-8 {
  margin-right: 8px;
}
.event-bet.pc .type {
  width: 106px;
}
.event-bet.pc .type > :not(:last-child) {
  margin-right: 10px;
}
.event-bet .type {
  word-break: break-word;
  width: 8.83333333rem;
}
.event-bet .type > :not(:last-child) {
  margin-right: 0.83333333rem;
}
.event-bet .type .type__name {
  display: inline-block;
  text-transform: capitalize;
}
.event-bet .info {
  word-break: break-word;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.event-bet .info div {
  width: 50%;
}
.event-bet .info > div:first-child {
  text-align: center;
}
.event-bet .info > div:last-child {
  text-align: right;
}
.event-bet .info .info-odds {
  margin-left: 10px;
}
.pd-t-10 {
  padding-top: 0.83333333rem;
}
.pd-b-12 {
  padding-bottom: 1rem;
}
.mr-r-8 {
  margin-right: 0.66666667rem;
}
</style>
