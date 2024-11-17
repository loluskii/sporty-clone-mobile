<template lang="">
  <div style="min-height: 102px; width: 100%">
    <div data-op="label-prematch" class="m-event-sport m-sports-row">
      <div class="m-event-meta">
        <div>
          <span class="m-time" style="margin-right: 5px">{{ eventData.eventTime }}</span>
          <span class="m-game-id" style="margin-right: 5px">ID {{ eventData.gameID }}</span>
          <span class="m-league-name"
            >{{ eventData.tournament }} - {{ eventData.categoryName }}</span
          >
        </div>
        <img
          src="@/assets/images/chart.png"
          style="height: 12px"
          alt=""
          @click="showFixtureAnalysis(eventData.matchID)"
          srcset=""
        />
      </div>
      <div class="x-table-row m-sports-table">
        <div
          class="x-table-cell m-info-cell"
          @click="
            $router.push({
              name: 'fixtures-detail',
              params: {
                sport: slugify(eventData.sportName),
                tournament_name: slugify(eventData.tournament),
                event_name: slugify(eventData.name),
                event_id: eventData.matchID
              }
            })
          "
        >
          <div class="team">{{ eventData.homeTeam }}</div>
          <div class="team">{{ eventData.awayTeam }}</div>
        </div>
        <div class="x-table-cell m-market-cell">
          <div class="m-market m-event-market-default market-id-1" style="position: relative">
            <template v-if="eventData.outcomes && eventData.activeMarkets > 0">
              <template v-if="outcomes.length">
                <div
                  v-if="activeMarket.specifier !== ''"
                  class="m-outcome m-event-outcome-default specifiers-select"
                  @click="toggleList"
                >
                  <div tabindex="0" class="grid-specifier-select">
                    <div class="grid-specifier-select-label">{{ activeSpecifier }}</div>
                    <div class="grid-specifier-select-icon">
                      <em class="icon">^</em>
                    </div>
                    <!---->
                  </div>
                </div>
                <div
                  class="af-select-list m-event-specifiers-order"
                  v-if="specifierOpen"
                  :class="'af-select-list-' + eventData.matchID"
                  style="width: 62px; opacity: 1; position: absolute; top: 34px; left: 0"
                >
                  <span
                    class="af-select-item"
                    @click="setActiveSpecifier(item)"
                    v-for="(item, i) in getSpecifiers"
                    :key="i"
                    >{{ item.value }}</span
                  >
                </div>
                <Odds
                  @click="addToBetslip(eventData, odd)"
                  v-for="(odd, index) in outcomes"
                  :key="index"
                  :odds="odd"
                  :selectionClass="
                    isSelected(
                      createID(
                        eventData.gameID,
                        eventData.matchID,
                        odd.outcomeName,
                        odd.oddID,
                        eventData.name
                      ),
                      couponStore.coupon
                    )
                      ? 'm-outcome--checked'
                      : ''
                  "
                ></Odds>
              </template>
              <template v-else>
                <div
                  v-if="activeMarket.specifier !== ''"
                  class="m-outcome--disabled m-outcome m-event-outcome-default m-icon-lock"
                >
                  <span data-op="prematch-lock" class="m-icon-lock"></span>
                </div>
                <EmptyOdds v-for="(odd, index) in activeMarket.outcomes" :key="index"></EmptyOdds>
              </template>
            </template>
            <EmptyOdds v-else></EmptyOdds>
          </div>
        </div>
      </div>
      <div class="m-event-footer">
        <div class="m-market-size">+{{ eventData.activeMarkets }}</div>
      </div>
    </div>
  </div>
  <!---->
</template>
<script setup>
import { defineComponent, computed, watch, ref } from 'vue'
import { createID, isSelected, sortArr, slugify } from '@/helpers'
import Odds from '@/components/Prematch/Odds.vue'
import EmptyOdds from '@/components/EmptyOdds.vue'
import { useCouponStore } from '../../stores'

const couponStore = useCouponStore()

const props = defineProps({
  eventData: Object,
  activeMarket: Object
})

const activeSpecifier = ref()
const specifierOpen = ref(false)

const outcomes = ref([])

const getSpecifiers = computed(() => {
  if (props.activeMarket && props.activeMarket.specifier && props.activeMarket.specifier !== '') {
    const result = []

    const outcomes = props.eventData.outcomes
    if (outcomes.length > 0) {
      const filtered = outcomes.filter(
        (item) => item.marketID === parseInt(props.activeMarket.marketID)
      )

      filtered.forEach((outcome) => {
        let specifier = outcome.specifier
        let found = result.find((item) => item.specifier === specifier)
        if (!found)
          // check if specifier has been listed
          result.push({ specifier, value: specifier.split('=')[1] }) //push value to array
      })
    }
    return result.sort((a, b) => a.value - b.value)
  } else {
    return []
  }
})

const setActiveSpecifier = (spec) => {
  if (props.eventData.outcomes) {
    const odds = props.eventData.outcomes
    let filtered = odds.filter((item) => item.marketID === parseInt(props.activeMarket.marketID))
    filtered = filtered.filter((item) => item.specifier === spec.specifier)
    outcomes.value = filtered
    activeSpecifier.value = spec.value
    toggleList()
  }
}
const toggleList = () => {
  specifierOpen.value = !specifierOpen.value
}

