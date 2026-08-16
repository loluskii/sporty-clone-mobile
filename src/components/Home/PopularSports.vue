<template>
  <div class="m-popular featuredMatch">
    <div class="tournaments">
      <template v-for="(match, index) in featuredTournaments" :key="index">
        <div
          class="topTournamentCard"
          @click.prevent="
            $router.push({
              name: 'fixtures-by-tournaments',
              params: {
                sport: getSportName(match.sport_id || match.sportID || match.sportId),
                categories: `sr:category:${match.categoryID}`,
                tournaments: `sr:tournament:${match.tournament_id}`
              }
            })
          "
        >
          <!-- <div class="image">
            <img
              :src="match.tournament.image_path"
              style="height: 24px; margin-right: 15px"
              alt=""
              srcset=""
            />
          </div> -->
          <div class="text">{{ match.tournament_name }}</div>
        </div>
      </template>
    </div>

    <div class="featured-match-placeholder">
      <div class="featured-widget with-nav" style="">
        <div role="tablist" aria-label="featured widgets tabs" class="featured-nav-list">
          <div class="featured-header-left">
            <span role="heading" aria-label="featured widgets title" class="featured-title"
              >Featured Matches</span
            >
            
          </div>
        </div>
        <div v-show="activeFeaturedTab == 'featuredMatches'" class="featuredMatch">
          <template v-if="!isLoading || featuredTournaments.length > 0">
            <div class="featuredMatchCategoryBox">
              <div
                ref="featuredTournamentNav"
                class="m-snap-nav-wrap featuredMatchCategoryNav m-popular-list"
                style="overflow: hidden"
              >
                <ul class="m-snap-nav flex" style="width: 100%">
                  <li
                    v-for="(top, index) in featuredTournaments"
                    :key="index"
                    class="m-popular-item featuredMatchCategoryNavItem m-snap-nav-item"
                    @click="setActiveTournament(top)"
                  >
                    <div
                      class="featuredMatchCategory"
                      :class="activeFeaturedTournament == top.tournament_id ? 'active' : ''"
                    >
                      <div class="wrapper">
                        <div class="img">
                          <img :src="getImageURL(top.tournament_name)" />
                        </div>
                        <div class="name">{{ top.tournament_name }}</div>
                      </div>
                    </div>
                  </li>
                </ul>
                <i class="controls left-controls"></i>
                <i class="controls right-controls"></i>
              </div>
            </div>
            <div
              ref="featuredMatchScroller"
              class="HorizonSwipe"
              id="featuredMatchCardBox"
              style="overflow: auto"
              @scroll.passive="handleFeaturedScroll"
            >
              <template v-for="tournament in sortedTournamentGames">
                <FeaturedMatchCard
                  v-for="(game, g) in tournament.fixtures"
                  ref="gamesList"
                  :key="`${tournament.tournamentID}-${game.matchID || game.matchId || game.id || g}`"
                  :data-featured-tournament-id="tournament.tournamentID"
                  :matchDetails="game"
                  :markets="tournament.markets"
                ></FeaturedMatchCard>
              </template>
            </div>
          </template>
          <LoadingSpinner v-else></LoadingSpinner>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import FeaturedMatchCard from './FeaturedMatchCard.vue'
import Codes from './Codes.vue'
import { ref, onMounted, computed, onBeforeUnmount, onActivated, onDeactivated, watch, nextTick } from 'vue'
import {
  getTopGameCategories,
  gamesByTopCategory,
  FEED_TOGGLE,
  sportsList
} from '@/helpers'
import { useQuery } from 'vue-query'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import FeaturedGamesContainer from './FeaturedGamesContainer.vue'
import { useMqttService } from '@/composables/useMqtt'
import { useUtilsStore } from '@/stores/utils.store'

const { subscribe } = useMqttService()
const unsubscribeFunctions = ref({}) // Store unsubscribe functions by match ID
const componentId = `popular-sports-${Date.now()}` // Unique ID for this component instance
const shouldRefresh = ref(false)

const utilsStore = useUtilsStore()
const featuredTournaments = computed(() => utilsStore.featuredTournaments)
const featuredTournamentGames = computed(() => utilsStore.featuredTournamentGames)
const isLoading = computed(() => utilsStore.featuredIsLoading)
const activeFeaturedTournament = computed(() => utilsStore.activeFeaturedTournament)

const activeFeaturedTab = ref('featuredMatches')

