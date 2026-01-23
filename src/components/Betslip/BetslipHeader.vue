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
          <span class="currency">{{ currencyCode }}</span>
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
            <svg
              viewBox="0 0 16 16"
              fill="white"
              height="18"
              width="18"
              xmlns="http://www.w3.org/2000/svg"
              aria-label=""
              class="trash-icon kz-icon-xxs icon--color-slate mr-1"
            >
              <path
                xmlns="http://www.w3.org/2000/svg"
                fill="#FFFFFF"
                d="M7.3883 6.71564V10.997C7.3883 11.894 6.04273 11.894 6.04273 10.997V6.71564C6.04273 5.81859 7.3883 5.81859 7.3883 6.71564zM9.95711 10.997V6.71564C9.95711 5.81859 8.61154 5.81859 8.61154 6.71564V10.997C8.61154 11.894 9.95711 11.894 9.95711 10.997z"
              ></path>
              <path
                xmlns="http://www.w3.org/2000/svg"
                fill="#FFFFFF"
                fill-rule="evenodd"
                d="M10.8134 2.86243C10.8134 2.01795 10.1288 1.33337 9.28432 1.33337H6.71552C5.87104 1.33337 5.18646 2.01795 5.18646 2.86243V3.04591H2.00603C1.63447 3.04591 1.33325 3.34713 1.33325 3.7187C1.33325 4.09026 1.63447 4.39148 2.00603 4.39148H2.67141L3.41117 13.2643C3.47691 14.0569 4.13959 14.6668 4.93511 14.6667H11.0654C11.8608 14.6668 12.5234 14.0569 12.5892 13.2642L13.3285 4.39148H13.9938C14.3654 4.39148 14.6666 4.09026 14.6666 3.7187C14.6666 3.34713 14.3654 3.04591 13.9938 3.04591H10.8134V2.86243ZM9.46781 3.04591V2.86243C9.46781 2.76109 9.38566 2.67894 9.28432 2.67894H6.71552C6.61418 2.67894 6.53203 2.76109 6.53203 2.86243V3.04591H9.46781ZM11.9782 4.39148H4.02165L4.75211 13.1528C4.76 13.248 4.83952 13.3211 4.93505 13.3211H11.0654C11.1609 13.3211 11.2404 13.248 11.2483 13.1528L11.9782 4.39148Z"
                clip-rule="evenodd"
              ></path>
              <path
                xmlns="http://www.w3.org/2000/svg"
                fill="#FFFFFF"
                d="M7.3883 6.71564V10.997C7.3883 11.894 6.04273 11.894 6.04273 10.997V6.71564C6.04273 5.81859 7.3883 5.81859 7.3883 6.71564zM9.95711 10.997V6.71564C9.95711 5.81859 8.61154 5.81859 8.61154 6.71564V10.997C8.61154 11.894 9.95711 11.894 9.95711 10.997z"
              ></path>
              <path
                xmlns="http://www.w3.org/2000/svg"
                fill="#FFFFFF"
                fill-rule="evenodd"
                d="M10.8134 2.86243C10.8134 2.01795 10.1288 1.33337 9.28432 1.33337H6.71552C5.87104 1.33337 5.18646 2.01795 5.18646 2.86243V3.04591H2.00603C1.63447 3.04591 1.33325 3.34713 1.33325 3.7187C1.33325 4.09026 1.63447 4.39148 2.00603 4.39148H2.67141L3.41117 13.2643C3.47691 14.0569 4.13959 14.6668 4.93511 14.6667H11.0654C11.8608 14.6668 12.5234 14.0569 12.5892 13.2642L13.3285 4.39148H13.9938C14.3654 4.39148 14.6666 4.09026 14.6666 3.7187C14.6666 3.34713 14.3654 3.04591 13.9938 3.04591H10.8134V2.86243ZM9.46781 3.04591V2.86243C9.46781 2.76109 9.38566 2.67894 9.28432 2.67894H6.71552C6.61418 2.67894 6.53203 2.76109 6.53203 2.86243V3.04591H9.46781ZM11.9782 4.39148H4.02165L4.75211 13.1528C4.76 13.248 4.83952 13.3211 4.93505 13.3211H11.0654C11.1609 13.3211 11.2404 13.248 11.2483 13.1528L11.9782 4.39148Z"
                clip-rule="evenodd"
              ></path>
            </svg>
            <span>Remove all</span>
          </div>
          <div class="wrapper separate-part" @click="$emit('open-settings')">
            <div class="bet-settings bet-settings operate-button flex">
              <div class="icon icon-font-base mr-1" style="font-size: 1.33333rem">Œ~ñ</div>
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
  currencyCode: String,
  simEnabled: Boolean
})

defineEmits(['clear', 'open-settings'])
</script>
