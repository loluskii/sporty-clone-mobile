<template>
  <div style="position: relative">
    <div class="m-bet-content">
      <div v-if="Object.keys(fixtures).length" class="market-wrapper">
        <div class="m-today-tab m-tabs m-tabs-mini m-tabs-no-animation" style="overflow: hidden">
          <div class="m-tabs-nav" style="width:">
            <!-- <div class="m-tabs-ink-bar" style="display: block; width: 51.0469px; left: 0px"></div> -->
            <div
              v-for="(market, m) in marketsGroup"
              :key="m"
              class="m-tabs-tab"
              :class="market.marketID === activeMarket.marketID ? 'm-tab-active' : ''"
              @click="selectMarket(market)"
            >
              {{ market.marketName }}
            </div>
          </div>
        </div>
      </div>
      <template v-if="Object.keys(fixtures).length">
        <div
          v-for="(group, index) in fixtures"
          :key="index"
          class="x-table m-sports-table football"
        >
          <div class="x-table-row m-date-row">
            <div class="x-table-cell m-date">
              {{ formatDate(index, 'DD/MM dddd') }}
            </div>
            <div class="x-table-cell market-title">
              <div
                v-if="activeMarket.specifier !== ''"
                style="text-transform: capitalize"
                class="each-module is-multiline"
              >
                {{ activeMarket.specifier }}
              </div>
              <template
                v-for="(market, m) in _.sortBy(activeMarket.outcomes, 'outcomeID')"
                :key="m"
              >
                <div>
                  <span>{{ market.outcomeName }}</span>
                </div>
              </template>
            </div>
          </div>
          <PrematchFixture
            v-for="(event, index) in group"
            :key="index"
            :eventData="event"
            :activeMarket="activeMarket"
          ></PrematchFixture>
        </div>
      </template>
      <div v-else class="no-data">
        <div style="white-space: pre-line">
          Sorry, there are no games currently<br />available in this category. Please try later.<br />Thank
          you.
        </div>
      </div>
      <div class="view-all">
        <a href="#" @click.prevent="viewMore" class="">View More</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { formatDate } from '@/helpers'
import PrematchFixture from '@/components/Prematch/PrematchFixture.vue'
import _ from 'lodash'
import { useRouter } from 'vue-router'
import { useUtilsStore } from '@/stores'
import { slugify } from '@/helpers'
import emitter from '@/plugins/emitter'

const props = defineProps({
  highlightsData: Object,
  marketsGroup: Object,
  activeMarket: Object
})
defineComponent({
  name: 'highlights-games'
})

const emits = defineEmits(['select-market'])
const router = useRouter()
const utilsStore = useUtilsStore()
const fixtures = ref(props.highlightsData || {})

const getSportbyId = computed(() => {
  return utilsStore.sportsMenu.find((sport) => sport.sportID == props.activeMarket.sportID)
})

function viewMore() {
  return router.push({
    name: 'fixtures-by-sports',
    params: { sport: slugify(getSportbyId.value.sportName) }
  })
}

const selectMarket = (market) => {
  emits('select-market', market)
}

const removeFixtureByMatchId = (matchId) => {
  const current = fixtures.value || {}
  const next = {}
  Object.entries(current).forEach(([key, list]) => {
    const filtered = (list || []).filter(
      (fixture) =>
        String(fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id) !==
        String(matchId)
    )
    if (filtered.length) {
      next[key] = filtered
    }
  })
  fixtures.value = next
}

const applyValidatedSelections = (selections) => {
  console.log('[odds-validated][Highlights] incoming', selections)
  if (!Array.isArray(selections) || selections.length === 0) return
  const selectionsByMatch = selections.reduce((acc, selection) => {
    const key = String(selection.match_id ?? selection.matchID ?? selection.matchId ?? '')
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(selection)
    return acc
  }, {})
  console.log('[odds-validated][Highlights] matches', Object.keys(selectionsByMatch).length)

  const next = {}
  Object.entries(fixtures.value || {}).forEach(([key, list]) => {
    next[key] = (list || []).map((fixture) => {
      const fixtureMatchId = String(
        fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id ?? ''
      )
      const matchSelections = selectionsByMatch[fixtureMatchId]
      if (!matchSelections) {
        return fixture
      }
      if (!Array.isArray(fixture.outcomes)) {
        console.log('[odds-validated][Highlights] no outcomes for match', fixtureMatchId)
        return fixture
      }
      if (!matchSelections || !Array.isArray(fixture.outcomes)) {
        return fixture
      }
      const nextOutcomes = fixture.outcomes.map((outcome) => {
        const match = matchSelections.find((sel) => {
          const specifier = String(outcome.specifier || '')
          const selSpecifier = String(sel.specifier || '')
          return (
            String(outcome.marketID) === String(sel.market_id) &&
            String(outcome.outcomeID) === String(sel.outcome_id) &&
            specifier === selSpecifier
          )
        })
        if (!match) {
          return outcome
        }
        console.log('[odds-validated][Highlights] update', {
          matchId: fixtureMatchId,
          marketId: outcome.marketID,
          outcomeId: outcome.outcomeID,
          specifier: outcome.specifier || '',
          from: outcome.odds,
          to: match.odds,
          status: match.status_name
        })
        if (!match) return outcome
        const statusName = String(match.status_name || '').toLowerCase()
        const active =
          statusName === 'suspended' || statusName === 'deactivated'
            ? 0
            : match.active ?? outcome.active
        return {
          ...outcome,
          odds: match.odds ?? outcome.odds,
          active
        }
      })
      return { ...fixture, outcomes: nextOutcomes }
    })
  })
  fixtures.value = next
}

watch(
  () => props.highlightsData,
  (nextValue) => {
    fixtures.value = nextValue || {}
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  emitter.on('remove-fixture', removeFixtureByMatchId)
  emitter.on('odds-validated', applyValidatedSelections)
})

onBeforeUnmount(() => {
  emitter.off('remove-fixture', removeFixtureByMatchId)
  emitter.off('odds-validated', applyValidatedSelections)
})

// const activeMarketId = ref(props.marketsGroup.markets[0].id)
</script>

<style scoped>
.home .m-sports .m-today-tab .m-tabs-tab {
  color: #353a45;
  color: var(--c-sports-prematch-market-title-text);
  -webkit-box-flex: initial;
  -webkit-flex: initial;
  -ms-flex: initial;
  flex: initial;
  font-size: 1.066rem;
  margin: 0;
  padding: 0.33333333rem 0.91666667rem;
  text-transform: capitalize;
  /* width: calc(100); */
}

.m-sports .market-wrapper {
  padding: 10px 0px !important;
}

.m-sports .nav-fixed .market-wrapper {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  position: fixed;
  top: 7.75rem;
  -webkit-transition: top 0.3s ease !important;
  transition: top 0.3s ease !important;
  width: 100%;
  z-index: 100;
}

.m-tabs-tab {
  /* border: 1px solid var(--c-sports-prematch-market-title-text); */
  line-height: 2rem !important;
  margin-right: 10px !important;
  /* border-radius: 30px; */
}

.m-tabs-tab:last-child {
  margin-right: 0px !important;
}
.m-tab-active {
  border-bottom: 3px solid var(--c-prematch-tab-name-active);
}

.m-tabs-tab {
  width: auto !important;
}
</style>
