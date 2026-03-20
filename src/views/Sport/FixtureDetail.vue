<template>
  <div>
    <div class="x-prematch-detail">
      <HeaderOther :headerTitle="'Details'"></HeaderOther>
      <div v-if="eventDetail && !isLoading">
        <div class="m-event-title">
          <div class="m-event-league link">
            {{ route.params.sport }} - {{ eventDetail.country }} - {{ eventDetail.tournament }}
          </div>
          <div class="m-event-title-team-horizontal">
            <div class="watermark">
              <div><img :src="'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F' +
                encodeURIComponent(eventDetail.homeTeam.toUpperCase()) +
                '.png?alt=media'
                " draggable="false" class="home" style=""></div>
              <div class="switch-button-left"><svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
                  height="10px" width="10px" class="svg-icon-base">
                  <path d="M5 8.75l.661-.661-2.616-2.62H8.75v-.938H3.045l2.62-2.616L5 1.25 1.25 5 5 8.75z"
                    fill="currentColor"></path>
                </svg></div>
            </div>
            <div class="team">
              <div class="team-icon"><img :src="'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F' +
                encodeURIComponent(eventDetail.homeTeam.toUpperCase()) +
                '.png?alt=media'
                " draggable="false" style=""></div>
              <div class="team-name">{{ eventDetail.homeTeam }}</div>
            </div>
            <div class="date-time">
              <div class="date">
                <div>{{ formatDate(eventDetail.date, 'DD/MM dddd') }}</div>
              </div>
              <div class="time">
                {{ formatDate(eventDetail.date, 'HH:mm') }}
              </div>
            </div>
            <div class="team">
              <div class="team-icon"><img :src="'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F' +
                encodeURIComponent(eventDetail.awayTeam.toUpperCase()) +
                '.png?alt=media'
                " draggable="false" style=""></div>
              <div class="team-name">{{ eventDetail.awayTeam }}</div>
            </div>
            <div class="watermark">
              <div><img :src="'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F' +
                encodeURIComponent(eventDetail.awayTeam.toUpperCase()) +
                '.png?alt=media'
                " draggable="false" class="away" style=""></div>
              <div class="switch-button-right"><svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
                  height="10px" width="10px" class="svg-icon-base">
                  <path d="M5 8.75l.661-.661-2.616-2.62H8.75v-.938H3.045l2.62-2.616L5 1.25 1.25 5 5 8.75z"
                    fill="currentColor"></path>
                </svg></div>
            </div>
          </div>
          <div class="m-event-time-wrap">
            <div class="m-event-time-left"><span class="event-date"><span class="event-gameid">Game ID {{
              eventDetail.matchID }}</span>

              </span></div>
          </div>
        </div>
        <div style="position: relative"></div>
        <div class="m-tab-navs-wrap">
          <ul class="m-tab-navs">
            <li class="m-nav-item" @click="isH2HShowing = false" :class="isH2HShowing ? '' : 'active'">
              <i class="m-icon m-icon-market"></i>
              <span class="m-text">Markets</span>
            </li>
            <li class="m-nav-item" :class="!isH2HShowing ? '' : 'active'"
              @click="showFixtureAnalysis(eventDetail.matchID)">
              <i class="m-icon m-icon-stat"></i>
              <span class="m-text">Stats</span>
            </li>
          </ul>
        </div>


        <div v-show="!isH2HShowing" class="m-sub-tab">
          <div class="m-snap-nav-wrap m-group" style="overflow: hidden;">
            <ul class="m-snap-nav flex"
              style="transform: translate(0px, 0px) translateZ(0px); transition-duration: 350ms; transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1); width: 645.388px;">
              <li class="m-sport-group-item m-snap-nav-item" :class="{ active: sharedSelectedGroupId === null }"
                @click="sharedSelectedGroupId = null">
                <span>All</span>
              </li>
              <li v-for="group in sharedSortedMarketGroups" :key="group.id" class="m-sport-group-item m-snap-nav-item"
                :class="{ active: sharedSelectedGroupId === group.id }" @click="sharedSelectedGroupId = group.id">
                <span>{{ group.name }}</span>
              </li>
            </ul> <i class="controls left-controls"></i> <i class="controls right-controls"></i>
          </div>
          <div v-if="eventDetail.status === 0" class="m-market-group pre-match event-detail">
            <div v-if="sharedHasNoMarketsInSelectedGroup" class="m-sport-market-no-data">
              <div style="white-space: pre-line">
                Sorry, there are no markets available in this category.
              </div>
            </div>
            <div v-else-if="sharedDisplayGroupedMarkets.length === 0" class="m-sport-market-no-data">
              <div style="white-space: pre-line">
                Sorry, there are no markets available in this category.
              </div>
            </div>
            <div v-else class="m-sport-market">
              <div v-for="(marketGroup, index) in sharedDisplayGroupedMarkets" :key="index"
                :data-key="'market-' + marketGroup.marketID">
                <div class="m-market m-detail-market-default">
                  <div class="m-market-title" style="flex-basis: 100%">
                    <span class="dis-icon"></span>
                    <span class="text" style="text-transform: capitalize">{{ sharedCleanMarketName(marketGroup.marketName, marketGroup.specifier) }}
                    </span>
                    <span class="m-icon-tips"></span>
                  </div>
                  <div class="m-table market-content">
                    <div
                      v-if="sharedHasSectionTabs(marketGroup)"
                      class="m-market-section-tabs"
                    >
                      <button
                        v-for="option in marketGroup.layout.sections"
                        :key="option.key"
                        type="button"
                        class="m-market-section-tab"
                        :class="{
                          active: sharedGetActiveSection(marketGroup)?.key === option.key
                        }"
                        @click="sharedSetActiveSection(marketGroup, option.key)"
                      >
                        {{ option.label }}
                      </button>
                    </div>
                    <template
                      v-for="section in [sharedGetActiveSection(marketGroup)].filter(Boolean)"
                      :key="section.key"
                    >
                      <div v-if="section.label" class="m-market-section-label">{{ section.label }}</div>
                      <template v-if="marketGroup.layout.type === 'matrix'">
                        <div class="m-table">
                          <div class="m-table-row">
                            <div
                              class="m-table-cell m-outcome-only-odds m-outcome-combo-title"
                              :class="sharedColClass(section.totalCols)"
                            ></div>
                            <div
                              v-for="column in (section.displayColumns || section.columns)"
                              :key="column"
                              class="m-table-cell m-outcome-only-odds m-outcome-combo-column-title"
                              :class="sharedColClass(section.totalCols)"
                            >
                              {{ column }}
                            </div>
                          </div>
                          <div v-for="row in section.rows" :key="row.key" class="m-table-row">
                            <div
                              class="m-table-cell m-outcome-only-odds m-outcome-combo-title"
                              :class="sharedColClass(section.totalCols)"
                            >
                              <em>{{ row.label }}</em>
                            </div>
                            <template v-for="cell in row.cells" :key="cell?.key || `${row.key}-empty`">
                              <div
                                v-if="cell"
                                class="m-table-cell m-outcome-combo m-outcome-only-odds m-outcome m-detail-outcome-default"
                                :class="[
                                  sharedColClass(section.totalCols),
                                  {
                                    'm-outcome--checked': isSelected(
                                      createID(
                                        eventDetail.matchID,
                                        cell.outcome.marketID,
                                        cell.outcome.outcomeID,
                                        cell.outcome.specifier,
                                        cell.market.marketName,
                                        cell.outcome.outcomeName
                                      ),
                                      couponStore.coupon
                                    ),
                                    'm-outcome--disabled':
                                      cell.outcome.active === 0 ||
                                      cell.outcome.odds <= 1 ||
                                      !cell.outcome.odds
                                  }
                                ]"
                                @click="addToBetslip(cell.market, cell.outcome)"
                              >
                                <em
                                  :class="{
                                    'm-icon-lock':
                                      cell.outcome.active === 0 ||
                                      cell.outcome.odds <= 1 ||
                                      !cell.outcome.odds
                                  }"
                                >
                                  {{
                                    cell.outcome.active === 0 ||
                                    cell.outcome.odds <= 1 ||
                                    !cell.outcome.odds
                                      ? ''
                                      : cell.outcome.odds.toFixed(2)
                                  }}
                                </em>
                              </div>
                              <div
                                v-else
                                class="m-table-cell m-outcome-only-odds"
                                :class="sharedColClass(section.totalCols)"
                              ></div>
                            </template>
                          </div>
                        </div>
                      </template>
                      <template v-else>
                        <div v-for="row in section.rows" :key="row.key" class="m-table-row">
                          <div
                            v-for="cell in row.cells"
                            :key="cell.key"
                            class="m-table-cell m-outcome m-detail-outcome-default m-outcome-odds-des"
                            :class="{
                              'm-outcome--checked': isSelected(
                                createID(
                                  eventDetail.matchID,
                                  cell.outcome.marketID,
                                  cell.outcome.outcomeID,
                                  cell.outcome.specifier,
                                  cell.market.marketName,
                                  cell.outcome.outcomeName
                                ),
                                couponStore.coupon
                              ),
                              'm-outcome-two': row.cells.length === 2,
                              'm-outcome-three': row.cells.length === 3,
                              'm-outcome--disabled':
                                cell.outcome.active === 0 ||
                                cell.outcome.odds <= 1 ||
                                !cell.outcome.odds
                            }"
                            @click="addToBetslip(cell.market, cell.outcome)"
                          >
                            <em style="text-transform: capitalize">{{ cell.outcome.displayName }}</em>
                            <em
                              :class="{
                                'm-icon-lock':
                                  cell.outcome.active === 0 ||
                                  cell.outcome.odds <= 1 ||
                                  !cell.outcome.odds
                              }"
                            >
                              {{
                                cell.outcome.active === 0 ||
                                cell.outcome.odds <= 1 ||
                                !cell.outcome.odds
                                  ? ''
                                  : cell.outcome.odds.toFixed(2)
                              }}
                            </em>
                          </div>
                        </div>
                      </template>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="m-sport-market-no-data">
            <div style="white-space: pre-line">
              Sorry, this game is no longer available. Betting has closed. Please choose other
              games.
            </div>
          </div>
        </div>
        <div v-show="isH2HShowing" class="m-sub-tab">
          <div class="m-h2h">
            <div id="sr-widget"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-if="isLoading"></LoadingSpinner>
  <ErrorDialogue v-else-if="!isLoading && !eventDetail" :message="errorMessage"></ErrorDialogue>