const activeCasinoCategory = ref(null)
const featuredCasinogames = ref([])
const featuredCasino = ref([])
const codes = ref([])
const featuredMatchScroller = ref(null)
const featuredTournamentNav = ref(null)
const isProgrammaticFeaturedScroll = ref(false)
let featuredScrollResetTimer = null

function getSportName(sportId) {
  return sportsList.find((sport) => Number(sport.sport_id) === Number(sportId))?.name || 'Soccer'
}

function setProgrammaticFeaturedScroll() {
  isProgrammaticFeaturedScroll.value = true
  window.clearTimeout(featuredScrollResetTimer)
  featuredScrollResetTimer = window.setTimeout(() => {
    isProgrammaticFeaturedScroll.value = false
  }, 700)
}

async function scrollGamesIntoView(tournamentId = activeFeaturedTournament.value) {
  await nextTick()
  const scroller = featuredMatchScroller.value
  if (!scroller || !tournamentId) return

  const target = Array.from(scroller.querySelectorAll('[data-featured-tournament-id]')).find(
    (element) => String(element.dataset.featuredTournamentId) === String(tournamentId)
  )

  if (!target) return

  setProgrammaticFeaturedScroll()
  target.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'start'
  })
}

function scrollActiveTournamentNavIntoView() {
  const activePill = featuredTournamentNav.value?.querySelector('.featuredMatchCategory.active')
  activePill?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

function getVisibleTournamentId() {
  const scroller = featuredMatchScroller.value
  if (!scroller) return null

  const scrollerRect = scroller.getBoundingClientRect()
  const scrollerCenter = scrollerRect.left + scrollerRect.width / 2
  let visibleTournamentId = null
  let closestDistance = Number.POSITIVE_INFINITY

  Array.from(scroller.querySelectorAll('[data-featured-tournament-id]')).forEach((element) => {
    const rect = element.getBoundingClientRect()
    const isVisible = rect.right > scrollerRect.left && rect.left < scrollerRect.right
    if (!isVisible) return

    const elementCenter = rect.left + rect.width / 2
    const distance = Math.abs(elementCenter - scrollerCenter)
    if (distance < closestDistance) {
      closestDistance = distance
      visibleTournamentId = element.dataset.featuredTournamentId
    }
  })

  return visibleTournamentId
}

function handleFeaturedScroll() {
  if (isProgrammaticFeaturedScroll.value) return

  const visibleTournamentId = getVisibleTournamentId()
  if (
    visibleTournamentId &&
    String(visibleTournamentId) !== String(activeFeaturedTournament.value)
  ) {
    utilsStore.setActiveFeaturedTournament(visibleTournamentId)
  }
}

function setActiveTab(tab) {
  activeFeaturedTab.value = tab
}

const sortedTournamentGames = computed(() => {
  return featuredTournamentGames.value.length
    ? [...featuredTournamentGames.value].sort(
        (a, b) =>
          Number(b.priority || 0) - Number(a.priority || 0) ||
          Number(a.tournamentID || 0) - Number(b.tournamentID || 0)
      )
    : []
})

function getImageURL(name) {
  if (name == 'Championship') {
    return new URL('../../assets/images/EFL_Championship_Logo.png', import.meta.url)
  } else if (name == 'Bundesliga') {
    return new URL('../../assets/images/Bundesliga.png', import.meta.url)
  } else {
    return `https://firebasestorage.googleapis.com/v0/b/sbe-dev-ecd57.firebasestorage.app/o/TOP%20LEAGUES%2F${encodeURIComponent(name)}.png?alt=media&token=07d0069e-25b0-463b-8433-e95a62e84098`
  }
}

const setActiveTournament = (tournament) => {
  utilsStore.setActiveFeaturedTournament(tournament.tournament_id)
  scrollGamesIntoView(tournament.tournament_id)
}

const setActiveCategory = async (category) => {
  if (!category?.id) {
    console.warn('Invalid category provided to setActiveCategory')
    return
  }

  activeCasinoCategory.value = category.id

  try {
    const games = await gamesByTopCategory(category.id)
    featuredCasinogames.value = games.data ? games.data.splice(0, 5) : []
  } catch (error) {
    console.error('Error fetching games for category:', error)
    featuredCasinogames.value = []
  }
}

async function getCasinoGames() {
  if (!FEED_TOGGLE) return
  const res = await getTopGameCategories()
  featuredCasino.value = res.data
  activeCasinoCategory.value = res.data[0].id
  const games = await gamesByTopCategory(activeCasinoCategory.value)
  featuredCasinogames.value = games.data ? games.data.splice(0, 5) : []
}

// function setupMqttSubscriptions(matchIds) {
//   // Only clear our own component's subscriptions
//   const subscriptionKey = `${componentId}-${matchIds.join(',')}`
//   if (unsubscribeFunctions.value[subscriptionKey]) {
//     unsubscribeFunctions.value[subscriptionKey].forEach((unsubscribe) => unsubscribe())
//   }

//   // Create subscriptions for each match ID
//   const subscriptions = matchIds.map((matchId) => {
//     // Subscribe to odds changes
//     const oddsChangeTopic = `feeds/prematch/odds_change/${matchId}`
//     const unsubscribeOddsChange = subscribe(oddsChangeTopic, (data) => {
//       utilsStore.handleOddsChange(data)
//     })

//     // Subscribe to bet stop
//     const betStopTopic = `feeds/prematch/bet_stop/${matchId}`
//     const unsubscribeBetStop = subscribe(betStopTopic, (data) => {
//       utilsStore.handleBetStop(data)
//     })

//     return [unsubscribeOddsChange, unsubscribeBetStop]
//   })

//   // Flatten the array of subscription pairs
//   unsubscribeFunctions.value[subscriptionKey] = subscriptions.flat()
// }

onBeforeUnmount(() => {
  window.clearTimeout(featuredScrollResetTimer)
  // Clean up all MQTT subscriptions
  // Object.values(unsubscribeFunctions.value).forEach((subscriptions) => {
  //   subscriptions.forEach((unsubscribe) => unsubscribe())
  // })
  // unsubscribeFunctions.value = {}
})

watch(activeFeaturedTournament, () => {
  nextTick(scrollActiveTournamentNavIntoView)
})

const loadFeaturedGames = async () => {
  await utilsStore.fetchFeaturedGames()
}

onMounted(loadFeaturedGames)

const { data: casinoData, isLoading: isCasinoLoading } = useQuery(
  'casinoGames',
  getTopGameCategories,
  {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 60000,
    cacheTime: 300000,
    enabled: false
  }
)

// Update computed properties
const casinoIsLoadingGames = computed(() => isCasinoLoading.value)

// Watch for casino data changes
watch(
  casinoData,
  (newData) => {
    if (newData?.data) {
      featuredCasino.value = newData.data
      if (newData.data.length > 0) {
        const firstCategory = newData.data[0]
        activeCasinoCategory.value = firstCategory.id
        setActiveCategory(firstCategory)
      }
    }
  },
  { immediate: true }
)

// Update onActivated
onActivated(async () => {
  await utilsStore.fetchFeaturedGames()
})

// Update onDeactivated
onDeactivated(() => {
  // Clean up MQTT subscriptions
  Object.values(unsubscribeFunctions.value).forEach((subscriptions) => {
    subscriptions.forEach((unsubscribe) => unsubscribe())
  })
  unsubscribeFunctions.value = {}
})
</script>
<style scoped>
.home .m-popular {
  min-height: 4rem;
}
.home .m-popular .m-snap-nav {
  padding-bottom: 0.33333333rem;
}
.home .m-popular .m-popular-item {
  display: block;
  -webkit-box-flex: 0 !important;
  -webkit-flex: 0 0 auto !important;
  -ms-flex: 0 0 auto !important;
  flex: 0 0 auto !important;
  font-size: 1rem;
  /* margin-right: 0.33333333rem; */
  /* padding: 5px 10px; */
  min-width: 4rem;
  border-radius: 30px;
  /* border: 1px solid var(--brand-primary); */
  height: auto;
}

.home .m-popular .m-popular-item a {
  line-height: normal;
  color: var(--brand-primary);
  white-space: nowrap;
}
.home .m-popular .m-popular-item:first-child {
  margin-left: 0.83333333rem;
}
.home .m-popular .m-popular-item:last-child {
  margin-right: 0.83333333rem;
}
.home .m-popular .m-popular-item .m-color-bar {
  background: #353a45;
  height: 0.25rem;
}
.home .m-popular .m-popular-item .m-color-bar--red {
  background: #e41827;
}
.home .m-popular .m-popular-item .m-color-bar--green {
  background: var(--brand-highlight-text);
}
.home .m-popular .m-popular-item a img {
  width: 100%;
  height: 100%;
  vertical-align: top;
}
.home .m-second-banner {
  display: block;
}
.home .m-second-banner img {
  display: block;
  max-height: 64px;
  width: 100%;
}
.home .m-sports .m-title,
.home .m-live .m-title {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1.75rem;
  margin: 0 0.83333333rem;
}
.featured-match-placeholder {
  min-height: 14.58333333rem;
  position: relative;
  width: 100%;
}
#featuredMatchCardBox {
  padding: 0.5rem 1.1rem;
  scroll-padding-left: 1.1rem;
  scroll-snap-type: x mandatory;
}

