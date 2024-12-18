<template>
  <div class="casino">
    <HeaderCasino></HeaderCasino>
    <div class="carousel">
      <Carousel></Carousel>
    </div>
    <div class="games-container">
      <div class="categories-list">
        <div
          class="category"
          :class="activeTopCategory.id == top.id ? 'active' : ''"
          v-for="(top, index) in topGameCategories"
          :key="index"
          @click="getGameByTopCategory(top)"
        >
          <span>{{ top.name }}</span>
        </div>
      </div>
      <div v-if="!isLoading && gamesList.length" class="games-grid">
        <div class="grid-container" ref="scrollComponent">
          <template v-for="(game, index) in gamesList" :key="index">
            <div
              v-if="game.status && game.gameId !== null"
              @click="redirectToGamePlay(game)"
              class="grid-item"
            >
              <img :src="getImagePath(game)" loading="lazy" alt="" srcset="" />
              <div class="grid-item-footer">
                {{ game.title }}
              </div>
            </div>
          </template>
        </div>
      </div>
      <div v-else-if="!isLoading && !gamesList.length" class="no-data">
        <div style="white-space: pre-line">
          Sorry, there are no games currently<br />available in this category. Please try
          later.<br />Thank you.
        </div>
      </div>
      <LoadingSpinner v-else></LoadingSpinner>
    </div>
  </div>
</template>

<script setup>
import HeaderCasino from "@/components/HeaderCasino.vue";
import Carousel from "@/components/Home/Carousel.vue";
import { ref, onBeforeMount } from "vue";
import { getTopGameCategories, gamesByTopCategory } from "@/helpers";
import { useAuthStore } from "@/stores";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { slugify } from "../../helpers";
import { useRouter } from "vue-router";

const router = useRouter();
const topGameCategories = ref([]);
const gamesList = ref([]);
const activeTopCategory = ref("all");
const scrollComponent = ref(null);
const authStore = useAuthStore();
const isLoading = ref(true);

async function getCategories() {
  const response = await getTopGameCategories();
  topGameCategories.value = response.data;
  await getGameByTopCategory(topGameCategories.value[0]);
}

async function getGameByTopCategory(category) {
  isLoading.value = true;
  activeTopCategory.value = category;
  const res = await gamesByTopCategory(category.id);
  isLoading.value = false;
  gamesList.value = res.games ? res.games : [];
}

const getImagePath = (game) => {
  return `https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/casino%2F${game.title}.png?alt=media`;
};

async function redirectToGamePlay(game) {
  // emitter.emit('showCasinoDialog')
  if (authStore.token) {
    return router.push({
      name: "game-play",
      params: { game_name: slugify(game.title), game_id: game.id },
    });
  } else {
    return router.push("/sign-in");
  }
}

onBeforeMount(async () => {
  await getCategories();
});
</script>

<style scoped>
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

.games-container .grid-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* Two equal-width columns */
  gap: 10px; /* Adjust the gap between columns */
  padding: 20px;
}

.games-container .categories-list {
  display: flex;
  padding: 10px 20px 0 20px;
  overflow: auto;
}

.games-container .categories-list::-webkit-scrollbar {
  display: none;
}

.games-container .categories-list .category {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 25px;
  font-size: 2.6vw;
  border-radius: 10px;
  border: 1px solid #333;
  margin-left: 5px;
  margin-right: 5px;
  color: #fff;
  white-space: nowrap;
}

.games-container .categories-list .category.active {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--brand-secondary);
  border-radius: 10px;
}

.games-container .categories-list .category img {
  height: 30px;
  width: 100%;
  object-fit: cover;
}

.grid-item {
  position: relative;
  border: 1px solid #2a2a2a;
  /* padding: 20px 0; */
  text-align: center;
  border-radius: 7px;
  min-height: 150px;
  display: flex;
  flex-direction: column;
}

.grid-item img {
  height: 100%;
  width: 100%;
  object-fit: cover;
}

.grid-item-footer {
  /* position: absolute;
  bottom: 0; */
  width: 100%;
  background-color: #2a2a2a;
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
  padding: 10px 0;
  color: #fff;
  /* white-space: nowrap; */
  text-overflow: ellipsis;
  font-size: 14px;
}

button.btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 25px;
  font-size: 2.6vw;
  border-radius: 10px;
  /* border: non; */
  margin: 15px 5px;
  color: #fff;
  white-space: nowrap;
  background-color: var(--brand-primary);
}
</style>