function showFixtureAnalysis(id) {
  return window.open(
    `https://s5.sir.sportradar.com/betradar/en/match/${id}`,
    'stats',
    'width=1078,height=768'
  )
}

const getOdds = () => {
  // Find and return the odds based on marketID and outcomeID
  if (props.activeMarket && props.eventData.activeMarkets > 0) {
    if (props.eventData.outcomes) {
      const odds = props.eventData.outcomes
      let filtered = odds.filter((item) => item.marketID === parseInt(props.activeMarket.marketID))
      if (props.activeMarket.specifier && props.activeMarket.specifier !== '') {
        let defaultSpecifier = filtered[0]?.specifier
        if (defaultSpecifier) {
          filtered = filtered.filter((item) => item.specifier === defaultSpecifier)
          activeSpecifier.value = defaultSpecifier.split('=')[1]
        }
      }
      if (filtered.length) {
        // console.log(_.sortBy(filtered, 'outcomeID'))
        outcomes.value = sortArr(filtered, 'outcomeID')
      } else {
        outcomes.value = []
      }
    }
  }
}

watch(
  () => props.activeMarket,
  () => {
    getOdds()
  },
  { immediate: true }
)

function addToBetslip(event, odd) {
  const id = createID(event.gameID, event.matchID, odd.outcomeName, odd.oddID, event.name)
  const data = {
    fixture: event,
    market_name: props.activeMarket.marketName,
    market_id: odd.marketID,
    ele_id: id,
    outcome: odd,
    odds: odd.odds,
    odd_id: odd.oddID,
    odd_name: odd.outcomeName,
    type: 'prematch',
    event_id: event.gameID,
    specifier: odd.specifier
  }

  // return couponStore.addToCoupon(data)

  const existsInBetslip = isSelected(id, couponStore.coupon)
  return existsInBetslip ? couponStore.removeSelection(id) : couponStore.addToCoupon(data)
}

