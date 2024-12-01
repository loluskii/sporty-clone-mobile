<template>
  <div class="title-bg">
    <span @click="$router.go(-1)" class="m-icon m-icon--back mr-3"></span>

    <h3 class="h4 text-white fw-bold">
      <img
        :src="getProviderLogo()"
        alt=""
        height="25"
        srcset=""
        v-if="type === 'provider'"
      />
      {{ titleText }}
    </h3>
  </div>

  <CategoryProvider />
  <div class="games-container" ref="myElement">
    <div class="games-grid mt-3">
      <div class="row mb-3 pb-3" style="overflow-x: hidden">
        <div class="col-6 mb-3" v-for="(game, index) in props.games" :key="index">
          <div
            class="card bg-dark rounded-3"
            style="min-width: 150px"
            @click="redirectToGamePlay(game)"
          >
            <img
              :src="getImagePath(game)"
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
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderOther from "@/components/HeaderOther.vue";
import Carousel from "@/components/Home/Carousel.vue";
import { ref, onMounted, computed } from "vue";
import router from "@/router";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { slugify } from "../../helpers";
import emitter from "@/plugins/emitter";
import CategoryProvider from "./CategoryProvider.vue";
import $ from "jquery";

const props = defineProps(["games", "titleText", "type"]);

const scrollComponent = ref(null);
const isLoading = ref(false);
const myElement = ref(null);
const currentView = ref("providers");

const getProviderLogo = () => {
  let prov = props.titleText.toLowerCase().replace(/ /g, "-");
  const imageUrl = new URL(
    `../../assets/images/casino/providers/${prov}.svg`,
    import.meta.url
  );
  return imageUrl;
};

const getImagePath = (game) => {
  return `https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/casino%2F${game.title}.png?alt=media`;
};
const handleImageError = (event, game) => {
  // Replace the failed image with a placeholder
  let name = encodeURIComponent(game.title);
  event.target.src = `https://placehold.co/150x175?text=${name}`; // Specify your placeholder image path
  event.target.alt = `${game.title}`;
};

async function redirectToGamePlay(game) {
  emitter.emit("showCasinoDialog");
  return router.push({
    name: "game-play",
    params: { game_name: slugify(game.title), game_id: game.id },
  });
}

const updateCSSVar = () => {
  console.log(myElement.value);
  if (myElement.value) {
    const distanceFromTop =
      myElement.value.getBoundingClientRect().top + document.documentElement.scrollTop;
    // Assign the distance to a CSS variable
    document.documentElement.style.setProperty(
      "--distance-from-top",
      `${distanceFromTop}px`
    );
  } else {
    console.log("sdfsdf");
  }
};

onMounted(() => {
  updateCSSVar();
  document.body.classList.add("no-scroll");
});
</script>

<style scoped>
@import url("@/assets/css/casino.css");
.m-icon {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  color: #ffffff;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
  /* margin-right: 1.58333333rem; */
}
.m-icon :before {
  font-size: 1.33333333rem !important;
}
.m-icon.m-icon--back::before {
  content: "\e620";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.title-bg {
  font-size: 20px;
  /* line-height: 1.4; */
  font-weight: 500;
  width: 100%;
  position: relative;
  display: flex;
  align-items: center;
  /* justify-content: center; */
  text-transform: uppercase;
  /* text-align: center; */
  font-family: var(--stb-font-helper);
  color: rgb(var(--stb-white-1000));
  /* padding: 22px 0; */
  /* min-height: 80px; */
  z-index: 1;
}

.card-img-top {
  width: 100%;
  height: 175px;
  object-fit: cover;
}

.x-icon-search:before {
  color: #ffffff;
  /* font-size: 1.5rem; */
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
  overflow-x: hidden;
  /* padding: 15px; */
}

.head-top {
  padding: 15px 0;
}

.game-group {
  background-color: #373737;
  border-radius: 10px;
  margin: 10px 15px 0px;
}

.games-grid {
  height: 100%;
  max-height: calc(100vh - (var(--distance-from-top) + 50px));
  /* overflow: scroll !important; */
  width: 100%;
  /* padding: 0 15px; */
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

.games-container .categories-list .category img {
  height: 30px;
  width: 100%;
  object-fit: cover;
}
</style>
