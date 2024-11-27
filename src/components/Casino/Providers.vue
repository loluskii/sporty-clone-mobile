<template>
  <div class="container">
    <div class="title-bg">
      <h3 class="h3 text-white fw-bold">{{ titleText }}</h3>
    </div>
    <div class="row mt-4">
      <div class="col-12 mb-3" v-for="provider in providers" :key="provider.id">
        <div
          class="provider-card"
          @click="
            $router.push({
              name: 'games-by-provider',
              params: { provider: slugify(provider.name) },
              query: { providerId: provider.id },
            })
          "
        >
          <div class="card rounded-0 border-0">
            <div class="card-body p-2">
              <img
                :src="getImageSrc(provider.slug)"
                class="mr-3"
                alt=""
                srcset=""
                height="25"
              />
              <span class="provider-name">{{ provider.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeMount, watch, computed } from "vue";
import { getTopGameCategories, gamesByTopCategory } from "@/helpers";
import { useAuthStore } from "@/stores";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { slugify } from "../../helpers";
import emitter from "@/plugins/emitter";
import $ from "jquery";
import { useRouter, useRoute } from "vue-router";

const props = defineProps(["providers"]);

const gamesList = ref([]);
const activeTopCategory = ref("all");
const isLoading = ref(true);
const route = useRoute();
const router = useRouter();
const viewMode = ref("providers");
const titleText = ref("Providers");

const getImageSrc = (prov) => {
  const imageUrl = new URL(
    `../../assets/images/casino/providers/${prov}.svg`,
    import.meta.url
  );
  return imageUrl;
};

watch(
  () => [route.name],
  async ([routeName]) => {
    // Check the route name
    switch (routeName) {
      case "casino-providers":
        handleProvidersView();
      default:
        // Handle other routes or provide a default behavior
        break;
    }
  },
  { immediate: true } // Trigger the watch callback immediately on component mount
);

function handleProvidersView() {
  viewMode.value = "providers";
}
async function getCategories() {
  const response = await getTopGameCategories();
  //   topGameCategories.value = response.data;
  //   await getGameByTopCategory(topGameCategories.value[0]);
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
  emitter.emit("showCasinoDialog");
  return router.push({
    name: "game-play",
    params: { game_name: slugify(game.title), game_id: game.id },
  });
}

onBeforeMount(async () => {
  await getCategories();
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
  color: #9ca0ab;
  background-image: url(/ornament-title.svg);
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
.provider-card {
  border: 1px solid #333;
}
.provider-card .card {
  background-color: #121212;
  margin: 8px;
  border: 1px solid #333;
}

.provider-card .provider-name {
  color: whitesmoke;
  font-size: 14px;
}
</style>
