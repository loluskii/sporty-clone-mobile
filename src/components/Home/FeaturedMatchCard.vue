<template>
  <div
    v-if="matchDetails.outcomes && matchDetails.outcomes.length"
    :id="'featuredMatchCard_' + matchDetails.tournamentID"
    class="featuredMatchCard"
  >
    <div class="top">
      <a
        class="tournamentLink"
        href="#"
        @click.prevent="
          $router.push({
            name: 'fixtures-by-tournaments',
            params: {
              sport: matchDetails.sportName,
              categories: matchDetails.categoryID,
              tournaments: matchDetails.tournamentID
            }
          })
        "
        >{{ matchDetails.categoryName }} - {{ matchDetails.tournament }}</a
      >
    </div>
    <div class="mid" @click="goToMarket($event)">
      <div class="homeIcon">
        <img
          :src="getTeamLogoUrl(matchDetails.homeTeam)"
          @error="setTeamLogoFallback($event, 'home')"
        />
      </div>
      <div class="homeName">{{ matchDetails.homeTeam }}</div>
      <div class="dateTime">
        <div class="time">{{moment(matchDetails.date).format('ha') }}</div>
        <div class="date">{{ moment(matchDetails.date).format('ddd D') }}</div>
      </div>
      <div class="market">
        <span>{{ selectedMarket?.marketName }}</span>
      </div>
      <div class="awayIcon">
        <img
          :src="getTeamLogoUrl(matchDetails.awayTeam)"
          @error="setTeamLogoFallback($event, 'away')"
        />
      </div>
      <div class="awayName">{{ matchDetails.awayTeam }}</div>
    </div>
    <div class="bottom">
      <div class="featuredMatchOutcome outcomes">
        <div
          v-for="(market, m) in getMatchOdds"
          :key="m"
          class="m-outcome m-event-outcome-default"
          @click="addToBetslip(matchDetails, market)"
          :class="
            isSelected(
              getSelectionElementId(matchDetails, market),
              couponStore.coupon
            )
              ? 'm-outcome--checked'
              : ''
          "
        >
          <div class="desc">
            <!-- <span>{{ market.displayName }}</span> -->
          </div>
          <div class="odds">{{ parseFloat(market.odds).toFixed(2) }}</div>
        </div>
      </div>
      <!-- {{ getMatchOdds(matchDetails.outcomes) }} -->
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed, watch } from 'vue'
import {
  buildCouponSelectionElementId,
  buildCouponSelectionPayload,
  formatDate,
  slugify,
  isSelected,
  getTeamLogoUrl,
  setTeamLogoFallback
} from '@/helpers'
import { useCouponStore } from '@/stores'
import { useRouter } from 'vue-router'
import { SIM_ALLOWED_MARKETS } from '@/helpers'
import emitter from '@/plugins/emitter'
import moment from 'moment'

const router = useRouter()
const couponStore = useCouponStore()

const props = defineProps({
  matchDetails: Object,
  markets: Object
})

const selectedMarket = computed(() => {
  const markets = Array.isArray(props.markets) ? props.markets : []
  return (
    markets.find((market) => Number(market.marketID) === 1) ||
    markets.find((market) => Number(market.marketID) === 1601) ||
    markets[0] ||
    {}
  )
})

const getMatchOdds = computed(() => {
  const uniqueOutcomes = (props.matchDetails?.outcomes || [])
    .filter((x) => Number(x.marketID) === Number(selectedMarket.value.marketID))
    .filter(
      (outcome, index, self) =>
        index ===
        self.findIndex(
          (item) =>
            String(item.outcomeID) === String(outcome.outcomeID) &&
            String(item.specifier || '') === String(outcome.specifier || '')
        )
    )

  // Get the latest odds from the coupon store if available
  const matchSelections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(props.matchDetails.matchID)
  )

  if (matchSelections.length > 0) {
    // If we have selections in the betslip, use their updated odds
    return uniqueOutcomes.map((outcome) => {
      const selection = matchSelections.find(
        (sel) =>
          String(sel.outcomeId) === String(outcome.outcomeID) &&
          String(sel.specifier || sel.selectionKeySpecifier || '') === String(outcome.specifier || '')
      )
      return selection
        ? {
            ...outcome,
            odds: selection.odds,
            active: !selection.suspended && !selection.unavailable
          }
        : outcome
    })
  }

  // Otherwise use the original unique odds
  return uniqueOutcomes
})

function goToMarket() {
  return router.push({
    name: 'fixtures-detail',
    params: {
      sport: slugify(props.matchDetails.sportName),
      tournament_name: slugify(props.matchDetails.tournament),
      event_name: slugify(props.matchDetails.name),
      event_id: (props.matchDetails.matchID)
    }
  })
}

