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
import { useRoute } from "vue-router";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { useUsersStore } from "@/stores";
import emitter from "@/plugins/emitter";

const route = useRoute();
const gameURL = ref("");
const isLoading = ref(false);
const { currentUser } = useUsersStore();

async function getCasinoURL() {
  isLoading.value = true;
  const game_id = parseInt(route.params.game_id);
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
  const res = await getCasinoStartUrl(payload);
  isLoading.value = false;
  gameURL.value = res.url;
}

onMounted(async () => {
  await getCasinoURL()
});
</script>

<style>
.game-play {
  background-color: black;
  min-height: 100vh;
}
</style>