.featured-widget {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  font-family: 'roboto', sans-serif;
  background-color: #ffffff;
  background-color: var(--background-type1-secondary);
  margin-bottom: 10px;
}

.featured-widget .featured-nav-list {
  -webkit-box-align: stretch;
  -webkit-align-items: stretch;
  -ms-flex-align: stretch;
  align-items: stretch;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-shrink: 0;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  height: 2.91666667rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  padding: 0.5rem 1rem 0 1rem;
  position: relative;
  width: 100%;
}
.featured-widget .featured-nav-list .featured-header-left {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
  -webkit-flex-direction: row;
  -ms-flex-direction: row;
  flex-direction: row;
  /* -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center; */
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  width: 100%;
}
.featured-widget .featured-nav-list .featured-header-right {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: horizontal;
  -webkit-box-direction: normal;
  -webkit-flex-direction: row;
  -ms-flex-direction: row;
  flex-direction: row;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding: 0.5rem 0 0.5rem 0.16666667rem;
  background-color: #ffffff;
  background-color: var(--c-featured-match-bg);
}
.featured-widget .featured-nav-list .featured-title {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  /* border-right: solid 0.5px; */
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.5rem;
  font-weight: bold;
  margin-right: 1rem;
  padding-right: 1rem;
  border-right-color: #9ca0ab;
  border-right-color: var(--line-type1-secondary);
  color: #353a45;
  color: var(--text-type1-primary);
}
.featured-nav-item .feature-nav-span {
  font-size: 1.16666667rem;
  font-weight: normal;
  margin-right: 0.5rem;
  color: #353a45;
  color: var(--c-prematch-sport-item-text);
}
.featured-nav-item .feature-nav-span.active {
  color: var(--brand-highlight-text);
  font-weight: bold;
}
.featured-active {
  background-color: #ffffff;
  background-color: var(--c-featured-match-bg);
}
.featured-active::before {
  bottom: 0;
  content: '';
  display: block;
  position: absolute;
  width: 10%;
}
.feature-list {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.feature-list.active {
  color: var(--brand-highlight-text);
  color: var(--brand-quaternary);
  font-weight: bold;
}
.tabList {
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  width: 100%;
}
.codeHub-Icon {
  text-align: center;
  background-color: #ffffff;
  background-color: var(--c-featured-match-bg);
}
.booking-code {
  background-color: rgba(0, 0, 0, 0.7);
  position: fixed;
  z-index: 300;
}
.HorizonSwipe {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-wrap: nowrap;
  -ms-flex-wrap: nowrap;
  flex-wrap: nowrap;
}
.HorizonSwipe::-webkit-scrollbar {
  display: none;
}
.HorizonSwipe > * {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
}

.featuredMatchCategory {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  border: 1px solid;
  border-color: #dcdee5;
  border-radius: 1.16666667rem;
  display: -webkit-inline-box;
  display: -webkit-inline-flex;
  display: -ms-inline-flexbox;
  display: inline-flex;
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  max-width: 3.33333333rem;
  overflow: hidden;
  padding: 0.33333333rem 0.83333333rem;
  -webkit-transition: all 0.5s;
  transition: all 0.5s;
  width: auto;
}
.featuredMatchCategory::after {
  content: '';
  display: none;
  bottom: 6px;
  height: 0;
  left: 50%;
  position: absolute;
  -webkit-transform: rotate(-90deg);
  -ms-transform: rotate(-90deg);
  transform: rotate(-90deg);
  -webkit-transform-origin: 100% 100%;
  -ms-transform-origin: 100% 100%;
  transform-origin: 100% 100%;
  width: 0;
  border-bottom: 8px solid transparent;
  border-top: 8px solid transparent;
}
.featuredMatch {
  overflow: hidden;
}
.featuredMatch #featuredMatchCardBox > * {
  margin-right: 0.66666667rem;
  scroll-snap-align: start;
}
@media only screen and (max-width: 320px) {
  .featuredMatch #featuredMatchCardBox > * {
    margin-right: 0.33333333rem;
  }
}
.featuredMatch .featuredMatchCategoryBox {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-wrap: nowrap;
  -ms-flex-wrap: nowrap;
  flex-wrap: nowrap;
  margin-top: 0.66666667rem;
  overflow-x: auto;
}
.featuredMatch .featuredMatchCategoryBox .featuredMatchCategoryNav {
  width: 100%;
}
.featuredMatch .featuredMatchCategoryBox .featuredMatchCategoryNav .featuredMatchCategoryNavItem {
  padding: 0 0 0.4rem 0;
}