</template>

<script setup>
import HeaderOther from '@/components/HeaderOther.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import { defineComponent, watch, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFixtureMarkets, getMarketsGrouping, formatDate, createID, isSelected } from '@/helpers'
// import _ from 'lodash'
import ErrorDialogue from '@/components/ErrorDialogue.vue'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '@/helpers'
import { useMqttService } from '@/composables/useMqtt'
import { useUtilsStore } from '../../stores'
import { useFixtureDetailMarkets } from '@/composables/useFixtureDetailMarkets'

const { subscribe } = useMqttService()
const { sportsMenu } = useUtilsStore()

const eventMarkets = ref()
const eventDetail = ref(null)
const marketGroups = ref([])
const isLoading = ref(false)
const route = useRoute()
const router = useRouter()
const errorMessage = ref()
const couponStore = useCouponStore()
const isH2HShowing = ref(false)
const unsubscribeFunctions = ref([])
const {
  selectedGroupId: sharedSelectedGroupId,
  displayGroupedMarkets: sharedDisplayGroupedMarkets,
  sortedMarketGroups: sharedSortedMarketGroups,
  hasNoMarketsInSelectedGroup: sharedHasNoMarketsInSelectedGroup,
  colClass: sharedColClass,
  cleanMarketName: sharedCleanMarketName,
  getActiveSection: sharedGetActiveSection,
  setActiveSection: sharedSetActiveSection,
  hasSectionTabs: sharedHasSectionTabs
} = useFixtureDetailMarkets(eventMarkets, marketGroups, eventDetail)

