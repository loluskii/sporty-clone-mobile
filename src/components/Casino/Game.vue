<template>
  <div class="card bg-dark rounded-3 mb-3" style="min-width: 150px" @click="redirectToGamePlay">
    <img
      :src="getImagePath()"
      class="card-img-top"
      alt="..."
      @error="handleImageError($event, game)"
    />
    <div class="card-body d-flex align-items-center justify-content-center p-2">
      <span class="text-truncate text-white" style="max-width: 150px">
        {{ game.title }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore, useUsersStore } from "@/stores";
import {computed} from "vue"
import {slugify} from "@/helpers"
const props = defineProps(["game"])
const authStore = useAuthStore();
const userStore = useUsersStore();

const activeBonus = computed(() => {
  return userStore.casinoActiveBonus;
});
const getImagePath = () => {
  // https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/Casino2%2Fhouseofdoom2thecrypt.png?alt=media
  return `https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/Casino2%2F${props.game.title.replace(/\s/g, '').toLowerCase()}.png?alt=media`;
};

const handleImageError = (event) => {
  // Replace the failed image with a placeholder
  let name = encodeURIComponent(props.game.title);
  event.target.src = `https://placehold.co/150x175?text=${name}`; // Specify your placeholder image path
  event.target.alt = `${props.game.title}`;
};

async function redirectToGamePlay() {
  if (userStore.currentUser) {
    const bonusGameIds = activeBonus.value.gameId;
    if (bonusGameIds.includes(props.game.gameId)) {
      emitter.emit("showCasinoDialog", { bonus: activeBonus.value, game: props.game });
    } else {
      return router.push({
        name: "game-play",
        params: { game_name: slugify(props.game.title), game_id: props.game.gameId },
      });
    }
  } else {
    authStore.returnUrl = "/Games";
    return router.push({ name: "sign-in" });
  }
}
</script>

<style scoped>
@import url("@/assets/css/casino.css");
.card-img-top {
  width: 100%;
  height: 105px;
  object-fit: cover;
}
</style>