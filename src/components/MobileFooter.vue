<template>
  <div class="m-bottom-nav">
    <!-- <div class="switch-theme">
      <img src="/cog.gif" style="height: 30px" alt="" srcset="" />
    </div> -->
    <div
      v-show="utilsStore.showBetslipCount"
      @click="showBetslip"
      class="betslip-float-wrapper real-theme"
    >
      <!-- <div class="bg"></div> -->
      <div class="count-wrapper">
        <span class="count" v-if="betType !== 'Split'">{{ betslipCount > 0 ? totalOdds : 0 }}</span>
        <span v-if="betType === 'Split'" style="display: flex; align-items: center">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            height="24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
            aria-label=""
            class="kz-icon-s icon--color-white-snow"
          >
            <path
              xmlns="http://www.w3.org/2000/svg"
              fill="#FFF"
              fill-rule="evenodd"
              d="M18 12.9H6V11.479H18V12.9ZM18 16.4526C18 16.845 17.6819 17.1632 17.2895 17.1632H14.2105C13.8181 17.1632 13.5 16.845 13.5 16.4526C13.5 16.0602 13.8181 15.7421 14.2105 15.7421H17.2895C17.6819 15.7421 18 16.0602 18 16.4526ZM18 10.1053H6V8.68421H18V10.1053ZM18 7.26316H6V5.84211H18V7.26316ZM3 21L4.5 19.5789L6 21L7.5 19.5789L9 21L10.5 19.5789L12 21L13.5 19.5789L15 21L16.5 19.5789L18 21L19.5 19.5789L21 21V4C21 3.44772 20.5523 3 20 3H4C3.44772 3 3 3.44772 3 4V21Z"
              clip-rule="evenodd"
            ></path>
            <path
              xmlns="http://www.w3.org/2000/svg"
              fill="#FFF"
              fill-rule="evenodd"
              d="M18 12.9H6V11.479H18V12.9ZM18 16.4526C18 16.845 17.6819 17.1632 17.2895 17.1632H14.2105C13.8181 17.1632 13.5 16.845 13.5 16.4526C13.5 16.0602 13.8181 15.7421 14.2105 15.7421H17.2895C17.6819 15.7421 18 16.0602 18 16.4526ZM18 10.1053H6V8.68421H18V10.1053ZM18 7.26316H6V5.84211H18V7.26316ZM3 21L4.5 19.5789L6 21L7.5 19.5789L9 21L10.5 19.5789L12 21L13.5 19.5789L15 21L16.5 19.5789L18 21L19.5 19.5789L21 21V4C21 3.44772 20.5523 3 20 3H4C3.44772 3 3 3.44772 3 4V21Z"
              clip-rule="evenodd"
            ></path>
          </svg>
        </span>
        <span class="betslip" style="font-size: 1rem; color: white">BETSLIP</span>
      </div>
      <div v-if="betslipCount > 0" class="notification">{{ betslipCount }}</div>
    </div>
    <div v-if="utilsStore.showMobileNavigation" class="m-bottom-fixed">
      <div class="m-btn-button">
        <router-link :to="{ name: 'home' }">
          <section>
            <img src="@/assets/images/cube.png" alt="" srcset="" />
          </section>
        </router-link>
        <span class="label">Home</span>
      </div>
      <div class="m-btn-button">
        <router-link :to="{ name: 'az_menu' }">
          <section>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="23" viewBox="0 0 22 23">
              <g fill="none" fill-rule="evenodd">
                <g>
                  <g>
                    <g>
                      <path
                        d="M0 0H22V22H0z"
                        transform="translate(-97 -682) translate(0 672) translate(97 10.5)"
                      ></path>
                      <path
                        fill-rule="nonzero"
                        d="M2.75 16.5h16.5v-1.833H2.75V16.5zm0-4.583h16.5v-1.834H2.75v1.834zm0-6.417v1.833h16.5V5.5H2.75z"
                        transform="translate(-97 -682) translate(0 672) translate(97 10.5)"
                        class="bottomNav-icon"
                      ></path>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
          </section>
        </router-link>
        <span class="label">AZ Menu</span>
      </div>
      <div class="m-btn-button">
        <router-link :to="{ name: 'casino-games' }">
          <img src="@/assets/images/games.png" width="16" height="16" alt="" srcset="" />
        </router-link>
        <span class="label" data-cms-key="games">Casino</span>
      </div>
      <div class="m-btn-button active">
        <router-link :to="{ name: 'open-bets' }">
          <span v-if="props.openBetCount > 0" class="open-bets">{{ props.openBetCount }}</span>
          <section data-v-42c08837="">
            <img
              data-v-42c08837=""
              src="//s.sporty.net/global/main/modules/common-wap/components/layout/image/open-bet.620ec1f20e.png"
              alt=""
            />
          </section>
        </router-link>
        <span class="label">Open Bets</span>
      </div>
      <div class="m-btn-button">
        <router-link :to="{ name: 'account-me' }">
          <section>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="23" viewBox="0 0 22 23">
              <g fill="none" fill-rule="evenodd">
                <g>
                  <g>
                    <g>
                      <path
                        fill-rule="nonzero"
                        d="M11 11c2.026 0 3.667-1.64 3.667-3.667 0-2.026-1.641-3.666-3.667-3.666s-3.667 1.64-3.667 3.666S8.974 11 11 11zm0 1.833c-2.447 0-7.333 1.229-7.333 3.667v1.833h14.666V16.5c0-2.438-4.885-3.667-7.333-3.667z"
                        transform="translate(-313 -682) translate(0 672) translate(313 10.5)"
                        class="bottomNav-icon"
                      ></path>
                      <path
                        d="M0 0H22V22H0z"
                        transform="translate(-313 -682) translate(0 672) translate(313 10.5)"
                      ></path>
                    </g>
                  </g>
                </g>
              </g>
            </svg>
          </section>
        </router-link>
        <span class="label">Me</span>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useUtilstStore, useCouponStore } from '@/stores'
