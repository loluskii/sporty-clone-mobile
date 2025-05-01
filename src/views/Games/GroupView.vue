<template>
  <div class="casino">
    <HeaderCasino />
    <Winners />
    <div class="carousel">
      <Carousel></Carousel>
    </div>
    <div class="games-container">
      <template v-if="viewMode === 'games-group-view'">
        <Providers v-if="viewType === 'provider'" :providers="providers" />
        <Categories v-else :categories="categories" />
      </template>
      <GameByProviderCategory
        v-if="viewMode === 'games-list-view'"
        :games="gamesList"
        :titleText="categoryName"
        :type="viewType"
      />
    </div>
    <LoadingSpinner v-if="isLoading"></LoadingSpinner>
    <div
      v-else-if="
        !isLoading && !gamesList.length && viewMode === 'games-list-view'
      "
      class="no-data"
    >
      <div style="white-space: pre-line">
        Sorry, there are no games currently<br />available in this category.
        Please try later.<br />Thank you.
      </div>
    </div>
    <div
      v-else-if="!isLoading && !providers && viewMode === 'games-group-view'"
      class="no-data"
    >
      <div style="white-space: pre-line">
        Sorry, there are no {{ viewHeaderTitle }} currently<br />available.
        Please try later.<br />Thank you.
      </div>
    </div>
  </div>
</template>

<script setup>
import GameByProviderCategory from "@/components/Casino/GameByProviderCategory.vue";
import Providers from "../../components/Casino/Providers.vue";
import Carousel from "@/components/Home/Carousel.vue";
import { ref, onBeforeMount, watch, computed, onMounted, provide } from "vue";
import Winners from "../../components/Casino/Winners.vue";
import {
  getGamesByProviders,
  gamesByTopCategory,
  getProviders,
  getTopGameCategories,
  getGames,
} from "@/helpers";
import { useAuthStore } from "@/stores";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { slugify } from "@/helpers";
import emitter from "@/plugins/emitter";
import $ from "jquery";
import { useRouter, useRoute } from "vue-router";
import Categories from "../../components/Casino/Categories.vue";
import HeaderCasino from "../../components/HeaderCasino.vue";

const myElement = ref();
const isLoading = ref(true);
const route = useRoute();
const router = useRouter();
const viewMode = ref(null);
const viewType = ref();
const viewHeaderTitle = ref("Providers");
const providers = ref([]);
const categories = ref([]);
const gamesList = ref([]);
const categoryName = ref(null);

// const filterQuery = ref()

const activeSport = computed(() => {
  return utilsStore.activeSport;
});

watch(
  () => [
    route.name,
    route.params.category,
    route.params.provider,
    route.query.category_id,
    route.query.providerId,
    route.query.gameIds,
  ],
  async ([
    routeName,
    categoryName,
    providerName,
    gameCategoryId,
    gameProviderId,
    gameIds,
  ]) => {
    // Check the route name
    isLoading.value = true;
    switch (routeName) {
      case "casino-providers":
        handleProvidersView();
        break;
      case "casino-category":
        handleCategoriesView();
        break;
      case "games-by-category":
        handleGamesByCategoryView(categoryName, gameCategoryId);
        break;
      case "games-by-provider":
        handleGamesByProviderView(providerName, gameProviderId);
        break;
      case "casino-bonus":
        handleBonusGames(gameIds);
        break;
      case "casino-jackpots":
        handleCasinoJackpots(gameIds);
        break;
      default:
        break;
    }
  },
  { immediate: true }, // Trigger the watch callback immediately on component mount
);

async function handleProvidersView() {
  try {
    viewType.value = "provider";
    viewMode.value = "games-group-view";
    viewHeaderTitle.value = "Providers";
    const res = await getProviders();
    providers.value = res.data;
    isLoading.value = false;
  } catch (error) {
    isLoading.value = false;
    providers.value = [];
  }
}

async function handleCategoriesView() {
  try {
    viewMode.value = "games-group-view";
    viewHeaderTitle.value = "Categories";
    const res = await getTopGameCategories();
    categories.value = res.data;
    isLoading.value = false;
    viewType.value = "category";
  } catch (error) {
    categories.value = [];
    isLoading.value = false;
  }
}

async function handleGamesView(name, id, fetchFunction, type) {
  viewMode.value = "games-list-view";
  viewHeaderTitle.value = name.replace(/_/g, " ");
  categoryName.value = name.replace(/_/g, " ");
  const res = await fetchFunction(id);
  gamesList.value = res.data.sort((a, b) => b.priority - a.priority) || [];
  viewType.value = type;
  isLoading.value = false;
}

async function handleGamesByCategoryView(name, id) {
  await handleGamesView(name, id, gamesByTopCategory, "category");
}

