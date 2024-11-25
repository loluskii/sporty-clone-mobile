<template>
  <div class="casino">
    <HeaderCasino></HeaderCasino>
    <div class="carousel">
      <Carousel></Carousel>
    </div>
    <div class="games-container">
      <div class="head-top d-flex align-items-center">
        <div class="game-provider" @click="$router.push({ name: 'casino-providers' })">
          <span class="">Providers</span>
        </div>
        <div class="divider"></div>
        <div class="categories-list">
          <template v-for="(top, index) in topGameCategories" :key="index">
            <div
              class="category"
              :class="activeTopCategory?.id == top.id ? 'active' : ''"
              @click="getGameByTopCategory(top)"
              v-if="top.slug !== 'all'"
            >
              <span>{{ top.name }}</span>
            </div>
          </template>
        </div>
      </div>
      <div v-if="!isLoading" ref="myElement" class="games-grid mt-3">
        <div v-if="currentView === 'grouped_category'" class="grouped-games-section">
          <template v-for="(top, index) in topGameCategories" :key="index">
            <div class="group" v-if="top.slug !== 'all'">
              <div class="header d-flex justify-content-between align-items-center">
                <h1 class="card-title text-white fw-normal fs-4">{{ top.name }}</h1>
                <span
                  class="text-decoration-none text-uppercase"
                  style="color: var(--brand-secondary)"
                  @click="
                    $router.push({
                      name: 'games-by-category',
                      params: { category: slugify(top.name) },
                      query: { category_id: top.id },
                    })
                  "
                  >See All
                </span>
              </div>
              <template v-if="top.games.length && !top.isLoading">
                <div class="grid-container mb-3 pb-3" ref="scrollComponent">
                  <div
                    class="card bg-dark rounded-3"
                    style="width: 150px"
                    @click="redirectToGamePlay(game)"
                    v-for="(game, index) in top.games"
                    :key="index"
                  >
                    <img
                      :src="getImagePath(game)"
                      class="card-img-top"
                      alt="..."
                      @error="handleImageError($event, game)"
                    />
                    <div
                      class="card-body d-flex align-items-center justify-content-center p-2"
                    >
                      <span class="text-truncate text-white" style="max-width: 150px">
                        {{ game.title }}
                      </span>
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
                <div
                  class="card bg-dark rounded-3 mb-3"
                  @click="redirectToGamePlay(game)"
                >
                  <img
                    :src="getImagePath(game)"
                    class="card-img-top"
                    alt="..."
                    @error="handleImageError($event, game)"
                  />
                  <div
                    class="card-body d-flex align-items-center justify-content-center p-2"
                  >
                    <span class="text-truncate text-white" style="max-width: 150px">
                      {{ game.title }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="!isLoading && !gamesList.length" class="no-data">
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
  </div>
</template>

<script setup>
import HeaderCasino from "@/components/HeaderCasino.vue";
import Carousel from "@/components/Home/Carousel.vue";
import { ref, onBeforeMount, computed } from "vue";
import { getTopGameCategories, gamesByTopCategory } from "@/helpers";
import router from "@/router";
import { useAuthStore } from "@/stores";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { slugify } from "../../helpers";
import emitter from "@/plugins/emitter";
import $ from "jquery";
import Providers from "@/components/Casino/Providers.vue";

const topGameCategories = ref([]);
const gamesList = ref([]);
const activeTopCategory = ref(null);
const scrollComponent = ref(null);
const authStore = useAuthStore();
const isLoading = ref(true);
const myElement = ref(null);
const currentView = ref("grouped_category");
const providers = ref([]);

async function getCategories() {
  try {
    const response = await getTopGameCategories();
    isLoading.value = false;
    const categories = response.data;
    for (const category of categories) {
      topGameCategories.value.push({
        ...category,
        games: [],
        isLoading: true,
        hasError: false, // Track errors for individual categories
      });
    }

    // Fetch games for each category
    await Promise.all(
      topGameCategories.value.map(async (category) => {
        if (category.slug !== "all") {
          try {
            const gamesResponse = await gamesByTopCategory(category.id); // Replace `id` with the appropriate field
            category.games = gamesResponse.games ? gamesResponse.games.slice(0, 12) : [];
          } catch (error) {
            console.error(`Error fetching games for category ${category.name}:`, error);
            category.hasError = true; // Set error state for this category
          } finally {
            category.isLoading = false; // Ensure loading state is updated
          }
        } else {
          category.isLoading = false; // Skip fetching for the "all" category
        }
      })
    );
  } catch (error) {
    console.error("Error fetching categories or games:", error);
  } finally {
    isLoading.value = false;
  }
}

async function getGameByTopCategory(category) {
  isLoading.value = true;
  currentView.value = "single_category";
  activeTopCategory.value = category;
  const res = await gamesByTopCategory(category.id);
  isLoading.value = false;
  gamesList.value = res.games ? res.games : [];
}

const getImagePath = (game) => {
  return `https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/casino%2F${game.title}.png?alt=media`;
};
const handleImageError = (event, game) => {
  // Replace the failed image with a placeholder
  let name = encodeURIComponent(game.title);
  event.target.src = `https://placehold.co/..150x175?text=${name}`; // Specify your placeholder image path
  event.target.alt = `${game.title}`;
};

async function redirectToGamePlay(game) {
  emitter.emit("showCasinoDialog");
  return router.push({
    name: "game-play",
    params: { game_name: slugify(game.title), game_id: game.id },
  });
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
  await getCategories();
  updateCSSVar();
  $("body").addClass("no-scroll");
});
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css");
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

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
  height: 175px;
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
  background-color: #000;
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
  max-height: calc(100vh - var(--distance-from-top));
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
.head-top .game-provider {
  padding: 10px;
  font-size: 18px;
  font-weight: bold;
  /* border-radius: 10px; */
  /* border-right: 1px solid white; */
  /* background-color: #333; */
  color: #fff;
  text-align: center;
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
  margin-top: 10px;
  padding: 10px;
  font-size: 2.8vw;
  border-radius: 10px;
  border: 1px solid #333;
  color: #fff;
  text-align: center;
  margin-left: 10px;
  height: 40px;
  width: 40px;
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
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  padding: 20px 0px 0px;
}

.games-container .categories-list {
  display: flex;
  overflow: auto;
  margin-right: 10px;
}

.games-container .categories-list::-webkit-scrollbar {
  display: none;
}

.games-container .categories-list .category {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 15px;
  font-size: 14px;
  /* font-weight: bold; */
  border-radius: 10px;
  /* border: 1px solid #333; */
  margin-right: 5px;
  color: #b3bec1;
  white-space: nowrap;
  height: 40px;
}

.games-container .categories-list .category.active {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #333;
  color: white;
  border-radius: 10px;
}

.games-container .categories-list .category img {
  height: 30px;
  width: 100%;
  object-fit: cover;
}

.sg-confirm-cancel-modal-container-v2 .modal-dialog .modal-footer .btn.btn-primary {
  background-color: #0f9737;
  border: 1px solid #0f9737;
  border-color: #0f9737;
  color: #fff;
  -webkit-box-flex: 2;
  -ms-flex: 2;
  flex: 2;
}

.sg-confirm-cancel-modal-container-v2 .modal-dialog .modal-footer .btn.btn-secondary {
  background-color: #333;
  border-color: #333;
  color: #fff;
  -webkit-box-flex: 1;
  -ms-flex: 1;
  flex: 1;
}
</style>