watch(
  () => [route.params.event_id, route.name],
  async ([event_id, route_name]) => {
    if (route_name === 'fixtures-detail') {
      await getEventDetail(event_id)
    }
  },
  { immediate: true }
)

// MQTT setup
function setupMqttSubscriptions(matchId, sport_id) {
  resetMqttSubscriptions()
  const baseTopic = `sports/${sport_id}/match/${matchId}`
  const topics = {
    markets: `${baseTopic}/markets`,
    betStop: `${baseTopic}/bet_stop`,
    matchStatus: `${baseTopic}/match_status`,
    scores: `${baseTopic}/scores`
  }

  const unsubscribers = [
    subscribe(topics.markets, (data) => {
      handleOddsChange(data, matchId)
    }),
    subscribe(topics.betStop, (data) => {
      handleBetStop(data, matchId)
    }),
    subscribe(topics.matchStatus, (data) => {
      handleFixtureStatus(data)
    }),
    subscribe(topics.scores, (data) => {
      handleFixtureStatus(data)
    })
  ]

  unsubscribeFunctions.value = unsubscribers
}

function resetMqttSubscriptions() {
  if (unsubscribeFunctions.value.length > 0) {
    unsubscribeFunctions.value.forEach((unsubscribe) => unsubscribe())
    unsubscribeFunctions.value = []
  }
}

