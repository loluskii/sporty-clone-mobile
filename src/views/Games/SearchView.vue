<template>
  <div class="casino">
    <HeaderCasino></HeaderCasino>
    <div class="carousel">
      <Carousel></Carousel>
    </div>
    <div ref="myElement" class="game-search">
      <div class="row no-gutters">
        <div class="search-input col-12">
          <input
            type="text"
            placeholder="Search for your favourite game"
            autocomplete="off"
            class="search-box form-control"
            maxlength="40"
            v-model="searchQuery"
            @input="handleInput"
          /><span @click="clearSearch" class="search-close-button-wrapper"
            ><img
              src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAOCAYAAAD0f5bSAAAAhElEQVQoFZ1SQQ6AIAwjJnxPP+FJP+YPPWILbiFsQWTJkrG2o4SFMBsppR259vTEycscFBF5IxmHJ2Q/o4UXRShNI6wEBgse6PWMk4Z0cfQbrm0dAFJtlRojWJQ9WzS3fNtrBNmS11NDPRDYiZQo78Np5HNFyCXQzx1Zow2Cskbq8UfxAP/IEeGkBhwFAAAAAElFTkSuQmCC"
              class="search-close-button"
          /></span>
        </div>
      </div>

      <LoadingSpinner v-if="isSearching" />

      <div class="scroll-search-area">
        <div v-if="searchEmtpyResult" class="mt-2 not-found">
          <div class="row d-flex justify-content-center m-2 no-gutters">
            <div
              class="text-center col-12"
              data-cms-key="search_no_match"
              data-cms-page="sg_lobby"
            >
              Sorry! No game found.
            </div>
          </div>
        </div>
        <div v-else-if="searchResult.length" class="search-game-list">
          <div class="row no-gutters">
            <div
              class="mx-3 suggestion-text col-12"
              data-cms-key="search_found_single"
              data-cms-page="sg_lobby"
            >
              {{ searchResult.length }} result{{
                searchResult.length > 1 ? "s" : ""
              }}
              found
            </div>
            <div class="row mb-3 pb-3" ref="scrollComponent">
              <div
                class="col-6"
                v-for="(game, index) in searchResult"
                :key="index"
              >
                <Game :game="game" />
              </div>
            </div>
            <div class="divider mx-3 col-12">
              <hr />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderCasino from "@/components/HeaderCasino.vue";
import Carousel from "@/components/Home/Carousel.vue";
import { ref, onBeforeMount, watch, nextTick, computed } from "vue";
import {
  getTopGameCategories,
  gamesByTopCategory,
  getGamesBySearch,
  debounce,
} from "@/helpers";
import router from "@/router";
import { useAuthStore } from "@/stores";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { slugify } from "../../helpers";
import emitter from "@/plugins/emitter";
import $ from "jquery";
import Game from "@/components/Casino/Game.vue";

const topGameCategories = ref([]);
const gamesList = ref([]);
const activeTopCategory = ref("all");
const scrollComponent = ref(null);
const authStore = useAuthStore();
const isLoading = ref(true);
const isSearchMode = ref(false);
const isSearching = ref(false);
const searchQuery = ref("");
const myElement = ref(null);
const searchResult = ref([]);

async function getCategories() {
  const response = await getTopGameCategories();
  topGameCategories.value = response.data;
  await getGameByTopCategory(topGameCategories.value[0]);
}

async function getGameByTopCategory(category) {
  isLoading.value = true;
  activeTopCategory.value = category;
  const res = await gamesByTopCategory(category.id);
  isLoading.value = false;
  gamesList.value = res.data ? res.data : [];
}

const searchEmptyState = computed(() => {
  return searchQuery.value === "" || searchQuery.value.length < 3;
});

const searchEmtpyResult = computed(() => {
  return (
    searchQuery.value !== "" &&
    searchQuery.value.length > 3 &&
    searchResult.value.length === 0 &&
    !isSearching.value
  );
});

const clearSearch = () => {
  searchQuery.value = "";
  searchResult.value = [];
};

const updateCSSVar = () => {
  if (myElement.value) {
    const distanceFromTop =
      myElement.value.getBoundingClientRect().top + window.scrollY;
    // Assign the distance to a CSS variable
    document.documentElement.style.setProperty(
      "--distance-from-top",
      `${distanceFromTop}px`,
    );
  }
};

const search = debounce(async (query) => {
  if (query.length < 3) {
    searchResult.value = [];
    return;
  }

  isSearching.value = true;
  try {
    const response = await getGamesBySearch(query);

    searchResult.value = response.games || [];
  } catch (error) {
    console.error("Error fetching data:", error);
    searchResult.value = [];
  } finally {
    isSearching.value = false;
  }
}, 500);

const handleInput = () => {
  search(searchQuery.value);
};

onBeforeMount(async () => {
  await getCategories();
});

watch(isSearchMode, async (newVal) => {
  if (newVal) {
    await nextTick(); // Wait for the element to be in the DOM
    updateCSSVar();
  }
});
</script>

<style scoped>
@import url("@/assets/css/casino.css");
.search-backdrop {
  background: rgba(0, 0, 0, 0.7);
  bottom: 0;
  left: 0;
  max-height: var(--heightGameListArea);
  position: absolute;
  right: 0;
  top: var(--distance-from-top);
  z-index: 11;
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

/* search */
.game-search {
  background-color: #000;
  position: absolute;
  top: var(--topSpaceAreaNotification);
  width: 100%;
  z-index: 12;
  padding: 15px;
}
.game-search .search-input {
  margin-top: 12px;
  position: relative;
}

.game-search .search-input .search-box.form-control {
  background-color: #000;
  border-color: #6f6f6f;
  color: #fff;
  font-size: 12px;
  height: calc(1.5em + 0.75rem + 20px);
}

.game-search .search-input .search-box.form-control:focus {
  -webkit-box-shadow: none;
  box-shadow: none;
}

.game-search .search-input .search-close-button-wrapper {
  height: 100%;
  position: absolute;
  right: 0;
  top: 0;
}

.game-search .search-input .search-close-button-wrapper .search-close-button {
  margin-bottom: 20px;
  margin-right: 16px;
}

.game-search .search-input .search-close-button-wrapper:before {
  background-color: #424242;
  content: "";
  display: inline-block;
  height: 28px;
  margin-right: 16px;
  margin-top: 12px;
  width: 1px;
}

.game-search .search-suggestion .suggestion-text {
  background-color: #373737;
  border-radius: 8px;
  -webkit-box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.5);
  color: #fff;
  display: -webkit-box;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  font-size: 12px;
  -webkit-box-pack: center;
  -ms-flex-pack: center;
  justify-content: center;
  margin: 4px;
  padding: 8px 16px;
}

.game-search .search-error {
  background-color: #222;
  border-radius: 10px;
  color: #6d6d6d;
  font-size: 14px;
  padding: 0.5rem;
}

.game-search .search-error img {
  width: 60%;
}

.game-search .not-found {
  background-color: #222;
  border-radius: 5px;
  color: #6f6f6f;
  font-size: 14px;
  padding: 0.5rem;
}

.game-search .not-found img {
  width: 60%;
}

.game-search .search-game-list .suggestion-text {
  color: #fff;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  margin-bottom: 14px;
  margin-top: 18px;
}

.game-search .search-game-list .divider hr {
  border-top: 1px solid #424242;
  margin-bottom: 0;
  margin-top: 0;
}
.card-img-top {
  width: 100%;
  height: 105px;
  object-fit: cover;
}
</style>