defineComponent({
  name: 'PrematchFixture',
  components: { Odds, EmptyOdds }
})
</script>
<style scoped>
.m-event-sport {
  border-top: 1px solid #eaecef;
  border-color: #eaecef;
  border-color: var(--brand-border-type1);
  display: block;
  padding: 0.66666667rem 0;
}
.m-event-sport:hover,
.m-event-sport:active,
.m-event-sport:visited {
  text-decoration: none;
}
.m-event-sport .m-event-meta {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  color: #9ca0ab;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 0.83333333rem;
  -webkit-box-pack: space-between;
  -webkit-justify-content: space-between;
  -ms-flex-pack: space-between;
  justify-content: space-between;
  line-height: 1.25rem;
}
.m-event-sport .m-event-meta > span {
  margin-right: 0.83333333rem;
}
.m-event-sport .m-event-meta > span:last-child {
  margin-right: 0;
}
.m-event-sport .m-event-meta .m-event-icon {
  display: inline-block;
  -webkit-box-flex: 0;
  -webkit-flex: 0;
  -ms-flex: 0;
  flex: 0;
  margin: 0 0.33333333rem 0 -0.83333333rem;
}
.m-event-sport .m-event-meta .m-event-icon svg,
.m-event-sport .m-event-meta .m-event-icon img {
  height: 1.066rem;
  vertical-align: top;
}
.m-event-sport .m-event-meta .m-time {
  color: #353a45;
  color: var(--c-event-sport-time-text);
  -webkit-box-flex: 0;
  -webkit-flex: 0;
  -ms-flex: 0;
  flex: 0;
  white-space: nowrap;
}
.m-event-sport .m-event-meta .m-game-id {
  -webkit-box-flex: 0;
  -webkit-flex: 0;
  -ms-flex: 0;
  flex: 0;
  white-space: nowrap;
}
.m-event-sport .m-event-meta .m-league-name {
  display: inline-block;
  vertical-align: top;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-event-sport .m-event-meta .event-labels {
  margin: 0 0.91666667rem 0 -0.83333333rem;
}
.m-event-sport .m-sports-table {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  margin-top: 0.66666667rem;
}
.m-event-sport .m-market-cell {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  width: 55%;
}
.m-event-sport .m-market-cell .m-market .m-outcome {
  background: #d6ebdc;
  background: var(--brand-prematch-odds-bg);
  color: var(--brand-prematch-odds-text);
}
.m-event-sport .m-market-cell .m-market .m-outcome--checked {
  background-color: var(--brand-secondary);
  color: #ffffff;
}
.m-event-sport .m-market-cell .m-market .m-outcome--checked:before {
  color: #ffffff !important;
  color: var(--brand-tertiary) !important;
}
.m-event-sport .m-market-cell .m-market .m-outcome--disabled {
  background-color: #dcdee5;
  background-color: var(--c-prematch-outcome-disabled-bg);
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
}
.m-event-sport .m-market-cell .m-market .m-outcome--up:before,
.m-event-sport .m-market-cell .m-market .m-outcome--down:before {
  color: #096b27;
  color: var(--brand-text-secondary);
}
.m-event-sport .m-info-cell > div {
  line-height: 1.4;
}
.m-event-sport .m-info-cell .team {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #353a45;
  color: var(--c-event-sport-team-text);
  padding-right: 0.83333333rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-event-sport .m-event-footer {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  margin-top: 0.41666667rem;
}
.m-event-sport .m-event-footer .m-event-comment {
  color: #9ca0ab;
  font-size: 0.83333333rem;
}
.m-event-sport .m-market-size {
  color: #9ca0ab;
  font-size: 0.83333333rem;
  width: 45%;
}
.m-event-sport .m-market-size .media-icon {
  margin-left: 0.25rem;
}
.m-event-sport .m-market-size .media-icon + .media-icon {
  margin-left: 0.41666667rem;
}
.m-event-sport .m-market-size .sfm-icon {
  -webkit-transform: translateY(-1px);
  -ms-transform: translateY(-1px);
  transform: translateY(-1px);
}

.m-tab-active {
  background-color: var(--brand-secondary);
  color: #ffffff !important;
}

.grid-specifier-select {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.grid-specifier-select .grid-specifier-select-icon {
  margin-left: auto;
  padding-right: 0.16666667rem;
}
.grid-specifier-select .grid-specifier-select-label {
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
}
.grid-specifier-select .grid-specifier-wrapper {
  position: fixed;
  z-index: 999;
}

.grid-specifier-select {
  width: 100%;
}
.grid-specifier-select .grid-specifier-select-icon::before {
  content: '\e603';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.grid-specifier-select .grid-specifier-select-icon:before {
  display: inline-block;
  font-size: 1.066rem;
}
.grid-specifier-select .grid-specifier-select-icon .icon {
  display: none;
  font-size: 0px;
}
.grid-specifier-select .grid-specifier-select-icon.is-open::before {
  content: '\e6a5';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.af-select-list {
  border: 1px solid #d7d7d7;
  margin-top: -1px;
  overflow-y: auto;
  position: absolute;
  z-index: 888;
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
}
.af-select-list.live {
  background-color: #353a45;
  background-color: var(--background-type2-secondary);
}
.af-select-list.prematch {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
}
.af-select {
  outline: none;
  position: relative;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
.af-select.af-select-open .af-select-title {
  border-color: #0d9737;
  border-color: var(--brand-text-secondary);
}
.af-select.disable {
  background-color: #dcdee5;
  background-color: var(--disable-brand-secondary);
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
}
.af-select .af-select-title {
  border: 1px solid #eaecef;
  display: inline-table;
  height: 24px;
  line-height: 24px;
  width: 100%;
  border-color: #eaecef;
  border-color: var(--brand-border-type1);
}
.af-select .af-select-title .af-select-input {
  display: table-cell;
  height: 100%;
  outline: none;
  vertical-align: top;
  width: 100%;
}
.af-select .af-select-title .af-select-input.input {
  border: 0px;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
}
.af-select .af-select-title .af-select-input .placeholder {
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
}
.af-select .af-select-title .af-select-icon-item {
  display: table-cell;
}
.af-select .af-select-title .af-select-icon-item .icon {
  display: block;
  height: 100%;
  text-align: center;
  width: 24px;
}
.m-sports-table .m-date-row {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  height: 2rem;
  line-height: 2rem;
  padding: 0 0.83333333rem;
  z-index: 25 !important;
}
.m-sports-table .m-date-row .m-date {
  color: #353a45;
  color: var(--text-type1-primary);
  font-size: 1rem;
}
.m-sports-table .m-date-row .market-title {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 0;
  -webkit-flex: 0 1 auto;
  -ms-flex: 0 1 auto;
  flex: 0 1 auto;
  width: 55%;
}
.m-sports-table .m-date-row .market-title > div {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  font-size: 0.83333333rem;
  text-align: center;
}
.m-sports-table .m-date-row .market-title .specifier-cell {
  min-width: 0;
  overflow: hidden;
}
.m-sports-table .m-sports-row {
  margin: 0 0.83333333rem;
}
.m-sports-table .m-inner-ads {
  display: block;
  margin: 0.83333333rem;
}
.m-sports-table .m-inner-ads img {
  display: block;
  width: 100%;
}
.m-event-specifiers-order {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  border: 0 !important;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  max-height: 12.5rem;
  overflow-y: auto;
  padding: 0.83333333rem 0.5rem;
}
.m-event-specifiers-order > span {
  display: block;
  line-height: 2.33333333rem;
}
.m-event-specifiers-order .af-select-item {
  color: #353a45;
  color: var(--text-type1-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  font-weight: inherit;
  font-size: inherit;
  /* font-size: 0.83333333rem; */
}
.m-event-specifiers-order .af-select-item.active {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  color: #0d9737;
}

.af-select-item {
  display: inline-block;
  text-align: center;
  width: 100%;
}
.af-select-item.active {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: #0d9737;
  color: var(--brand-quaternary);
}
.af-select-item.hover {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
}
</style>