function setupPeriodicRefetch(matchId) {
  // Prematch detail now relies on MQTT only; keep the hook inert while cleanup lands.
  return
  if (refetchInterval.value) {
    clearInterval(refetchInterval.value)
  }

  // Set up new interval
  refetchInterval.value = setInterval(async () => {
    if (eventDetail.value?.status === 0) {
      try {
        const res = await getFixtureMarkets(matchId)
        if (Object.keys(res.data).length && res.data.market.length) {
          eventMarkets.value = res.data?.market.filter((market) => market.statusName !== 'Suspended')
        }
      } catch (error) {
        console.error(`❌ Error during periodic refetch:`, error);
      }
    } else {
      // console.log(
      //   `⏹️ Match no longer available, stopping periodic refetch for match ID: ${matchId}`,
      // );
      clearInterval(refetchInterval.value)
    }
  }, REFETCH_INTERVAL_MS)
}

onBeforeUnmount(() => {
  resetMqttSubscriptions()
})

async function getEventDetail(id) {
  isLoading.value = true
  const { sport_id } = sportsMenu.find((x) => x.sport_name == route.params.sport)
  try {
    const res = await Promise.all([getFixtureMarkets(id), getMarketsGrouping(sport_id)])
    if (res[0].data && res[0].data.market) {
      if (res[0].data.matchStatus.toLowerCase() !== 'not started') {
        router.push({
          name: 'live-fixtures-detail',
          params: {
            sport: route.params.sport,
            tournament:  route.params.tournament,
            event_name:  route.params.event_name,
            event_id: route.params.event_id
          }
        })
      }
      eventDetail.value = res[0].data
      eventMarkets.value = res[0].data?.market.filter((market) => market.statusName !== 'Suspended')
      marketGroups.value = res[1].data
      setupMqttSubscriptions(res[0].data.matchID, sport_id)
    }
  } catch (error) {
    console.log(error)
    eventDetail.value = null
    emitter.emit('showErrorMessage', {
      message: error.message || 'Failed to load event details',
      next_route: 'home'
    })
  } finally {
    isLoading.value = false
  }
}

function addToBetslip(market, outcome) {
  if (outcome.active === 0 || outcome.odds <= 1) return
  let marketId = parseInt(market.marketID)
  if (couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)) {
    emitter.emit(
      'showErrorMessage',
      'This market is not supported in simulation mode. Exit Simulation mode to add to betslip'
    )
    return
  }
  const id = createID(
    eventDetail.value.matchID,
    outcome.marketID,
    outcome.outcomeID,
    outcome.specifier,
    market.marketName,
    outcome.outcomeName
  )
  const data = {
    fixture: eventDetail.value,
    market_name: market.marketName,
    market_id: market.marketID,
    ele_id: id,
    outcome: outcome,
    odds: outcome.odds,
    odd_id: outcome.outcomeID,
    odd_name: outcome.outcomeName,
    type: 'prematch',
    event_id: eventDetail.value.matchID,
    specifier: outcome.specifier || market.specifier
  }
  // return couponStore.addToCoupon(data)
  const existsInBetslip = isSelected(id, couponStore.coupon)
  return existsInBetslip ? couponStore.removeSelection(id) : couponStore.addToCoupon(data)
}

const showFixtureAnalysis = (id, widgetName = 'headToHead.standalone') => {
  isH2HShowing.value = true
  const statWrapper = document.getElementById('sr-widget')
  window.SIR('addWidget', '#sr-widget', 'headToHead.standalone', {
    gamePulseBtnEnable: true,
    matchId: `${eventDetail.value.matchID}`
  })
}

