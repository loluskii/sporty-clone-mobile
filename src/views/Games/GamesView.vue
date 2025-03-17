<template>
  <div class="casino">
    <HeaderCasino></HeaderCasino>
    <Winners />
    <div class="carousel">
      <Carousel></Carousel>
    </div>
    <div v-if="!isLoading" class="games-container pb-5">
      <div class="head-top d-flex align-items-center">
        <div class="categories-list">
          <div class="category" :class="!activeTopCategory ? 'active' : ''" @click="getGameByTopCategory()"
            id="discover">
            <img src="@/assets/images/casino/all.png" class="img-fluid" alt="" srcset="" />
            <span>Discover</span>
          </div>
          <template v-for="(top, index) in topGameCategories" :key="index">
            <div class="category" :class="activeTopCategory?.id == top.id ? 'active' : ''"
              @click="getGameByTopCategory(top)" v-if="top.priority >= 0"
              :id="'category_' + top.id">
              <img :src="getImageSrc(top.slug)" class="img-fluid" alt="" srcset="" />
              <span>{{ top.name }}</span>
            </div>
          </template>
        </div>
      </div>
      <div class="game-provider" @click="$router.push({ name: 'casino-providers' })">
        <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none" stroke="#f2f2f2"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-gem icon providers">
          <path d="M6 3h12l4 6-10 13L2 9Z" />
          <path d="M11 3 8 9l4 13 4-13-3-6" />
          <path d="M2 9h20" />
        </svg>
        <span class="pl-2">Providers</span>
      </div>
      <div v-if="!isLoading" ref="myElement" class="games-grid mt-3">
        <div v-if="currentView === 'grouped_category'" class="grouped-games-section">
          <!-- Jackpots -->
          <template v-if="jackpots">
            <div class="header d-flex justify-content-between align-items-center">
              <h1 class="h5 text-white fw-normal">Jackpots</h1>
              <span @click="$router.push({ name: 'casino-jackpots' })"
                class="text-decoration-none text-uppercase bg-dark small text-white px-2 py-1 rounded">Show More
              </span>
            </div>
            <Jackpots :jackpots="jackpots" :games="gamesList"></Jackpots>
          </template>
          <!-- Jackpots -->

          <template v-for="(top, index) in topGameCategories" :key="index">
            <div class="group" v-if="top.priority >= 0">
              <div class="header d-flex justify-content-between align-items-center">
                <h1 class="h5 text-white fw-normal">{{ top.name }}</h1>
                <span class="text-decoration-none text-uppercase bg-dark small text-white px-2 py-1 rounded" @click="
                  showMore(top)
                ">Show More
                </span>
              </div>
              <template v-if="top.games.length && !top.isLoading">
                <div class="grid-container mb-3 pb-3" ref="scrollComponent">
                  <div class="card bg-dark rounded-3 shadow" style="width: 150px" @click="redirectToGamePlay(game)"
                    v-for="(game, index) in top.games" :key="index">
                    <img :src="getImagePath(game)" class="card-img-top" alt="..."
                      @error="handleImageError($event, game)" />
                    <div class="card-body d-flex flex-column p-2">
                      <div class="text-truncate fw-bold" style="max-width: 150px; color: var(--brand-highlight-text)">
                        {{ game.title }}
                      </div>
                      <div class="text-muted">{{ game.type }}</div>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else-if="!top.isLoading && !top.games.length" class="no-data">
                <div style="white-space: pre-line">
                  Sorry, there are no games currently<br />available in this category.
                  Please try later.<br />Thank you.
                </div>
              </div>
              <LoadingSpinner v-else></LoadingSpinner>
            </div>
          </template>
        </div>
        <div v-if="currentView === 'single_category'" class="grouped-games-section">
          <div class="group">
            <div class="header d-flex justify-content-between align-items-center mb-3">
              <h1 class="card-title h2 fw-bold text-white">
                {{ activeTopCategory.name }}
              </h1>
            </div>
            <div class="row mb-3 pb-3" v-if="gamesList.length" ref="scrollComponent">
              <div class="col-6" v-for="(game, index) in gamesList" :key="index">
                <Game :game="game" />
              </div>
            </div>
            <div v-else-if="!singleCategoryLoading && !gamesList.length" class="no-data">
              <div style="white-space: pre-line">
                Sorry, there are no games currently<br />available in this category.
                Please try later.<br />Thank you.
              </div>
            </div>
            <LoadingSpinner v-else></LoadingSpinner>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="games-container placeholder-glow">
      <div class="head-top d-flex align-items-center">
        <div class="categories-list">
          <div class="category px-5 py-4 placeholder" id="discover"></div>
          <div class="category px-5 py-4 placeholder" id="discover"></div>
          <div class="category px-5 py-4 placeholder" id="discover"></div>
          <div class="category px-5 py-4 placeholder" id="discover"></div>
        </div>
      </div>
      <div class="game-provider placeholder p-4 rounded"></div>
      <div class="games-grid mt-3">
        <div class="grouped-games-section">
          <div v-for="x in 4" :key="x" class="group">
            <div class="header d-flex justify-content-between align-items-center">
              <h1 class="fw-normal placeholder h4 p-2 rounded" style="width: 50px"></h1>
              <span style="width: 50px"
                class="placeholder p-2 rounded text-decoration-none text-uppercase bg-dark small text-white px-2 py-1 rounded">
              </span>
            </div>
            <div class="grid-container mb-3 pb-3" ref="scrollComponent">
              <div class="card bg-dark rounded-3 placeholder" v-for="i in 3" :key="i" style="width: 150px"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="errorState.categoriesError" class="error-message">
      Failed to load categories. Please try again later.
    </div>

    <div v-if="errorState.gamesError" class="error-message">
      Failed to load games. Please try again later.
    </div>
  </div>
