<template>
  <div class="m-betslip-header" :class="betslipMode ? 'sim-theme' : 'real-theme'">
    <div class="head-container">
      <div class="wrapper separate-part">
        <div class="operate-button">
          <div class="d-flex align-items-center">
            <template v-if="simEnabled">
              <span
                class="d-flex justify-content-center align-items-center mr-2 font-weight-bold"
                :style="
                  betslipMode
                    ? 'background-color: #ffd600; color: #000'
                    : 'background-color: var(--brand-secondary); color: #fff'
                "
                style="font-size: 13px; height: 30px; width: 30px; border-radius: 50%"
              >
                {{ selectionsCount }}
              </span>
              <BetslipModeToggle />
            </template>
            <span v-else style="font-weight: bold; font-size: 1.2rem; margin-right: 20px"
              >Betslip</span
            >
          </div>
        </div>
        <div class="operate-button">
          <span class="currency">{{ Currency }}</span>
          <span> {{ balance }}</span>
        </div>
      </div>
      <template v-if="selectionsCount > 0">
        <div style="margin: 20px 0px 20px 0px"></div>
        <div v-if="!isSimulating" class="wrapper separate-part">
          <div
            @click="$emit('clear')"
            class="remove-all operate-button"
            style="display: flex; align-items: center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round">
                <path d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5" />
                <path d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5" />
                <path d="M9.5 16.5L9.5 10.5" />
                <path d="M14.5 16.5L14.5 10.5" />
            </svg>
            <span>Remove all</span>
          </div>
          <div class="wrapper separate-part" @click="$emit('open-settings')">
            <div class="bet-settings bet-settings operate-button flex">
              <div class="icon icon-font-base mr-1" style="font-size: 1.33333rem">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="currentColor" fill="none" stroke="#fff" stroke-width="1.5">
                    <path d="M15.5 12C15.5 13.933 13.933 15.5 12 15.5C10.067 15.5 8.5 13.933 8.5 12C8.5 10.067 10.067 8.5 12 8.5C13.933 8.5 15.5 10.067 15.5 12Z" />
                    <path d="M21.011 14.0965C21.5329 13.9558 21.7939 13.8854 21.8969 13.7508C22 13.6163 22 13.3998 22 12.9669V11.0332C22 10.6003 22 10.3838 21.8969 10.2493C21.7938 10.1147 21.5329 10.0443 21.011 9.90358C19.0606 9.37759 17.8399 7.33851 18.3433 5.40087C18.4817 4.86799 18.5509 4.60156 18.4848 4.44529C18.4187 4.28902 18.2291 4.18134 17.8497 3.96596L16.125 2.98673C15.7528 2.77539 15.5667 2.66972 15.3997 2.69222C15.2326 2.71472 15.0442 2.90273 14.6672 3.27873C13.208 4.73448 10.7936 4.73442 9.33434 3.27864C8.95743 2.90263 8.76898 2.71463 8.60193 2.69212C8.43489 2.66962 8.24877 2.77529 7.87653 2.98663L6.15184 3.96587C5.77253 4.18123 5.58287 4.28891 5.51678 4.44515C5.45068 4.6014 5.51987 4.86787 5.65825 5.4008C6.16137 7.3385 4.93972 9.37763 2.98902 9.9036C2.46712 10.0443 2.20617 10.1147 2.10308 10.2492C2 10.3838 2 10.6003 2 11.0332V12.9669C2 13.3998 2 13.6163 2.10308 13.7508C2.20615 13.8854 2.46711 13.9558 2.98902 14.0965C4.9394 14.6225 6.16008 16.6616 5.65672 18.5992C5.51829 19.1321 5.44907 19.3985 5.51516 19.5548C5.58126 19.7111 5.77092 19.8188 6.15025 20.0341L7.87495 21.0134C8.24721 21.2247 8.43334 21.3304 8.6004 21.3079C8.76746 21.2854 8.95588 21.0973 9.33271 20.7213C10.7927 19.2644 13.2088 19.2643 14.6689 20.7212C15.0457 21.0973 15.2341 21.2853 15.4012 21.3078C15.5682 21.3303 15.7544 21.2246 16.1266 21.0133L17.8513 20.034C18.2307 19.8187 18.4204 19.711 18.4864 19.5547C18.5525 19.3984 18.4833 19.132 18.3448 18.5991C17.8412 16.6616 19.0609 14.6226 21.011 14.0965Z" />
                </svg>
              </div>
              <span>Bet Settings</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import BetslipModeToggle from './BetslipModeToggle.vue'

defineProps({
  betslipMode: Boolean,
  selectionsCount: Number,
  isSimulating: Boolean,
  balance: [String, Number],
  Currency: String,
  simEnabled: Boolean
})

defineEmits(['clear', 'open-settings'])
</script>
