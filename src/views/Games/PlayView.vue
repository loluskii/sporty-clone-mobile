<template>
  <div class="game-play">
    <HeaderCasinoPlay @open-leave-modal="showRecommendedGames = true"></HeaderCasinoPlay>
    <LoadingSpinner v-if="isLoading"></LoadingSpinner>
    <iframe
      v-if="!isLoading"
      title="casino"
      style="border-style: none; width: 100%; height: calc(100% - 60px)"
      :src="gameURL"
    />
    <div class="recommended-games">
      <!-- Leave Confirmation Popup -->
      <leaveCasinoPopup
        :show-popup="showRecommendedGames"
        @exit="exitGame"
        @continue="showRecommendedGames = false"
        :games-list="gamesList"
        @select-game="moveToNewGame"
      />
    </div>
  </div>
</template>

<script setup>
import { watch, ref, onMounted, onBeforeMount, computed } from "vue";
import { getCasinoStartUrl, getGames, slugify, getSmatVirtualStartUrl } from "@/helpers";
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
const usersStore = useUsersStore();
const showRecommendedGames = ref(false);
const gamesList = ref([]);
const confirmLeave = ref(null);
const bonus = ref(null)

// watch(
//   () => [route.params.game_id],
//   async ([game_id]) => {
//     await getCasinoURL()
//   },
//   { immediate: true } 
// )

async function getCasinoURL() {
  try {
    isLoading.value = true;
    let data = "real";
    let res;
    let payload = {
      gameId: parseInt(route.params.game_id),
      clientId: import.meta.env.VITE_CLIENT_ID,
      username: currentUser?.username,
      userId: currentUser?.id,
      demo: false,
      isMobile: true,
      homeUrl: import.meta.env.VITE_SITE_URL,
      authCode: currentUser?.authCode,
      balanceType: "real",
    };

    if(route.query.bonusId && route.query.balanceType === "bonus"){
      payload.isBonus = true
      payload.bonusType = route.query.bonusType
      payload.bonusId = route.query.bonusId
      payload.balanceType = "bonus"
      res = await getCasinoStartUrl(payload, data);
    }else if(route.params.game_id === 'smat_virtual'){
      res = await getSmatVirtualStartUrl({clientId: import.meta.env.VITE_CLIENT_ID, userId: currentUser?.id, token: currentUser?.authCode})
    }
    isLoading.value = false;
    gameURL.value = res.url;
  } catch (error) {
    alert(error);
    isLoading.value = false;
  }
}

async function moveToNewGame(game){
  if(route.params.game_id !== 'smat_virtual'){
    showRecommendedGames.value = false
    return router.push({
        name: "game-play",
        params: { game_name: slugify(game.title), game_id: game.id },
      });
  }
}

async function getRecommendedGames() {
  const res = await getGames();
  let recommended = res.games.filter((g) => g.id.toString() !== route.params.game_id)
  gamesList.value = recommended.slice(0, 10);
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