</template>

<script setup>
import Winners from "../../components/Casino/Winners.vue";
import Jackpots from "../../components/Casino/Jackpots.vue";
import HeaderCasino from "@/components/HeaderCasino.vue";
import Carousel from "@/components/Home/Carousel.vue";
import { ref, onBeforeMount, computed } from "vue";
import { getTopGameCategories, gamesByTopCategory, getJackpotWinners } from "@/helpers";
import router from "@/router";
import { useAuthStore, useUsersStore, useUtilstStore } from "@/stores";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { getJackpots, slugify } from "../../helpers";
import emitter from "@/plugins/emitter";
import Game from "@/components/Casino/Game.vue";
import { useRoute } from "vue-router"

const topGameCategories = ref([]);
const gamesList = ref([]);
const activeTopCategory = ref(null);
const scrollComponent = ref(null);
const authStore = useAuthStore();
const userStore = useUsersStore();
const isLoading = ref(true);
const singleCategoryLoading = ref(true);
const myElement = ref(null);
const currentView = ref("grouped_category");
const bonus = ref(null);
const jackpots = ref([]);
const route = useRoute()
const utilsStore = useUtilstStore()
const errorState = ref({
  categoriesError: false,
  gamesError: false,
  jackpotsError: false
});

const getImageSrc = (prov) => {
  try {
    let name = prov.split("-");
    let imageName = name[1] !== "games" ? prov : name[0];
    return new URL(`../../assets/images/casino/${imageName}.png`, import.meta.url);
  } catch (error) {
    console.error('Error loading category image:', error);
    return new URL(`../../assets/images/casino/virtuals.png`, import.meta.url);
  }
};

const showMore = (top) => {
  utilsStore.previousRoute = route.fullPath
  return router.push({
    name: 'games-by-category',
    params: { category: slugify(top.name) },
    query: { category_id: top.id },
  })
}

const activeBonus = computed(() => {
  return userStore.casinoActiveBonus;
});

async function getCategories() {
  isLoading.value = true;
  errorState.value.categoriesError = false;

  try {
    const response = await getTopGameCategories();
    const categories = response.data;

    const data = await Promise.all(
      categories.map(async (category) => {
        if (!category.slug) {
          return { ...category, games: [], isLoading: false };
        }

        try {
          const gamesResponse = await gamesByTopCategory(category.id);
          return {
            ...category,
            games: gamesResponse.data?.slice(0, 12) || [],
            isLoading: false,
            hasError: false
          };
        } catch (error) {
          console.error(`Error fetching games for ${category.name}:`, error);
          return {
            ...category,
            games: [],
            isLoading: false,
            hasError: true
          };
        }
      })
    );

    topGameCategories.value = data.sort((a, b) => b.priority - a.priority);
  } catch (error) {
    console.error("Error fetching categories:", error);
    errorState.value.categoriesError = true;
  } finally {
    isLoading.value = false;
  }
}

