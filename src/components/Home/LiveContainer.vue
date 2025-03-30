<template lang="">
  <div class="live-container">
    <div class="m-bet-tab">
      <div class="x-live-title">
        <span data-cms-key="live" data-cms-page="wap_home">Live</span>
        <div class="m-snap-nav-wrap m-sport-type" style="overflow: auto">
          <ul
            class="m-snap-nav flex"
            style="
              transform: translate(0px, 0px) translateZ(0px);
              transition-duration: 350ms;
              transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1);
            "
          >
            <li
              v-for="(sport, index) in sportsListData"
              :class="sport.sportID === activeSportID ? 'active' : ''"
              @click="setActiveSport(sport.sportID)"
              :key="index"
              :id="'live_' + sport.sportID"
              class="m-sport-type-item m-snap-nav-item"
              data-op="home_live-tabFootball"
            >
              {{ sport.sportName }}
            </li>
          </ul>
          <i class="controls left-controls"></i> <i class="controls right-controls"></i>
        </div>
      </div>
      <template v-if="isLoading">
        <LoadingSpinner v-show="isLoading"></LoadingSpinner>
        <LoadingError v-show="loadingError"></LoadingError>
      </template>
      <template v-else-if="!isLoading && !isEmptyResponse">
        <div style="position: relative">
          <div class="m-bet-content">
            <div class="m-market-tab m-tabs m-tabs-mini m-tabs-no-animation" style="overflow: auto">
              <div class="m-tabs-nav">
                <div
                  v-for="(market, m) in activeSportMarkets"
                  :key="m"
                  class="m-tabs-tab"
                  :class="market.marketID === activeMarket.marketID ? 'm-tabs-tab-active' : ''"
                  @click="selectMarket(market)"
                >
                  {{ market.marketName }}
                </div>
              </div>
            </div>
            <div class="x-table x-live-table football">
              <div class="x-table-row m-name-row">
                <div class="x-table-cell m-name-cell">
                  <div class="m-name">
                    <template
                      v-for="(market, m) in _.sortBy(activeMarket.outcomes, 'outcomeID')"
                      :key="m"
                    >
                      <div class="market-name">
                        <span> {{ market.outcomeName }} </span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              <LiveHighlightsFixture
                v-for="(fixture, index) in filteredLiveData"
                :gameData="fixture"
                :key="index"
                :activeMarket="activeMarket"
              ></LiveHighlightsFixture>
            </div>
            <div v-if="totalFixtures > 10" @click="$router.push('/Live')" class="view-all">
              <a class=""> View All Live {{ totalFixtures }} </a>
            </div>
          </div>
        </div>
      </template>
      <div v-else-if="!isLoading || isEmptyResponse || !completeLiveData.fixtures" class="no-data">
        <div style="white-space: pre-line">
          <p>Sorry, there are no games currently available</p>
          <p>in this category. Please try later.</p>
          <p>Thank you.</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import LiveHighlightsFixture from '@/components/Live/LiveHighlightsFixture.vue'
import { useUtilstStore } from '../../stores/utils.store'
import { useCouponStore } from '@/stores'
import LoadingError from '@/components/Loaders/LoadingError.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import { useQuery } from 'vue-query'
import { getLiveHighlights } from '@/helpers'
import { defineComponent, onMounted, ref, computed, watch, onUnmounted } from 'vue'
import _ from 'lodash'

const activeSportID = ref(1)
const isEmptyResponse = ref(false)
const loadingError = ref(false)
const utilsStore = useUtilstStore()
const couponStore = useCouponStore()
const totalFixtures = ref(1)

// Function to check if betslip selections exist in current event list
function checkBetslipSelectionsExist() {
  if (!completeLiveData.value?.fixtures || isEmptyResponse.value) {
    return;
  }
  
  // Get all match IDs from current fixtures
  const availableMatchIds = new Set(
    completeLiveData.value.fixtures.map(fixture => String(fixture.matchID))
  );
  
  let updatedAnySelection = false;
  
  // Check each selection in the betslip
  couponStore.coupon.selections.forEach(selection => {
    // Check if this is a live selection
    if (selection.type === "live") {
      const matchId = String(selection.matchId);
      
      // If the match is not in the current event list
      if (!availableMatchIds.has(matchId)) {
        // Suspend the selection
        selection.suspended = true;
        selection.unavailable = true;
        selection.odds = 0;
        updatedAnySelection = true;
      }
    }
  });
  
  // Only update winnings if we actually changed any selections
  if (updatedAnySelection) {
    // Force a reactivity update
    couponStore.updateWinnings({
      stake: couponStore.coupon.totalStake,
      id: "all",
    });
  }
}