.featuredMatchCategory::before {
  content: '';
  display: none;
  bottom: 0px;
  height: 0;
  left: 50%;
  position: absolute;
  -webkit-transform: rotate(-90deg);
  -ms-transform: rotate(-90deg);
  transform: rotate(-90deg);
  -webkit-transform-origin: 100% 100%;
  -ms-transform-origin: 100% 100%;
  transform-origin: 100% 100%;
  width: 0;
  border-bottom: 4px solid transparent;
  border-right: 6px solid var(--c-featured-match-category-border-active);
  border-top: 4px solid transparent;
}
.featuredMatchCategory .wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 1.66666667rem;
}
.featuredMatchCategory .wrapper .img {
  width: 1.86666667rem;
  height: 1.86666667rem;
  border-radius: 50%;
  background-color: #fbfbfb;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-inline-box;
  display: -webkit-inline-flex;
  display: -ms-inline-flexbox;
  display: inline-flex;
  min-width: 0;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  opacity: 0.5;
  border: none;
}
.featuredMatchCategory .wrapper .img.is-dark {
  opacity: 1;
  padding: 0.08333333rem;
  background-color: #fff;
  border-radius: 50%;
  overflow: hidden;
}
.featuredMatchCategory .wrapper img {
  width: 100%;
  -o-object-fit: contain;
  object-fit: contain;
}
.featuredMatchCategory .wrapper .icon {
  color: unset;
  color: var(--c-featured-match-category-icon);
  line-height: 1.2;
  margin-right: 0.2rem;
  opacity: 0.5;
  -webkit-transform: scale(1.2);
  -ms-transform: scale(1.2);
  transform: scale(1.2);
  -webkit-transform-origin: 0;
  -ms-transform-origin: 0;
  transform-origin: 0;
}
@media only screen and (max-width: 320px) {
  .featuredMatchCategory .wrapper .icon {
    margin-right: 0;
    -webkit-transform: scale(1);
    -ms-transform: scale(1);
    transform: scale(1);
    -webkit-transform-origin: 0;
    -ms-transform-origin: 0;
    transform-origin: 0;
  }
}
.featuredMatchCategory .wrapper .name {
  color: #1b1e25;
  color: var(--text-type1-tertiary);
  display: none;
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  margin-left: 0.33333333rem;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}
.featuredMatchCategory.active {
  border-color: var(--c-featured-match-category-border-active);
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  max-width: 100%;
  min-width: 0;
  overflow: visible;
  position: relative;
}
.featuredMatchCategory.active::after {
  display: block;
}
.featuredMatchCategory.active::before {
  display: block;
}
.featuredMatchCategory.active .wrapper {
  overflow: hidden;
  white-space: nowrap;
  width: 100%;
}
.featuredMatchCategory.active .wrapper .img,
.featuredMatchCategory.active .wrapper .icon {
  opacity: 1;
}
.featuredMatchCategory.active .wrapper .name {
  display: inline-block;
  opacity: 1;
  pointer-events: auto;
}
.featuredMatch #featuredMatchCardBox > * {
  margin-right: 0.66666667rem;
}

.tournaments {
  padding: 0 15px 10px 15px;
  overflow: auto;
  display: flex;
}

.tournaments::-webkit-scrollbar {
  display: none;
}

.topTournamentCard {
  padding: 5px;
  border-top: 3px solid orangered;
  display: flex;
  align-items: center;
  justify-content: space-between;
  -webkit-box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.5);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.5);
  margin-right: 15px;
}

.topTournamentCard:last-of-type {
  margin-right: 0;
}

.topTournamentCard .text {
  font-weight: bolder;
  text-transform: uppercase;
  white-space: nowrap;
}

/* Additional Colors */
.topTournamentCard:nth-child(3n + 1) {
  border-top-color: var(--brand-primary); /* Burnt Orange */
}

.topTournamentCard:nth-child(3n + 2) {
  border-top-color: var(--brand-secondary); /* Spanish Orange */
}

.topTournamentCard:nth-child(3n + 3) {
  border-top-color: var(--brand-tertiary); /* Beer */
}
</style>