const getSelectionElementId = (fixture, outcome) =>
  buildCouponSelectionElementId({
    fixture,
    outcome,
    marketName: '1X2'
  })

function addToBetslip(event, odd) {
  if (odd.odds <= 1) return
  let marketId = parseInt(odd.marketID)
  if (couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)) {
    emitter.emit(
      'showErrorMessage',
      'This market is not supported in simulation mode. Exit Simulation mode to add to betslip'
    )
    return
  }
  const fixtureWithMarkets = {
    ...event,
    sportID: event.sportID || event.sportId,
    sportId: event.sportId || event.sportID,
    market: Array.isArray(props.markets) ? props.markets : event.market,
    markets: Array.isArray(props.markets) ? props.markets : event.markets
  }
  const data = buildCouponSelectionPayload({
    fixture: fixtureWithMarkets,
    market: selectedMarket.value,
    outcome: odd,
    marketName: selectedMarket.value?.marketName || '1X2',
    type: 'prematch'
  })

  return couponStore.toggleCouponSelection(data)
}
</script>

<style scoped>
.featuredMatchCard {
  background-color: #ffffff;
  -webkit-box-shadow:
    0px 2px 4px 2px rgba(0, 0, 0, 0.1),
    2px 2px 4px 0px rgba(0, 0, 0, 0.1);
  box-shadow:
    0px 2px 4px 2px rgba(0, 0, 0, 0.1),
    2px 2px 4px 0px rgba(0, 0, 0, 0.1);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  height: calc(var(--mobile-app-width, 100vw) * 0.35);
  min-height: 136px;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  width: 88%;
  border-radius: 8px;
}
.featuredMatchCard .top {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  height: 1.5rem;
  margin-bottom: 0.33333333rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}
