import { defineStore } from "pinia";

export const useUtilstStore = defineStore({
  id: "utils",
  state: () => ({
    brandName: "",
    sportID: 1,
    live: false,
    sportsMenu: [],
    marketGroups: [],
    activeLiveMarkets: [],
    homeCarousel: [],
    SportsbookBonusList: [],
    SportsbookGlobalVariable: {},
    showBetslipCount: true,
    showFooter: true,
    showMobileNavigation: true,
    errorMessage: null,
    categoriesList: [],
    casinoBonusShown: false,
    previousRoute: null,
  }),
  getters: {},
  actions: {},
  persist: {
    storage: localStorage,
  },
});