const {
  data: completeLiveData,
  // error,
  isLoading,
  refetch
} = useQuery('liveData', getLiveHighlights, {
  // refetchInterval: 60000 * 3, // 3 minutes in milliseconds
  onError: (err) => {
    console.error(err)
    loadingError.value = true
  },
  onSuccess: (response) => {
    loadingError.value = false
    
    if (response.fixtures) {
      totalFixtures.value = response.fixtures.length
      // marketsGroup.value = response.markets.filter((market) => market.specifier === '')
      const uniqueList = []
      const uniqueSet = new Set()

      response.fixtures.forEach((fixture) => {
        const key = `${fixture.sportName}`
        if (!uniqueSet.has(key)) {
          uniqueSet.add(key)
          uniqueList.push({
            sportID: fixture.sportID,
            sportName: fixture.sportName
          })
        }
      })
      const sortedUniqueList = uniqueList.sort((a, b) => a.sportID - b.sportID)
      activeSportID.value = sortedUniqueList[0].sportID
    } else {
      isEmptyResponse.value = true
    }
  }
})

// Watch for changes to completeLiveData and run checkBetslipSelectionsExist when it has a value
watch(
  () => completeLiveData.value,
  (newData) => {
    if (newData && newData.fixtures) {
      checkBetslipSelectionsExist();
    }
  },
  { immediate: true }
)

// Also watch for changes to the betslip selections
watch(
  () => couponStore.coupon.selections,
  () => {
    if (completeLiveData.value && completeLiveData.value.fixtures) {
      checkBetslipSelectionsExist();
    }
  },
  { deep: true }
)

const sportsListData = computed(() => {
  if (isEmptyResponse.value) {
    return []
  } else {
    const uniqueList = []
    const uniqueSet = new Set()

    completeLiveData.value?.fixtures?.forEach((fixture) => {
      const key = `${fixture.sportName}`
      if (!uniqueSet.has(key)) {
        uniqueSet.add(key)
        uniqueList.push({
          sportID: fixture.sportID,
          sportName: fixture.sportName
        })
      }
    })
    const sortedUniqueList = uniqueList.sort((a, b) => a.sportID - b.sportID)
    return sortedUniqueList
  }
})

const filteredLiveData = computed(() => {
  return completeLiveData.value?.fixtures && !isEmptyResponse.value
    ? completeLiveData.value?.fixtures?.filter((s) => s.sportID == activeSportID.value).slice(0, 5)
    : []
})

const marketsGroup = computed(() => {
  let markets =
    completeLiveData.value?.fixtures && !isEmptyResponse.value
      ? completeLiveData.value?.markets
      : []
  // activeSportMarkets.value = _.sortBy(markets, 'marketID')
  // activeMarket.value = activeSportMarkets.value[0]
  return markets
})

const activeSportMarkets = computed(() => {
  let activeMarkets = marketsGroup.value.filter((s) => s.sportID == activeSportID.value)
  return activeMarkets ? _.sortBy(activeMarkets, 'marketID') : []
})

const activeMarket = computed(() => {
  return utilsStore.activeLiveMarkets
})

watch(activeSportMarkets, (newValue) => {
  // Update activeMarket when activeSportMarkets changes
  if (newValue.length) {
    utilsStore.activeLiveMarkets = newValue[0]
  } else {
    utilsStore.activeLiveMarkets = []
  }
})

