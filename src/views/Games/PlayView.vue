<template>
  <div class="game-play">
    <HeaderCasinoPlay></HeaderCasinoPlay>
    <LoadingSpinner v-if="isLoading"></LoadingSpinner>
    <!-- <iframe
      v-if="!isLoading"
      title="casino"
      style="border-style: none; width: 100%; height: calc(100% - 60px)"
      :src="gameURL"
    /> -->
    <div class="recommended-games">
      <!-- Leave Confirmation Popup -->
      <leaveCasinoPopup
        :show-popup="showRecommendedGames"
        @exit="exitGame"
        @continue="showRecommendedGames = false"
        :games-list="gamesList"
      />
    </div>
  </div>
</template>

<script setup>
import { watch, ref, onMounted, onBeforeMount } from "vue";
import { getCasinoStartUrl, getGames } from "@/helpers";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { useUsersStore } from "@/stores";
import emitter from "@/plugins/emitter";
import HeaderCasinoPlay from "../../components/HeaderCasinoPlay.vue";
import leaveCasinoPopup from "../../components/Casino/leaveCasinoPopup.vue";

const route = useRoute();
const router = useRouter();
const gameURL = ref("");
const isLoading = ref(false);
const { currentUser } = useUsersStore();
const showRecommendedGames = ref(false);
const gamesList = ref([]);
const confirmLeave = ref(null);

async function getCasinoURL() {
  isLoading.value = true;
  const game_id = parseInt(route.params.game_id);
  let data = "real";
  const payload = {
    gameId: game_id,
    username: currentUser?.username,
    userId: currentUser?.id,
    demo: false,
    isMobile: true,
    homeUrl: import.meta.env.VITE_SITE_URL,
    authCode: currentUser?.authCode,
    balanceType: "real",
  };
  const res = await getCasinoStartUrl(payload, data);
  isLoading.value = false;
  gameURL.value = res.url;
}

async function getRecommendedGames() {
  const res = await getGames();
  gamesList.value = res.games.slice(0, 10);
}

const exitGame = () => {
  return router.push({ name: "casino-games" });
};

onMounted(async () => {
  await getCasinoURL();
});

onBeforeMount(async () => {
  await getRecommendedGames();
});

onBeforeRouteLeave((to, from, next) => {
  if (showRecommendedGames.value) {
    next();
  } else {
    showRecommendedGames.value = true;
  }
});
</script>

<style scoped>
.game-play {
  background-color: black;
  height: 100vh;
  position: relative;
}
</style>