async function getGameByTopCategory(category) {
  singleCategoryLoading.value = true;
  errorState.value.gamesError = false;

  try {
    if (category) {
      const element = document.getElementById("category_" + category.id);
      element?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });

      currentView.value = "single_category";
      activeTopCategory.value = category;
      const res = await gamesByTopCategory(category.id);
      gamesList.value = res.games || [];
    } else {
      document.getElementById("discover")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center"
      });
      currentView.value = "grouped_category";
      activeTopCategory.value = null;
      await getCategories();
    }
  } catch (error) {
    console.error("Error fetching games by category:", error);
    errorState.value.gamesError = true;
  } finally {
    singleCategoryLoading.value = false;
  }
}

const getJK = async () => {
  try {
    const res = await getJackpots();
    jackpots.value = res.data.jackpots ?? null;
  } catch (error) {
    console.error("Error fetching jackpots:", error);
    errorState.value.jackpotsError = true;
  }
};

const getImagePath = (game) => {
  try {
    return `https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/Casino2%2F${encodeURIComponent(game.title.toLowerCase())}.png?alt=media`;
  } catch (error) {
    console.error('Error generating image path:', error);
    return `https://placehold.co/150x175?text=${encodeURIComponent(game.title)}`;
  }
};

const handleImageError = (event, game) => {
  // Replace the failed image with a placeholder
  let name = encodeURIComponent(game.title);
  event.target.src = `https://placehold.co/150x175?text=${name}`; // Specify your placeholder image path
  event.target.alt = `${game.title}`;
};

async function redirectToGamePlay(game) {
  utilsStore.previousRoute = route.fullPath
  try {
    if (!userStore.currentUser) {
      authStore.returnUrl = "/Games";
      return router.push({ name: "sign-in" });
    }

    if (activeBonus.value && activeBonus.value.gameId && activeBonus.value.gameId.includes(game.gameId)) {
      emitter.emit("showCasinoDialog", { bonus: activeBonus.value, game });
      return;
    }

    await router.push({
      name: "game-play",
      params: { game_name: slugify(game.title), game_id: game.id }
    });
  } catch (error) {
    console.error("Error redirecting to game:", error);
  }
}

const updateCSSVar = () => {
  if (myElement.value) {
    const distanceFromTop = myElement.value.getBoundingClientRect().top + window.scrollY;
    // Assign the distance to a CSS variable
    document.documentElement.style.setProperty(
      "--distance-from-top",
      `${distanceFromTop}px`
    );
  }
};

onBeforeMount(async () => {
  Promise.all([getJK(), getCategories()]);
  updateCSSVar();
  // $("body").addClass("no-scroll");
});
</script>

<style scoped>
@import url("@/assets/css/casino.css");

.x-icon-search::before {
  content: "\e613";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.card-img-top {
  width: 100%;
  height: 105px;
  object-fit: cover;
}

.x-icon-search:before {
  color: #ffffff;
  /* font-size: 1.5rem; */
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
  background-color: #121212;
  min-height: 100vh;
}

.games-container {
  height: 100%;
  width: 100%;
  /* padding: 15px; */
}

.head-top {
  padding: 15px;
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
  background-color: #333;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 15px;
}

.game-provider>span {
  font-size: 15px;
  font-weight: bold;
  border-radius: 10px;
  padding: 0 15px;
  /* border-right: 1px solid white;
  border-bottom: 1px solid white; */

  justify-content: center;
  align-items: center;
  height: 40px;
  /* width: 40px; */
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.head-top .divider {
  margin: 0 10px;
  font-size: 18px;
  border: 0.2px solid white;
  height: 32px;
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
  white-space: nowrap;
  grid-template-columns: repeat(12, 1fr);
  /* Set total items in a single row */
  grid-auto-rows: minmax(100px, auto);
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

.games-container .grid-container::-webkit-scrollbar,
.categories-list::-webkit-scrollbar {
  display: none;
}

.games-container .categories-list .category {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: #b3bec1;
  white-space: nowrap;
  flex: 0 0 auto;
  background-color: #2c2c2c;
  padding: 5px 15px;
}

.games-container .categories-list .category img {
  height: 25px;
  margin-bottom: 5px;
  /* padding-right: 10px; */
}

.games-container .categories-list .category.active {
  display: flex;
  /* flex-direction: column; */
  align-items: center;
  background-color: #494949;
  color: white;
  border-radius: 10px;
  padding: 5px 15px;
  border: 1px solid var(--brand-highlight-text);
}

.error-message {
  color: #ff4444;
  text-align: center;
  padding: 1rem;
  background-color: rgba(255, 68, 68, 0.1);
  border-radius: 4px;
  margin: 1rem 15px;
}
</style>
