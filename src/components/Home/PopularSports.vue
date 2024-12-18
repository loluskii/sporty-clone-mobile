<template>
  <div class="m-popular featuredMatch">
    <div class="tournaments">
      <div
        class="topTournamentCard"
        @click.prevent="
          $router.push({
            name: 'today-fixtures',
            params: { sport: 'Soccer' }
          })
        "
      >
        <div class="image"></div>
        <div class="text">today's football</div>
      </div>
      <div
        class="topTournamentCard"
        @click.prevent="
          $router.push({
            name: 'fixtures-by-sports',
            params: { sport: 'Soccer' },
            query: { period: '3hrs' }
          })
        "
      >
        <div class="image">
          <img src="@/assets/images/3hrs.jpeg" style="height: 24px" alt="" srcset="" />
        </div>
        <div class="text">football in 3 hours</div>
      </div>
      <template v-for="(match, index) in featuredTournaments" :key="index">
        <div
          class="topTournamentCard"
          @click.prevent="
            $router.push({
              name: 'fixtures-by-tournaments',
              params: {
                sport: 'Soccer',
                categories: `sr:category:${match.categoryID}`,
                tournaments: `sr:tournament:${match.tournamentID}`
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
          <div class="text">{{ match.tournamentName }}</div>
        </div>
      </template>
    </div>

    <div class="featured-match-placeholder">
      <div class="featured-widget with-nav" style="">
        <div class="m-snap-nav-wrap" style="overflow: hidden">
          <ul class="m-snap-nav flex">
            <li
              @click="setActiveTab('featuredMatches')"
              class="featured-nav-item m-snap-nav-item"
              :class="activeFeaturedTab == 'featuredMatches' ? 'active featured-active' : ''"
            >
              <span>Featured Matches</span>
            </li>
            <li
              @click="setActiveTab('featuredGames')"
              class="featured-nav-item m-snap-nav-item"
              :class="activeFeaturedTab == 'featuredGames' ? 'active featured-active' : ''"
            >
              <span>Featured Casino</span>
            </li>
          </ul>
        </div>
        <div v-show="activeFeaturedTab == 'featuredMatches'" class="featuredMatch bg-white">
          <template v-if="!isLoading">
            <div class="featuredMatchCategoryBox">
              <div
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
                      :class="activeFeaturedTournament == top.tournamentID ? 'active' : ''"
                    >
                      <div class="wrapper">
                        <div class="img">
                          <img :src="getImageURL(top.tournamentName)" />
                        </div>
                        <div class="name">{{ top.tournamentName }}</div>
                      </div>
                    </div>
                  </li>
                </ul>
                <i class="controls left-controls"></i> <i class="controls right-controls"></i>
              </div>
            </div>
            <div class="HorizonSwipe" id="featuredMatchCardBox" style="overflow: auto">
              <template v-for="tournament in sortedTournamentGames">
                <!-- {{ tournament }} -->
                <FeaturedMatchCard
                  v-for="(game, g) in tournament.fixtures"
                  ref="gamesList"
                  :key="g"
                  :matchDetails="game"
                  :markets="tournament.markets"
                ></FeaturedMatchCard>
              </template>
            </div>
          </template>
          <LoadingSpinner v-else></LoadingSpinner>
        </div>
        <FeaturedGamesContainer
          v-show="activeFeaturedTab == 'featuredGames'"
          :featuredCasinogames="featuredCasinogames"
          :featuredCasino="featuredCasino"
          :activeCasinoCategory="activeCasinoCategory"
          @set-active-category="setActiveCategory"
          :casinoIsLoading="casinoIsLoading"
        ></FeaturedGamesContainer>
      </div>
    </div>
  </div>
</template>
<script setup>
import FeaturedMatchCard from './FeaturedMatchCard.vue'
import { ref, onMounted, computed } from 'vue'
import {
  getTopBets,
  getFixturesByTournamentId,
  slugify,
  getTopGameCategories,
  gamesByTopCategory
} from '@/helpers'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import FeaturedGamesContainer from './FeaturedGamesContainer.vue'

const isLoading = ref(false)
const casinoIsLoading = ref(false)

const featuredTournaments = ref([])
const featuredTournamentGames = ref([])
const activeFeaturedTournament = ref(null)

const activeFeaturedTab = ref('featuredMatches')

const activeCasinoCategory = ref(null)
const featuredCasinogames = ref([])
const featuredCasino = ref([])

function scrollGamesIntoView() {
  document.getElementById('featuredMatchCard_' + activeFeaturedTournament.value).scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

function setActiveTab(tab) {
  activeFeaturedTab.value = tab
}

const sortedTournamentGames = computed(() => {
  return featuredTournamentGames.value.length
    ? [...featuredTournamentGames.value].sort((a, b) => a.tournamentID - b.tournamentID)
    : []
})

function getImageURL(name) {
  if (name == 'Championship') {
    return new URL('../../assets/images/EFL_Championship_Logo.png', import.meta.url)
  } else if (name == 'Bundesliga') {
    return new URL('../../assets/images/Bundesliga.png', import.meta.url)
  } else {
    return `https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/Top%20Leagues%2F${name}.png?alt=media`
  }
}

const setActiveTournament = (tournament) => {
  activeFeaturedTournament.value = tournament.tournamentID
  scrollGamesIntoView()
}

const setActiveCategory = async (category) => {
  casinoIsLoading.value = true
  activeCasinoCategory.value = category.id
  const games = await gamesByTopCategory(activeCasinoCategory.value)
  casinoIsLoading.value = false
  featuredCasinogames.value = games.games ? games.games.splice(0, 5) : []
}

async function getCasinoGames() {
  casinoIsLoading.value = true
  const res = await getTopGameCategories()
  featuredCasino.value = res.data
  activeCasinoCategory.value = res.data[0].id
  const games = await gamesByTopCategory(activeCasinoCategory.value)
  casinoIsLoading.value = false
  featuredCasinogames.value = games.games ? games.games.splice(0, 5) : []
}

function assignTournaments(tournament, games, tournamentID) {
  if (games && games.fixtures && games.markets) {
    const gamesList = games.fixtures.slice(0, 5)
    featuredTournamentGames.value.push({
      tournamentID: tournamentID,
      fixtures: [...gamesList],
      markets: [...games.markets] // Spread inside an array to create a new array
    })
  } else {
    const index = featuredTournaments.value.findIndex((x) => x.tournament_id == tournament.id)
    featuredTournaments.value.splice(index, 1)
  }
}

async function getFeaturedGames() {
  isLoading.value = true
  try {
    const res = await getTopBets()
    if(res.data){
      featuredTournaments.value = res.data?.sort((a, b) => a.tournamentID - b.tournamentID)
      activeFeaturedTournament.value = res.data[0]?.tournamentID
      await Promise.all(
        featuredTournaments.value.map(async (tournament) => {
          const games = await getFixturesByTournamentId(tournament.tournamentID, tournament.sportID)
          assignTournaments(tournament, games, tournament.tournamentID)
        })
      )
      isLoading.value = false
    }else throw Error;
  } catch (error) {
    isLoading.value = false
  }
}

onMounted(async () => {
  Promise.all([getFeaturedGames(), getCasinoGames()])
    .then(() => {})
    .catch((error) => {
      console.error('An error occurred:', error)
    })
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
  background: #0d9737;
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
.home .m-sports .m-today-tab {
  border-bottom: 1px solid #f2f3f5;
  border-color: #f2f3f5;
  border-color: var(--c-prematch-tab-border);
}
.home .m-sports .m-today-tab .m-tabs-nav {
  border-bottom: none;
  min-width: 100%;
}
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
  width: auto;
}
.home .m-sports .m-today-tab .m-tabs-ink-bar {
  height: 3px;
}
.home .m-sports .market-wrapper {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  position: relative;
}
.home .m-sports .nav-fixed .market-wrapper {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  position: fixed;
  top: 7.75rem;
  -webkit-transition: top 0.3s ease !important;
  transition: top 0.3s ease !important;
  width: 100%;
  z-index: 100;
}
.home .m-sports .nav-fixed .market-wrapper:after {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  content: '';
  height: 4rem;
  left: 0;
  position: absolute;
  top: -4rem;
  width: 100%;
}
.home .m-sports .nav-fixed.nav-up .market-wrapper {
  top: 11.41666667rem;
}
.home .m-sports .nav-up .market-wrapper {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  position: fixed;
  top: 11.41666667rem;
  z-index: 200;
}
.home .m-sport-bet-error {
  padding: 0.83333333rem;
}
.home .view-all {
  margin: 0 2rem 0 0.83333333rem;
  padding: 1.41666667rem 0;
  text-align: right;
}
.home .view-all a {
  font-size: 1rem;
  line-height: 1.066rem;
  position: relative;
}
.home .view-all a::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.home .view-all a::before {
  display: inline-block;
  font-size: 1rem;
  position: absolute;
  right: -1.33333333rem;
  top: 0;
}
.featured-match-placeholder {
  min-height: 14.58333333rem;
  position: relative;
  width: 100%;
}
#featuredMatchCardBox {
  padding: 0.8rem 1.1rem;
}

.featured-widget {
  -webkit-box-shadow:
    rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px;
  box-shadow:
    rgba(50, 50, 93, 0.25) 0px 2px 5px -1px,
    rgba(0, 0, 0, 0.3) 0px 1px 3px;
  margin: 0.66666667rem;
}
.featured-widget.with-nav {
  min-height: 17.91666667rem;
}
.featured-nav-item {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #f2f3f5;
  /* background-color: var(--c-featured-match-tab-bg); */
  color: #010101;
  color: var(--c-featured-match-nav-text);
  display: -webkit-box !important;
  display: -webkit-flex !important;
  display: -ms-flexbox !important;
  display: flex !important;
  font-size: 1.066rem;
  font-weight: bold;
  height: 2.75rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  width: 50%;
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
  border-color: var(--c-featured-match-category-border);
  border-radius: 1.066rem;
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
  border-right: 10px solid var(--c-featured-match-arrow-color);
  border-top: 8px solid transparent;
}
.featuredMatch {
  overflow: hidden;
}
.featuredMatch #featuredMatchCardBox > * {
  margin-right: 0.66666667rem;
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
  background-color: white;
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
  font-size: 14px;
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