// Function to handle odds changes (legacy format support)
function handleOddsChange(data, match_id) {
  if (!data) return

  const dataMatchId = data.match_id || data.event_id
  if (dataMatchId && String(dataMatchId) !== String(match_id)) return

  const applyMarketUpdate = (payload) => {
    const outcomes = payload.outcomes || []
    if (outcomes.length === 0) return

    if (eventMarkets.value) {
      requestAnimationFrame(() => {
        let marketFound = false
        let shouldRemoveMarket = false

        eventMarkets.value = eventMarkets.value.map((market) => {
          const marketMatches = market.marketID === payload.market_id
          const specifierMatches = (market.specifier || '') === (payload.specifier || '')

          if (!marketMatches || !specifierMatches) {
            return market
          }

          marketFound = true
          if (payload.status_name && payload.status_name.toLowerCase() === 'deactivated') {
            shouldRemoveMarket = true
            return null
          }

          const updatedMarket = {
            ...market,
            statusName: payload.status_name || market.statusName,
            outcomes: market.outcomes.map((outcome) => {
              const updatedOutcome = outcomes.find(
                (o) => String(o.outcome_id) === String(outcome.outcomeID)
              )

              if (updatedOutcome) {
                return {
                  ...outcome,
                  odds: updatedOutcome.odds,
                  active: updatedOutcome.active ? 1 : 0,
                  probability: updatedOutcome.probability || outcome.probability
                }
              }

              return outcome
            })
          }

          return updatedMarket
        }).filter(market => market !== null)

        if (!marketFound && payload.status_name && payload.status_name.toLowerCase() !== 'deactivated') {
          const newMarket = {
            marketID: payload.market_id,
            marketName: payload.market_name,
            specifier: payload.specifier || '',
            statusName: payload.status_name || 'Active',
            sportID: payload.sport_id || 0,
            outcomes: outcomes.map(outcome => ({
              outcomeID: outcome.outcome_id,
              outcomeName: outcome.outcome_name,
              displayName: outcome.alias || outcome.outcome_name,
              odds: outcome.odds,
              active: outcome.active ? 1 : 0,
              probability: outcome.probability || 0
            })),
          }

          eventMarkets.value.push(newMarket)
        }
      })
    }
  }

  if (Array.isArray(data.markets)) {
    data.markets.forEach((market) => {
      const outcomes = (market.outcomes || []).map((outcome) => ({
        outcome_id: outcome.id ?? outcome.outcome_id ?? outcome.outcomeID,
        outcome_name: outcome.outcome_name ?? outcome.outcomeName,
        alias: outcome.alias,
        odds: outcome.odds,
        active: outcome.active,
        probability: outcome.probability
      }))

      applyMarketUpdate({
        market_id: market.id ?? market.market_id ?? market.marketID,
        market_name: market.market_name ?? market.marketName,
        specifier: market.specifiers ?? market.specifier ?? '',
        status_name: market.status_name ?? market.statusName,
        sport_id: market.sport_id ?? market.sportID,
        outcomes
      })
    })
    return
  }

  applyMarketUpdate(data)
}

function handleBetStop(data) {
  const matchId = eventDetail.value.matchID
  const dataMatchId = data.event_id || data.match_id

  if (dataMatchId && String(dataMatchId) !== String(matchId)) return
  if (eventMarkets.value?.length > 0) {
    eventMarkets.value = eventMarkets.value.map((market) => ({
      ...market,
      outcomes: market.outcomes.map((outcome) => ({
        ...outcome,
        odds: 0,
        active: 0
      }))
    }))
  }

  // Check if match time has passed (match should have started)
  const matchTime = new Date(eventDetail.value.date)
  const currentTime = new Date()

  if (matchTime <= currentTime) {
    // Remove all outcomes - match has started
    eventMarkets.value = []
    eventDetail.value.statusCode = 1

    emitter.emit('showErrorMessage', {
      message: 'This event is not longer available for betting',
      next_route: 'home'
    })
  }
}

