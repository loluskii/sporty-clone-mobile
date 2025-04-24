<template>
  <div class="m-search">
    <div class="m-search--bar m-col2">
      <div class="m-l-left" @click="$router.push({ name: 'home' })">
        <i class="m-icon-back"></i>
      </div>
      <form id="search" class="m-l-right">
        <div class="m-input-wap-wrapper">
          <i
            class="m-input-wap-icon m-input-wap-icon--clickable m-icon-delete"
          ></i>

          <input
            role=""
            aria-label=""
            type="search"
            name=""
            placeholder="Game Title"
            autocomplete="off"
            class="m-input-wap fs-exclude"
            v-model="searchQuery"
            @input="handleInput"
            @keydown.enter.prevent="handleEnter"
          />
        </div>
      </form>
    </div>
    <div v-if="resultsIsEmpty && !isLoading">
      <div></div>
      <div>
        <div class="m-error-wrapper">
          <div>
            <span class="m-error-msg m-empty">No results at this time</span>
          </div>
        </div>
      </div>
    </div>
    <LoadingSpinner v-if="isLoading" />
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { debounce } from "lodash";
import { searchFixtures } from "@/helpers";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";

const searchQuery = ref("");
const results = ref({
  fixtures: [],
});
const isLoading = ref(false);

const resultsIsEmpty = computed(() => {
  return results.value.fixtures === undefined;
});

const handleInput = (event) => {
  debouncedSearch(event.target.value);
};

const handleEnter = async (event) => {
  event.preventDefault();
  isLoading.value = true;
  searchFixtures(event.target.value)
    .then((res) => {
      results.value = res;
      isLoading.value = false;
    })
    .catch((err) => {
      console.error(err);
      isLoading.value = false;
      results.value = [];
    });
};

// Debounced search function
const debouncedSearch = debounce((query) => {
  if (isLoading.value || results.value.fixtures.length) {
    return;
  }
  isLoading.value = true;
  console.log("Searching for:", query);
  // Place your search logic here, e.g., making an API call
  searchFixtures(query)
    .then((res) => {
      results.value = res;
      isLoading.value = false;
    })
    .catch((err) => {
      console.error(err);
      isLoading.value = false;
      results.value = [];
    });
}, 3000); // Adjust the debounce delay as needed
const prematchSports = computed(() => {
  if (results.value.fixtures) {
    const arr = [];
    results.value.fixtures.forEach((fixture) => {
      if (fixture?.matchStatus === "Not started") {
        const sport = arr.find((item) => item.sportName === fixture.sportName);
        if (sport) {
          sport.fixtures.push(fixture);
        } else {
          arr.push({
            sportID: fixture.sportID,
            sportName: fixture.sportName,
            fixtures: [fixture],
          });
        }
      }
    });
    return arr;
  } else {
    return [];
  }
});
</script>

<style type="text/css" scoped>
.m-search {
  background-color: #121212;
  min-height: 100%;
}
.m-search .m-col2 {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: table;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  width: 100%;
}
.m-search .m-col2 .m-l-left {
  display: table-cell;
}
.m-search .m-col2 .m-l-right {
  display: table-cell;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  min-width: 1%;
}
.m-search .m-error-wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: table;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  -webkit-box-pack: start;
  -webkit-justify-content: flex-start;
  -ms-flex-pack: start;
  justify-content: flex-start;
  padding: 20% 2.66666667rem 0;
}
.m-search .m-error-wrapper > div {
  display: table-cell;
  text-align: center;
  width: 100%;
}
.m-search .m-error-wrapper .m-icon-loading {
  -webkit-animation: loading-rotate 2s linear infinite;
  animation: loading-rotate 2s linear infinite;
  display: block;
  height: 2.5rem;
  text-align: center;
}
.m-search .m-error-wrapper .m-icon-loading::before {
  content: "\e654";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-search .m-error-wrapper .m-icon-loading:before {
  color: #dcdee5;
  font-size: 2.5rem;
  line-height: 1;
}
.m-search .m-error-wrapper .m-text-msg {
  color: #dcdee5;
  display: block;
  font-size: 1rem;
  line-height: 1.33333333rem;
  margin-top: 2.5rem;
}
.m-search .m-error-wrapper .m-error-msg {
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
  display: block;
  font-size: 1.066rem;
  line-height: 1.58333333rem;
  margin-bottom: 2.25rem;
}
.m-search .m-error-wrapper .m-error-msg::before {
  content: "\e624";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-search .m-error-wrapper .m-error-msg:before {
  color: #dcdee5;
  color: var(--disable-brand-secondary);
  display: block;
  font-size: 3rem;
  line-height: 1;
  margin-bottom: 1.25rem;
}
.m-search .m-error-wrapper .m-btn {
  border: 1px solid #0d9737;
  border-radius: 0.25rem;
  color: #0d9737;
  display: inline-block;
  height: 3rem;
  line-height: 3rem;
  padding: 0 2.33333333rem;
}
.m-search .m-error-wrapper .m-empty::before {
  content: "\e61b";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-search--bar {
  background: var(--brand-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  grid-template-columns: 3.66666667rem 1fr;
  padding: 0.58333333rem 0;
  position: -webkit-sticky;
  position: sticky;
  top: 0px;
  z-index: 201;
}
.m-search--bar .m-l-left {
  text-align: center;
  width: 3.66666667rem;
}
.m-search--bar .m-l-right {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding-right: 1.25rem;
}
.m-search--bar .m-input-wap-wrapper {
  background-color: #333;
  border: none;
  border-radius: 0.16666667rem;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  font-size: 1rem;
  height: 2.16666667rem;
  line-height: 1.066rem;
  padding: 0 0.25rem;
  width: 100%;
}
.m-search--bar .m-input-wap-wrapper .m-input-wap-icon {
  text-align: center;
  text-indent: 0.16666667rem;
}
.m-search--bar .m-input-wap-wrapper .m-input-wap-icon + .m-input-wap {
  padding-right: 3.33333333rem;
}
.m-search--bar .m-input-wap-wrapper .m-input-wap {
  background-color: #333;
  color: #fafafa;
  border: none !important;
  height: 2.16666667rem;
  padding-left: 0.16666667rem;
}

.m-search--bar .m-icon-back {
  color: #ffffff;
  color: var(--text-type2-primary);
  display: inline-block;
  height: 2.5rem;
  line-height: 2.5rem;
}
.m-search--bar .m-icon-back::before {
  content: "\e620";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-search--bar .m-icon-back:before {
  font-size: 1.066rem;
  line-height: 1;
}
.m-search--bar input[type="search"]::-webkit-search-cancel-button {
  display: none;
}
.m-search--bar input[type="search"] {
  -webkit-appearance: none;
}
</style>
