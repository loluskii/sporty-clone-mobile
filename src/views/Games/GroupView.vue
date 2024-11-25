<template>
  <div class="casino">
    <HeaderOther :headerTitle="viewHeaderTitle" />
    <div class="carousel">
      <Carousel></Carousel>
    </div>
    <div class="games-container">
      <Providers v-if="viewMode === 'providers'" :providers="providers" />
      <GameByCategory
        v-if="viewMode === 'category'"
        :games="gamesList"
        :titleText="categoryName"
      />
      <!-- <div v-else-if="!isLoading && !gamesList.length" class="no-data">
          <div style="white-space: pre-line">
            Sorry, there are no games currently<br />available in this category. Please try later.<br />Thank
            you.
          </div>
        </div> -->
      <!-- <LoadingSpinner v-else></LoadingSpinner> -->
    </div>
  </div>
</template>

<script setup>
import HeaderOther from "@/components/HeaderOther.vue";
import GameByCategory from "@/components/Casino/GameByCategory.vue";
import Providers from "../../components/Casino/Providers.vue";
import Carousel from "@/components/Home/Carousel.vue";
import { ref, onBeforeMount, watch, computed } from "vue";
import { getTopGameCategories, gamesByTopCategory, getProviders } from "@/helpers";
import { useAuthStore } from "@/stores";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { slugify } from "../../helpers";
import emitter from "@/plugins/emitter";
import $ from "jquery";
import { useRouter, useRoute } from "vue-router";

const topGameCategoriefes = ref([]);
const activeTopCategory = ref("all");
const activeGroup = ref("category");
const scrollComponent = ref(null);
const authStore = useAuthStore();
const isLoading = ref(true);
const route = useRoute();
const router = useRouter();
const viewMode = ref(null);
const viewHeaderTitle = ref("Providers");
const providers = ref([]);
const gamesList = ref([]);
const categoryName = ref(null);

// const filterQuery = ref()

const activeSport = computed(() => {
  return utilsStore.activeSport;
});

watch(
  () => [route.name, route.params.category, route.query.category_id],
  async ([routeName, categoryName, gameCategoryId]) => {
    // Check the route name
    switch (routeName) {
      case "casino-providers":
        handleProvidersView();
        break;
      case "games-by-category":
        handleGamesByCategoryView(categoryName, gameCategoryId);
        break;
      default:
        // Handle other routes or provide a default behavior
        break;
    }
  },
  { immediate: true } // Trigger the watch callback immediately on component mount
);

async function handleProvidersView() {
  viewMode.value = "providers";
  viewHeaderTitle.value = "Providers";
  const res = await getProviders();
  providers.value = res.data;
}

async function handleGamesByCategoryView(name, id) {
  viewMode.value = "category";
  viewHeaderTitle.value = name;
  categoryName.value = name;
  const res = await gamesByTopCategory(id);
  gamesList.value = res.games ? res.games : [];
}

const getImagePath = (game) => {
  return `https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/casino%2F${game.title}.png?alt=media`;
};

async function redirectToGamePlay(game) {
  emitter.emit("showCasinoDialog");
  return router.push({
    name: "game-play",
    params: { game_name: slugify(game.title), game_id: game.id },
  });
}

onBeforeMount(async () => {
  //   await getCategories();
});
</script>

<style scoped>
@import url("https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css");
@import url("https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css");

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
  padding: 15px;
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
.game-provider {
  margin-top: 10px;
  padding: 10px;
  font-size: 2.8vw;
  border-radius: 10px;
  border: 1px solid var(--brand-secondary);
  background-color: #333;
  color: #fff;
  text-align: center;
  margin-left: 10px;
  height: 40px;
  /* width: 40px; */
  display: flex;
  align-items: center;
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
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  padding: 20px 0px 0px;
}

.games-container .categories-list {
  display: flex;
  padding-top: 10px;
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
  padding: 10px 25px;
  font-size: 3vw;
  font-weight: bold;
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
</style>