function handleFixtureStatus(data) {
  const matchId = eventDetail.value?.matchID
  const dataMatchId = data.event_id || data.match_id || data.matchId
  if (dataMatchId && matchId && String(dataMatchId) !== String(matchId)) return

  const status = data?.status ?? data?.status_code
  const matchStatus = String(data?.match_status || '').toLowerCase()

  if (
    status === 1 ||
    status === '1' ||
    (matchStatus && !matchStatus.includes('not') && !matchStatus.includes('prematch'))
  ) {
    router.push({
      name: 'live-fixtures-detail',
      params: {
        sport: route.params.sport,
        tournament: route.params.tournament,
        event_name: route.params.event_name,
        event_id: route.params.event_id
      }
    })
  }
}

defineComponent({
  name: 'fixture-detail'
})

onMounted(() => {
  let script = document.createElement('script')
  script.text = `
    (function(a,b,c,d,e,f,g,h,i){a[e]||(i=a[e]=function(){(a[e].q=a[e].q||[]).push(arguments)},i.l=1*new Date,i.o=f,
    g=b.createElement(c),h=b.getElementsByTagName(c)[0],g.async=1,g.src=d,g.setAttribute("n",e),h.parentNode.insertBefore(g,h)
    )})(window,document,"script", "https://widgets.sir.sportradar.com/9a7545262c211f21e8cdaf98d9b86856/widgetloader", "SIR", {
        theme: false, // using custom theme
        language: "en"
    });`
  document.body.appendChild(script)
})
</script>

<style scoped>
.x-prematch-detail {
  background-color: #fafafa;
  /* background-color: var(--background-general-primary); */
}

.x-prematch-detail .prematch-detail-loading {
  min-height: 15rem;
}

.x-prematch-detail .m-tab-navs {
  padding-bottom: 0.41666667rem;
}

.x-prematch-detail .m-sport-market {
  overflow: hidden;
}

.m-sport-market-no-data {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #9ca0ab;
  min-height: 100px;
  /* padding: 5rem 2.33333333rem 10rem; */
  padding-left: 2.3rem;
  padding-right: 2.3rem;
  text-align: center;
}