function setActiveSport(sid) {
  activeSportID.value = sid
  // let markets = marketsGroup.value.filter((s) => s.sportID == activeSportID.value)
  // activeSportMarkets.value = _.sortBy(markets, 'marketID')
  // activeMarket.value = activeSportMarkets.value[0]
  document.getElementById('live_' + sid).scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

function selectMarket(market) {
  utilsStore.activeLiveMarkets = market
}

defineComponent({
  components: {
    LoadingError,
    LoadingSpinner
  },
  methods: {
    // Manually trigger a refetch without making a new network request
    handleManualRefetch() {
      refetch()
    }
  }
})
</script>

<style type="text/css">
.live-container {
  background-color: #000825;
  background-color: var(--brand-background-live);
  color: #ffffff;
  color: var(--text-type2-primary);
}
.live-container .m-market-tab {
  background-color: #000825;
  background-color: var(--brand-background-live);
  position: -webkit-sticky;
  position: sticky;
  top: 7.41666667rem;
  width: 100%;
  z-index: 26;
}

.live-container .m-market-tab .m-tabs-nav .m-tabs-ink-bar {
  background-color: #0d9737;
}
.live-container .m-market-tab .m-tabs-nav .m-tabs-tab {
  color: #ffffff;
  -webkit-box-flex: initial;
  -webkit-flex: initial;
  -ms-flex: initial;
  flex: initial;
  font-size: 1.066rem;
  font-weight: 500;
  margin-right: 0;
  padding: 1.33333333rem 0.83333333rem;
}
.live-container .m-market-tab .m-tabs-nav .m-tabs-tab-active {
  color: #ffffff;
  font-weight: bold;
  border-bottom: 0.23333333rem solid var(--brand-live-odds-text);
}
.live-container .m-bet-tab {
  /* background-color: var(--brand-background-live); */
  background-color: var(--brand-background-live);
  padding-bottom: 10px;
}
.live-container .m-bet-tab .x-live-title {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  margin: 0;
  padding: 1.066rem 1rem;
  position: -webkit-sticky;
  position: sticky;
  top: 3.66666667rem;
  z-index: 200;
  background: var(--brand-background-live);
}
.live-container .m-bet-tab .x-live-title > span {
  border-right: 1px solid;
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1;
  margin-right: 0.83333333rem;
  padding-right: 0.83333333rem;
  border-right-color: #9ca0ab;
  border-right-color: var(--text-type2-tertiary);
}
.live-container .m-bet-tab .m-sport-type {
  /* background-color: #1b1e25; */
  /* background-color: var(--brand-background-live); */
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
}
.live-container .m-bet-tab .m-sport-type .m-sport-type-item {
  font-size: 1.066rem;
  font-weight: normal;
  line-height: 1;
}
.live-container .m-bet-tab .m-sport-type .m-sport-type-item.active {
  color: var(--brand-live-odds-text);
  font-weight: bold;
}
.live-container .m-bet-tab .m-bet-content .x-live-table .m-name-row {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.live-container .m-bet-tab .m-bet-content .x-live-table .m-name-row .m-name-cell {
  background-color: #3a3c42;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: end;
  -webkit-justify-content: flex-end;
  -ms-flex-pack: end;
  justify-content: flex-end;
  padding: 0 0.83333333rem;
}
.live-container .m-bet-tab .m-bet-content .x-live-table .m-name-row .m-name-cell .m-name {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  width: 55%;
}
.live-container .m-bet-tab .m-bet-content .x-live-table .m-name-row .m-name-cell .m-name > div {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  height: 2rem;
  line-height: 2rem;
  text-align: center;
}
.live-container .m-bet-tab .m-bet-content .x-live-table.tennis .m-info-cell {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding-right: 0.83333333rem;
  width: 26%;
}
.live-container .m-bet-tab .m-bet-content .view-all a,
.live-container .m-bet-tab .m-bet-content .view-all a:hover,
.live-container .m-bet-tab .m-bet-content .view-all a:visited,
.live-container .m-bet-tab .m-bet-content .view-all a:active,
.live-container .m-bet-tab .m-bet-content .view-all a:after {
  /* color: var(--c-event-normal-text); */
  text-decoration: none;
}
.live-container .no-data:before {
  color: rgba(234, 236, 239, 0.15);
}
.live-container .m-loading.dark {
  /* background-color: #1b1e25; */
  background-color: var(--brand-background-live);
}
</style>
