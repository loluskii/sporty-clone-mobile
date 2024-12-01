<template>
  <div>
    <!-- Modal for Leave Confirmation -->
    <div
      v-if="showPopup"
      class="modal fade show d-block"
      tabindex="-1"
      aria-modal="true"
      role="dialog"
      style="background: rgba(0, 0, 0, 0.5)"
    >
      <div class="modal-dialog modal-sm m-0 h-100">
        <div class="modal-content position-absolute bottom-0">
          <div class="modal-body text-center">
            <!-- Confirmation Message -->
            <p class="mb-0 fw-bold" style="font-size: 16px">You may also like these games...</p>
            <!-- Carousel -->
            <div class="game-carousel">
              <div class="game-carousel-inner">
                <div v-for="game in gamesList" :key="game.id" class="game-carousel-item">
                  <img :src="game.imagePath" class="game-image" :alt="game.name" />
                  <div class="game-caption bg-dark text-white">
                    <h5 class="mb-0">{{ game.title }}</h5>
                  </div>
                </div>
              </div>
            </div>
            <!-- Buttons -->
          </div>
          <div class="d-flex justify-content-between">
            <button
              class="btn btn-lg btn-secondary w-25 py-3 rounded-0"
              @click="exitGame"
            >
              Exit
            </button>
            <button
              class="btn btn-lg fw-bold w-75 py-3 rounded-0 text-white"
              style="background-color: var(--brand-secondary)"
              @click="continueGame"
            >
              Stay
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps(["showPopup", "gamesList"]);
const emit = defineEmits(["exit", "continue"]);

const getImagePath = (game) => {
  return `https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/casino%2F${game.title}.png?alt=media`;
};

function exitGame() {
  emit("exit");
}

function continueGame() {
  emit("continue");
}
</script>
<style scoped>
@import url("@/assets/css/casino.css");
body {
  font-family: Arial, Helvetica, sans-serif !important;
}
.modal-content {
  border-radius: 0px;
  bottom: 0;
}
.carousel-item img {
  height: 150px;
  object-fit: cover;
}

.game-carousel {
  display: flex;
  overflow-x: scroll;
  scroll-snap-type: x mandatory;
  padding: 10px 0;
}

/* Inner items container */
.game-carousel-inner {
  display: flex;
  gap: 15px;
}

/* Individual carousel items */
.game-carousel-item {
  flex: 0 0 auto;
  scroll-snap-align: start;
  text-align: center;
  width: 150px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f9f9f9;
}

/* Game image */
.game-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Game caption */
.game-caption {
  padding: 8px;
  font-size: 14px;
  font-weight: bold;
}
</style>