.m-sport-market-no-data::before {
  content: '\e624';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-sport-market-no-data p {
  white-space: nowrap;
  color: #9ca0ab;
}

.m-sport-market-no-data .market-favor-empty-text {
  white-space: initial;
}

.m-sport-market-no-data:before {
  color: #333;
  color: var(--text-type2-secondary);
  font-size: 2.5rem;
}

@media only screen and (max-width: 320px) and (max-height: 480px) {
  .m-sport-market-no-data br {
    display: none;
  }
}

.m-tab-navs-wrap {
  width: 100%;
}

.m-tab-navs {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding: 1.25rem 0.83333333rem;
  width: 100%;
}

.m-tab-navs>li {
  background-color: #eaecef;
  background-color: var(--background-type1-tertiary);
  border-radius: 0.16666667rem;
  color: #353a45;
  color: var(--text-type1-primary);
  -webkit-box-flex: 1;
  -webkit-flex: auto;
  -ms-flex: auto;
  flex: auto;
  font-size: 1rem;
  height: 2.33333333rem;
  line-height: 2.33333333rem;
  margin-right: 1px;
  position: relative;
  text-align: center;
  width: 33.33%;
}

.m-tab-navs>li:last-child {
  margin-right: 0;
}

.m-tab-navs>li.active {
  background-color: #1b1e25;
  background-color: var(--c-prematch-active-tab-bg);
  color: #ffffff;
  color: var(--c-prematch-active-tab-text);
}

.m-tab-navs>li.active .m-icon:before {
  color: #ffffff;
  color: var(--c-prematch-active-tab-text);
}

.m-tab-navs .m-icon:before {
  color: #1b1e25;
  color: var(--text-type1-tertiary);
  font-size: 1rem;
  line-height: 2.33333333rem;
}

.m-tab-navs .m-text {
  vertical-align: top;
}

.m-tab-navs .m-count-badge {
  background: #e41827;
  border: 1px solid #ffffff;
  border-radius: 0.54166667rem;
  color: #ffffff;
  font-size: 0.83333333rem;
  font-weight: bold;
  line-height: 0.91666667rem;
  min-width: 0.91666667rem;
  padding: 0 0.16666667rem;
  position: absolute;
  right: 0.41666667rem;
  text-align: center;
  top: -0.54166667rem;
}

.x-prematch-detail .m-tab-navs .m-icon-market::before {
  content: "\e66e";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.x-prematch-detail .m-tab-navs .m-icon-stat::before {
  content: "\e64a";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.x-prematch-detail .m-tab-navs .m-icon-comment::before {
  content: "\e669";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.x-prematch-detail .h-team-wrap {
  -webkit-box-align: baseline;
  -webkit-align-items: baseline;
  -ms-flex-align: baseline;
  align-items: baseline;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  min-width: 0;
}

.x-prematch-detail .h-team-wrap .spacer {
  font-size: 1.16666667rem;
  font-weight: normal;
  padding: 0 0.33333333rem;
}

.x-prematch-detail .h-team-wrap .team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.x-prematch-detail .h-team-wrap .team-name.home {
  -webkit-flex-shrink: 0;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  max-width: 8.33333333rem;
}

.x-prematch-detail .m-event-title {
  min-height: 9.33333333rem !important;
  overflow-x: hidden;
  padding: 0.33333333rem 0.66666667rem;
  position: relative;
}

.x-prematch-detail .m-event-title .m-event-league {
  color: #353a45;
  font-size: 0.83333333rem;
  line-height: normal;
  padding-top: 0;
  text-align: center;
}

.x-prematch-detail .m-event-title .m-event-league.link {
  color: #0D9737;
  text-decoration: underline;
}

.x-prematch-detail .m-event-title .m-event-league.more-top-space {
  padding-top: 0.66666667rem;
}

.x-prematch-detail .m-event-title .m-event-title-team {
  color: #353A45;
  color: var(--text-default-dark);
  margin-top: 0.75rem;
}

.x-prematch-detail .m-event-title .m-event-title-team>div {
  font-size: 1rem;
  font-weight: bold;
  line-height: 1.16666667rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal {
  color: #353A45;
  color: var(--text-default-dark);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  min-height: 5.83333333rem;
  padding: 8px 0;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark img {
  height: 9.16666667rem;
  opacity: 0.1;
  position: absolute;
  top: 2.08333333rem;
  -webkit-user-drag: none;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .away {
  right: -4.08333333rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .home {
  left: -4.08333333rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .switch-button {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-align-self: center;
  -ms-flex-item-align: center;
  align-self: center;
  border-radius: 50%;
  -webkit-box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  -webkit-box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 1.66666667rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  justify-self: center;
  position: relative;
  width: 1.66666667rem;
  color: #9CA0AB;
  color: var(--text-type1-secondary);
  background-color: #FAFAFA;
  background-color: var(--background-general-tertiary);
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .switch-button-left {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-align-self: center;
  -ms-flex-item-align: center;
  align-self: center;
  border-radius: 50%;
  -webkit-box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  -webkit-box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 1.66666667rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  justify-self: center;
  position: relative;
  width: 1.66666667rem;
  color: #9CA0AB;
  color: var(--text-type1-secondary);
  background-color: #FAFAFA;
  background-color: var(--background-general-tertiary);
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .switch-button-right {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-align-self: center;
  -ms-flex-item-align: center;
  align-self: center;
  border-radius: 50%;
  -webkit-box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  -webkit-box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 1.66666667rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  justify-self: center;
  position: relative;
  width: 1.66666667rem;
  color: #9CA0AB;
  color: var(--text-type1-secondary);
  background-color: #FAFAFA;
  background-color: var(--background-general-tertiary);
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .switch-button-right svg {
  -webkit-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .team {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  font-size: 1rem;
  font-weight: 700;
  -webkit-box-pack: start;
  -webkit-justify-content: start;
  -ms-flex-pack: start;
  justify-content: start;
  line-height: 1.16666667rem;
  padding: 0.33333333rem 0;
  text-align: center;
  width: 7.66666667rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .team .team-icon {
  height: 2.75rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .team .team-icon img {
  height: 2.75rem;
  -webkit-user-drag: none;
  width: 2.75rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .team .team-name {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .date-time {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  font-size: 0.83333333rem;
  font-weight: 700;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  line-height: 0.91666667rem;
  padding: 0 12px;
  text-align: center;
  width: 4.58333333rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .date-time .date {
  font-size: 0.83333333rem;
  font-weight: 400;
  padding-bottom: 0.33333333rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .date-time .time {
  background-color: #EAECEF;
  background-color: var(--background-type1-tertiary);
  border-radius: 2px;
  padding: 0 0.16666667rem;
  width: 2.33333333rem;
}

.x-prematch-detail .m-event-title .m-event-time-wrap {
  color: #353A45;
  color: var(--text-default-dark);
  bottom: 0rem;
  font-size: 0.66666667rem;
  height: 0.91666667rem;
  line-height: 0.91666667rem;
  padding: 2px 0;
  text-align: center;
  width: 100%;
}

.x-prematch-detail .m-event-title .m-event-time-wrap>span {
  margin-right: 0.66666667rem;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .event-gameid {
  opacity: 0.5;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .live-in-play::before {
  content: "\e64e";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .live-in-play::before {
  font-size: 0.66666667rem;
  margin-right: 0.16666667rem;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .event-date {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .event-date span {
  margin-right: 0.33333333rem;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .event-date::before {
  font-size: 0.83333333rem;
  margin-right: 0.16666667rem;
}

.x-prematch-detail .m-event-title .event-delay {
  color: #353A45;
  color: var(--text-default-dark);
}

.x-prematch-detail .m-event-title .event-delay img {
  height: 1.25rem;
  width: 1.25rem;
}

.x-prematch-detail .m-event-title .m-h2h {
  margin: 0 1.25rem;
  padding: 0.83333333rem 0;
}

.x-prematch-detail .m-event-title .labels {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-wrap: wrap;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  height: 1.5rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  padding-bottom: 0.33333333rem;
}

.x-prematch-detail .m-event-title .labels .label-group .event-labels {
  margin: 0.33333333rem 0 0 -0.83333333rem;
}

.x-prematch-detail .m-event-title .labels .switch-match-btn-list {
  background-color: #EAECEF;
  background-color: var(--background-type1-tertiary);
  color: #353A45;
  color: var(--text-default-dark);
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  border-radius: 40px;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 0.83333333rem;
  font-weight: 700;
  height: 1.33333333rem;
  padding: 0 0.33333333rem;
}

.x-prematch-detail .m-event-title .labels .switch-match-btn-list .list-icon {
  padding-left: 0.33333333rem;
}

.x-prematch-detail .m-sport-market .m-market .market-content .m-outcome.m-outcome--disabled {
  color: #9CA0AB !important;
  background-color: #DCDEE5 !important;
}

.x-prematch-detail .m-footer--preMatch {
  padding-bottom: 3.66666667rem;
}

.x-prematch-detail .m-nav-left {
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  min-width: 0;
}

.x-prematch-detail .m-outcome.in-range {
  border: 0.08333333rem solid #0D9737 !important;
}


.m-group {
  background-color: #FAFAFA;
  background-color: var(--background-general-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 0 0.33333333rem 0 0;
  width: 100%;
}

.m-group .m-sport-group-item {
  cursor: pointer;
  font-weight: 700;
  height: 4rem;
  line-height: 4rem;
  margin-bottom: -1px;
  padding: 0 0.91666667rem;
}

.m-group .m-sport-group-item .text {
  color: #353A45;
  color: var(--text-type1-primary);
  font-size: 1rem;
}

.m-group .m-sport-group-item.no-border {
  border-bottom: none !important;
}

.m-group .m-sport-group-item.active {
  border-bottom: 4px solid #0D9737;
  border-color: #0D9737;
  border-color: var(--brand-secondary);
}

.m-market-section-tabs {
  display: flex;
  gap: 0.5rem;
  padding: 0.5rem 0 0.75rem;
  overflow-x: auto;
  scrollbar-width: none;
}

.m-market-section-tabs::-webkit-scrollbar {
  display: none;
}

.m-market-section-tab {
  border: 1px solid var(--border-type2-primary);
  border-radius: 999px;
  background: var(--background-general-primary);
  color: var(--text-type2-tertiary);
  font-size: 0.91666667rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.5rem 0.85rem;
  white-space: nowrap;
}

.m-market-section-tab.active {
  border-color: var(--brand-secondary);
  background: color-mix(in srgb, var(--brand-secondary) 12%, white);
  color: var(--brand-secondary);
}

.m-market-section-label {
  color: var(--text-type2-secondary);
  font-size: 0.91666667rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
</style>
