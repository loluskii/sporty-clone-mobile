<template>
  <div class="game-play">
    <LoadingSpinner v-if="isLoading"></LoadingSpinner>
    <iframe
      v-if="!isLoading"
      title="casino"
      style="border-style: none; width: 100%; height: 100vh; overflow: scroll"
      :src="gameURL"
    />
  </div>
</template>

<script setup>
import { watch, ref, onMounted } from "vue";
import { getCasinoStartUrl } from "@/helpers";
import { useRoute, onBeforeRouteLeave } from "vue-router";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { useUsersStore } from "@/stores";
import emitter from "@/plugins/emitter";

const route = useRoute();
const gameURL = ref("");
const isLoading = ref(false);
const { currentUser } = useUsersStore();

async function getCasinoURL(data) {
  isLoading.value = true;
  const game_id = parseInt(route.params.game_id);
  const payload = {
    gameId: game_id,
    username: currentUser?.username || "guest",
    userId: currentUser?.id || 0,
    demo: !!currentUser && data !== "demo" ? false : !!currentUser && data === "demo",
    isMobile: true,
    homeUrl: import.meta.env.VITE_SITE_URL,
    authCode: currentUser?.authCode || "demo",
    balance_type: data,
  };
  const res = await getCasinoStartUrl(payload, data);
  isLoading.value = false;
  gameURL.value = res.url;
}

onMounted(() => {
  emitter.on("setBalanceType", getCasinoURL);
});

onBeforeRouteLeave((to, from) => {
  const answer = window.confirm("Do you really want to leave? you have unsaved changes!");
  // cancel the navigation and stay on the same page
  if (!answer) return false;
});
</script>

<style>
.game-play {
  background-color: black;
  min-height: 100vh;
}
</style>
