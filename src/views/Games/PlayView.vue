<template>
  <div class="game-play">
    <HeaderCasinoPlay></HeaderCasinoPlay>
    <LoadingSpinner v-if="isLoading"></LoadingSpinner>
    <iframe
      v-if="!isLoading"
      title="casino"
      style="border-style: none; width: 100%; height: calc(100% - 60px)"
      :src="gameURL"
    />
  </div>
</template>

<script setup>
import { watch, ref, onMounted } from "vue";
import { getCasinoStartUrl } from "@/helpers";
import { useRoute, useRouter, onBeforeRouteLeave } from "vue-router";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { useUsersStore } from "@/stores";
import emitter from "@/plugins/emitter";
import HeaderCasinoPlay from "../../components/HeaderCasinoPlay.vue";
import { VueToggles } from "vue-toggles";

const route = useRoute();
const router = useRouter();
const gameURL = ref("");
const isLoading = ref(false);
const { currentUser } = useUsersStore();
const realPlayMode = ref(false);

async function getCasinoURL() {
  isLoading.value = true;
  const game_id = parseInt(route.params.game_id);
  let data = realPlayMode.value ? "real" : "demo";
  const payload = {
    gameId: game_id,
    username: currentUser?.username || "guest",
    userId: currentUser?.id || 0,
    demo: realPlayMode.value,
    isMobile: true,
    homeUrl: import.meta.env.VITE_SITE_URL,
    authCode: currentUser?.authCode || "demo",
    balanceType: realPlayMode.value ? "real" : "demo",
  };
  const res = await getCasinoStartUrl(payload, data);
  isLoading.value = false;
  gameURL.value = res.url;
}

onMounted(() => {
  getCasinoURL();
});

onBeforeRouteLeave((to, from) => {
  const answer = window.confirm("Do you really want to leave? you have unsaved changes!");
  // cancel the navigation and stay on the same page
  if (!answer) return false;
});
</script>

<style scoped>
.game-play {
  background-color: black;
  height: 100vh;
  position: relative;
}
</style>