.featuredMatchCard .top .label {
  margin-left: 0.5rem;
  width: 18px;
}
.featuredMatchCard .top .tournamentLink {
  color: #000;
  margin-left: 0.5rem;
  overflow: hidden;
  padding-right: 0.08333333rem;
  text-overflow: ellipsis;
}
.featuredMatchCard .mid {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: grid;
  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 25% 1fr auto;
  height: 100%;
  justify-items: center;
  overflow: hidden;
  padding: 0 0.5rem;
}
.featuredMatchCard .mid:not(.live) {
  grid-template-areas: 'HomeIcon DateTime AwayIcon' 'HomeIcon DateTime AwayIcon' 'HomeName Market AwayName';
}
.featuredMatchCard .mid:not(.live).noIcon {
  grid-template-areas: 'HomeName DateTime AwayName' 'HomeName DateTime AwayName' 'HomeName Market AwayName';
  grid-template-rows: 25% 25% 1fr;
}
.featuredMatchCard .mid.live {
  grid-template-areas: 'HomeIcon Score AwayIcon' 'HomeIcon PlaySeconds AwayIcon' 'HomeName Market AwayName';
}
.featuredMatchCard .mid.live.noIcon {
  grid-template-areas: 'HomeName Score AwayName' 'HomeName PlaySeconds AwayName' 'HomeName Market AwayName';
  grid-template-rows: 25% 25% 1fr;
}
.featuredMatchCard .mid .homeName,
.featuredMatchCard .mid .awayName {
  -webkit-box-orient: vertical;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  display: -webkit-box;
  font-size: 0.91666667rem;
  -webkit-line-clamp: 2;
  line-height: 1.2;
  overflow: hidden;
  padding-top: 0.2rem;
  text-align: center;
  text-overflow: ellipsis;
  word-wrap: break-word;
}
.featuredMatchCard .mid .homeName {
  grid-area: HomeName;
}
.featuredMatchCard .mid .awayName {
  grid-area: AwayName;
}
.featuredMatchCard .mid .homeIcon,
.featuredMatchCard .mid .awayIcon {
  height: 100%;
  max-height: 15vw;
  max-width: 100px;
  text-align: center;
}
.featuredMatchCard .mid .homeIcon img,
.featuredMatchCard .mid .awayIcon img {
  height: 100%;
  -o-object-fit: contain;
  object-fit: contain;
  -webkit-user-drag: none;
  width: 100%;
}
.featuredMatchCard .mid .homeIcon {
  grid-area: HomeIcon;
}
.featuredMatchCard .mid .awayIcon {
  grid-area: AwayIcon;
}
.featuredMatchCard .mid .dateTime {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  color: #1b1e25;
  color: var(--text-type1-tertiary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  grid-area: DateTime;
}
.featuredMatchCard .mid .dateTime .time {
  font-weight: 700;
}
.featuredMatchCard .mid .dateTime .date::before {
  color: #dfe0e6;
  content: '|';
  margin: 0 0.3rem;
}
.featuredMatchCard .mid .market {
  color: var(--brand-highlight-text);
  font-size: 1rem;
  font-weight: 700;
  grid-area: Market;
  line-height: 1;
  position: relative;
  text-align: center;
}
.featuredMatchCard .mid .market .specifier {
  margin-left: 0.5rem;
}
.featuredMatchCard .mid .market .subMarketName {
  color: #5b5b5b;
  font-size: 0.83333333rem;
  font-weight: 300;
}
.featuredMatchCard .mid .market .featured-match-popover {
  -webkit-box-shadow: -1px 2px 6px -1px rgba(0, 0, 0, 0.5);
  box-shadow: -1px 2px 6px -1px rgba(0, 0, 0, 0.5);
  color: #50545f;
  font-size: 1rem;
  padding: 0.33333333rem;
  white-space: nowrap;
}
.featuredMatchCard .mid .market .info-icon {
  color: #9ca0ab;
  margin-left: 0.4rem;
  vertical-align: inherit;
}
.featuredMatchCard .mid .score {
  color: #1b1e25;
  color: var(--text-type1-tertiary);
  font-size: 1.066rem;
  font-weight: bold;
  grid-area: Score;
}
.featuredMatchCard .mid .playSeconds {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 0.83333333rem;
  grid-area: PlaySeconds;
  margin-bottom: 0.33333333rem;
  -webkit-transform: scale(0.8);
  -ms-transform: scale(0.8);
  transform: scale(0.8);
  -webkit-transform-origin: 50% 100%;
  -ms-transform-origin: 50% 100%;
  transform-origin: 50% 100%;
}
.featuredMatchCard .mid .playSeconds .liveFlag {
  background: #32ce62;
  background: var(--brand-type3-secondary);
  border: 0.5px solid;
  border-color: #32ce62;
  border-color: var(--brand-type3-secondary);
  color: #353a45;
  padding: 0 0.08333333rem 0 0.16666667rem;
  white-space: nowrap;
}
.featuredMatchCard .mid .playSeconds .border {
  border-bottom: 0.5px solid rgba(156, 160, 171, 0.3);
  border-right: 0.5px solid rgba(156, 160, 171, 0.3);
  border-top: 0.5px solid rgba(156, 160, 171, 0.3);
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 0.83333333rem;
  padding-right: 0.08333333rem;
  white-space: nowrap;
}
.featuredMatchCard .mid .playSeconds .border .eventTime {
  margin-left: 0.16666667rem;
}
.featuredMatchCard .mid .playSeconds .border .matchStatus {
  margin-left: 0.33333333rem;
}
.featuredMatchCard .bottom {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
}
/* .featuredMatchCard.encore[data-outcomeCount='2'] .mid,
.featuredMatchCard.encore[data-outcomeCount='2'] .bottom {
  padding: 0 1rem;
} */

.m-icon-lock {
  vertical-align: middle;
  width: 100%;
}
.m-icon-lock::before {
  content: '\e647';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-icon-lock:before {
  font-size: 1.33333333rem;
}
.outcomes {
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
  margin: 0.66666667rem 0.16666667rem 0.33333333rem 0.16666667rem;
}
.outcomes .m-outcome {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: var(--brand-prematch-odds-bg);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: var(--brand-prematch-odds-text);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 2.5rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: center;
  margin: 0 0.16666667rem;
  padding: 0 1.33333333rem;
}
.outcomes .m-outcome .desc {
  color: #096b27;
  color: var(--c-featured-match-card-outcome-desc-text);
  font-size: 1.066rem;
  font-weight: normal;
  line-height: 1;
}
.outcomes .m-outcome .odds {
  font-size: 1.066rem;
  font-weight: bold;
  line-height: 1;
}
.outcomes .m-outcome--checked {
  background: var(--brand-highlight-text);
  background-color: var(--brand-active-prematch-odds-bg);
  color: #ffffff;
}
.outcomes .m-outcome--checked .desc {
  color: #ffffff;
  color: var(--brand-tertiary);
}
.outcomes .m-outcome--checked:before {
  color: #ffffff !important;
  color: var(--brand-tertiary) !important;
}
.outcomes .m-outcome--disabled {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  color: #9da0a9;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
}
.outcomes .m-outcome--up:before,
.outcomes .m-outcome--down:before {
  color: #096b27;
  color: var(--brand-secondary);
  font-weight: lighter;
  -webkit-transform-origin: 100% 0%;
  -ms-transform-origin: 100% 0%;
  transform-origin: 100% 0%;
}
@media only screen and (max-width: 320px) {
  .outcomes .m-outcome--up:before,
  .outcomes .m-outcome--down:before {
    -webkit-transform: scale(0.73);
    -ms-transform: scale(0.73);
    transform: scale(0.73);
  }
}
</style>