import { computed } from 'vue'
import { formatTotalOdds } from '@/helpers'

const props = defineProps({
  openBetCount: Number
})

const utilsStore = useUtilstStore()
const couponStore = useCouponStore()

const betslipCount = computed(() => {
  return couponStore.coupon.selections.length
})

const totalOdds = computed(() => {
  return formatTotalOdds(couponStore.coupon.totalOdds)
})

const emit = defineEmits(['show-betslip'])
const betType = computed(() => {
  return couponStore.coupon.bet_type
})

function showBetslip() {
  return emit('show-betslip')
}
</script>
<style scoped>
.bottomNav-icon {
  fill: #9ca0ab;
}
.bottomNav-icon.active {
  fill: #9ca0ab;
}
.bottomNav-svg {
  padding-bottom: 4px;
}
.m-bottom-nav {
  font-family: Roboto;
}
.m-bottom-nav .m-fast-betslip-wrap {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  bottom: 0;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  width: 100%;
  z-index: 223;
}
.m-bottom-nav .m-fast-betslip-wrap > * {
  background-color: #ffffff;
  background-color: var(--c-betslip-quickbet-bg);
  -webkit-box-shadow: 0 -0.16666667rem 0.5rem 0 rgba(27, 30, 37, 0.3);
  box-shadow: 0 -0.16666667rem 0.5rem 0 rgba(27, 30, 37, 0.3);
  position: relative;
  width: 100%;
}
.m-bottom-nav .m-bottom-fixed {
  background-color: #000000;
  bottom: 0;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  position: fixed;
  width: 100%;
  z-index: 200;
}
.m-bottom-nav .m-bottom-fixed .m-btn-button {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #ffffff;
  color: var(--brand-tertiary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  font-size: 1rem;
  height: 48px;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding: 0 1.25rem;
  position: relative;
  text-align: center;
  white-space: nowrap;
  width: 20%;
}
.m-bottom-nav .m-bottom-fixed .m-btn-button .open-bets {
  background-color: #ffffff;
  border-radius: 10px;
  color: #000000;
  display: inline-block;
  left: 63%;
  line-height: 1.5;
  min-width: 1.5rem;
  position: absolute;
  top: -4px;
  font-size: 10px;
  vertical-align: middle;
}
.m-bottom-nav .m-bottom-fixed .m-btn-button img {
  height: 22px;
  margin-bottom: 5px;
  width: 22px;
}
.m-bottom-nav .m-bottom-fixed .m-btn-button svg {
  margin-bottom: 5px;
}
.m-bottom-nav .m-bottom-fixed .m-btn-button svg .icon {
  fill: #9ca0ab;
}
.m-bottom-nav .m-bottom-fixed .m-btn-button svg .icon.active {
  fill: #9ca0ab;
}
.m-bottom-nav .m-bottom-fixed .m-btn-button .active {
  border-bottom: 5px solid var(--c-event-normal-text);
  bottom: 0;
  display: block;
  position: absolute;
  width: 58.3%;
}
.m-bottom-nav .m-bottom-fixed .m-btn-button .label {
  bottom: 0;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 12px;
  position: absolute;
  -webkit-transform: scale(0.75);
  -ms-transform: scale(0.75);
  transform: scale(0.75);
}
.m-bottom-nav .m-bottom-fixed .m-btn-button.swipe-bet {
  top: -0.41666667rem;
}
.m-bottom-nav .betslip-float-wrapper,
.m-bottom-nav .switch-theme {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  bottom: 5rem;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  height: 3.75rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  position: relative;
  position: fixed;
  right: 4px;
  width: 3.75rem;
  z-index: 219;
}

.m-bottom-nav .switch-theme {
  bottom: 15rem;
  right: 0px;
  background-color: #e41827;
  border-bottom-left-radius: 0.41666667rem;
  border-top-left-radius: 0.41666667rem;
}
.m-bottom-nav .betslip-float-wrapper .bg {
  background-color: #ffffff;
  background-color: var(--c-betslip-float-bg);
  border-bottom-left-radius: 0.41666667rem;
  border-top-left-radius: 0.41666667rem;
  height: 100%;
  opacity: 80%;
  position: absolute;
  width: 100%;
  z-index: 1;
}
.m-bottom-nav .betslip-float-wrapper .count-wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #e41827;
  background-color: var(--warning-primary);
  border-radius: 5px;
  color: #ffffff;
  color: var(--brand-tertiary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-weight: bold;
  height: 45px;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  flex-direction: column;
  /* margin-top: 0.33333333rem; */
  width: 45px;
  font-size: 1rem;
  z-index: 2;
}

.notification {
  background: var(--brand-secondary);
  border-radius: 100%;
  /* display: inline-block; */
  color: #fff;
  font-weight: 700;
  /* padding: 0 2px; */
  text-align: center;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  font-size: 0.64286rem;
  display: flex;
  align-items: center;
  justify-content: center;
  /* line-height: 12px; */
  /* padding: 2px; */
  z-index: 5;
  width: 16px;
  height: 16px;
}

.betslip-float-wrapper .notification {
  position: absolute;
  top: -2px;
  right: -2px;
}
.m-bottom-nav .betslip-float-wrapper .betslip {
  color: #1b1e25;
  color: var(--c-betslip-float-text);
  font-size: 1rem;
  font-weight: 500;
  -webkit-transform: scale(0.75);
  -ms-transform: scale(0.75);
  transform: scale(0.75);
  z-index: 2;
}
.m-bottom-nav .real-theme .count-wrapper {
  background-color: var(--brand-primary);
  color: #ffffff;
}
.m-bottom-nav .sim-theme .count-wrapper {
  background-color: #fafd00;
  color: #1b1e25;
  color: var(--background-type2-primary);
}
.m-bottom-nav .slide-enter-active,
.m-bottom-nav .slide-leave-active {
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
.m-bottom-nav .slide-enter,
.m-bottom-nav .slide-leave-to {
  -webkit-transform: translateY(100%);
  -ms-transform: translateY(100%);
  transform: translateY(100%);
}
.m-bottom-nav .m-bet-count {
  -webkit-transition: all 0.1s ease;
  transition: all 0.1s ease;
}
.m-bottom-nav .m-anime-scale {
  -webkit-transform: scale(1.4);
  -ms-transform: scale(1.4);
  transform: scale(1.4);
}
</style>