async function handleGamesByProviderView(name, id) {
  gamesList.value = []; // Ensure gamesList is cleared before fetching
  await handleGamesView(name, id, getGamesByProviders, "provider");
}

async function handleFilteredGamesView(title, gameIds) {
  console.log(gameIds);
  viewMode.value = "games-list-view";
  viewHeaderTitle.value = title;
  categoryName.value = title;
  const res = await getGames();
  const gameIdSet = new Set(gameIds.split(","));
  gamesList.value = res.data
    ? res.data.filter((game) => gameIdSet.has(game.gameId))
    : [];
  viewType.value = "category";
  isLoading.value = false;
}

async function handleBonusGames(gameIds) {
  await handleFilteredGamesView("Bonus Games", gameIds);
}

async function handleCasinoJackpots(gameIds) {
  await handleFilteredGamesView("Jackpot Games", gameIds);
}

onMounted(() => {
  $("body").removeClass("no-scroll");
});
</script>

<style scoped>
@import url("@/assets/css/casino.css");

.title-bg {
  font-size: 28px;
  line-height: 1.4;
  font-weight: 500;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  text-align: center;
  font-family: var(--stb-font-helper);
  color: rgb(var(--stb-white-1000));
  padding: 22px 0;
  min-height: 80px;
  z-index: 1;
}

.title-bg:after {
  content: "";
  position: absolute;
  z-index: -1;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-bottom: 1px solid rgb(var(--stb-unique-color-1));
  background-color: rgb(var(--stb-green-1000));
  background-image: url(/assets/static/general/ornament-title.svg);
  background-repeat: repeat-x;
  background-position: center;
  background-size: 40px 70px;
}

.no-data {
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
  font-size: 1rem;
  padding: 2.33333333rem;
  text-align: center;
  background-color: transparent;
}

.casino {
  background-color: #000;
  min-height: 100vh;
}

.games-container {
  height: 100%;
  width: 100%;
  padding: 15px 15px 60px 15px;
}

.head-top {
  padding: 0 15px;
}

.game-group {
  background-color: #373737;
  border-radius: 10px;
  margin: 10px 15px 0px;
}

.games-grid {
  height: 100%;
  max-height: calc(100vh - (var(--distance-from-top) + 50px));
  overflow: scroll !important;
  width: 100%;
  padding: 0 15px;
}

.game-group .group {
  /* /* display: flex; */
  /* flex-direction: column; */
  /* align-items: center; */
  padding: 10px 25px;
  font-size: 2.8vw;
  border-radius: 10px;
  border: 1px solid #333;
  /* margin-left: 5px; */
  /* margin-right: 5px; */
  color: #fff;
  text-align: center;
  /* background-color: #373737; */
  /* white-space: nowrap; */
}

.game-provider {
  padding: 0 15px;
}

.game-provider > span {
  font-size: 18px;
  font-weight: bold;
  border-radius: 10px;
  /* border-right: 1px solid white;
  border-bottom: 1px solid white; */
  background-color: #333;
  color: #fff;
  justify-content: center;
  align-items: center;
  height: 40px;
  /* width: 40px; */
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.game-search {
  padding: 10px;
  font-size: 2.8vw;
  border-radius: 10px;
  border: 1px solid #4f4f4f;
  color: #fff;
  text-align: center;
  margin-left: 10px;
  height: 50px;
  width: 50px;
  display: flex;
  align-items: center;
}

.game-group .group.active {
  background-color: var(--brand-secondary);
  -webkit-box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.5);
  /* color: var(--brand-secondary); */
}

.games-container .grid-container {
  display: grid;
  /* display: flex; */
  overflow-x: scroll;
  white-space: no;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 20px 0px 0px;
}

.games-container .categories-list {
  display: flex;
  flex-wrap: nowrap;
  /* Prevent wrapping */
  overflow: auto;
  /* Enable horizontal scrolling if items overflow */
  gap: 10px;
  /* Space between items */
}

.games-container .categories-list::-webkit-scrollbar {
  display: none;
}

.games-container .categories-list .category {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  border-radius: 10px;
  color: #b3bec1;
  white-space: nowrap;
  flex: 0 0 auto;
  margin-right: 15px;
}

.games-container .categories-list .category img {
  height: 25px;
  margin-bottom: 5px;
  padding-right: 10px;
}

.games-container .categories-list .category.active {
  display: flex;
  /* flex-direction: column; */
  align-items: center;
  background-color: #333;
  color: white;
  border-radius: 10px;
  padding: 5px 15px;
}

.games-container .categories-list .category img {
  height: 30px;
  width: 100%;
  object-fit: cover;
}
</style>
