<template>
  <div class="m-bethistory">
    <div class="m-ticket-detail">
      <div class="m-nav-secondary">
        <div class="m-nav-left">
          <span @click="$emit('reset')" class="m-icon m-icon--back"></span>
          <span class="title"> Ticket Details </span>
        </div>
        <div class="info-container">
          <div class="m-nav-right">
            <div @click="$router.push({ name: 'home' })" class="home-link">
              <div class="home-icon"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="ticket-top">
        <div class="seperate ticket-info">
          <span data-cms-key="ticket_id_vid" data-cms-page="bet_history"
            >Ticket ID: {{ bet.id }}</span
          >
          <span>{{ moment(new Date(bet.created)).format('DD/MM HH:mm') }}</span>
        </div>
        <div class="bar seperate">
          <span class="type"
            ><span data-cms-key="multiple" data-cms-page="bet_history">{{
              bet.selections.length > 1 ? 'Multiple' : 'Single'
            }}</span>
          </span>

          <span
            class="status"
            :style="`${bet.status === 1 ? 'color: #00c100; font-weight: bold' : ''}`"
            >{{ bet.statusDescription }}</span
          >
        </div>

        <div class="seperate stake-amount">
          <span class="left" data-cms-key="total_return" data-cms-page="bet_history"
            >Total Return</span
          >
          <span
            :style="`${bet.status === 1 ? 'color: #00c100; font-weight: bold' : ''}`"
            >{{ bet.status === 1 ? formatNumber(bet.possibleWin) : '0.00' }}</span
          >
        </div>

        <div class="under-split">
          <div class="cash-info">
            <em></em>
            <div class="seperate">
              <span class="left">Total Stake</span>
              <span>{{ formatNumber(bet.stake) }}</span>
            </div>

            <div class="seperate">
              <span class="left">Total Odds</span>
              <span>{{ formatNumber(bet.totalOdd) }}</span>
            </div>
          </div>
        </div>
        <div
          v-if="bet.status === -1"
          data-op="rebet-wrapper"
          class="rebet-wrapper seperate"
        >
          <div class="book-code-wrapper">
            <div>
              <span
                class="book-code-text"
                data-cms-key="booking_code"
                data-cms-page="common_functions"
                >Booking Code</span
              >
              <span class="book-code"> {{ bet.shareCode }} </span>
            </div>
            <div class="book-code-operator">
              <div :data-clipboard-text="bet.shareCode">
                <div
                  @click="copyCode"
                  class="copy-icon icon-font-base"
                  style="font-size: 1.33333rem"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    class="bi bi-copy"
                    viewBox="0 0 16 16"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
          <div class="rebet-btn-wrapper" @click="rebet">
            <div class="rebet-btn">
              <span v-if="!isRebetLoading">Rebet</span>
              <div v-else class="rebetting"></div>
            </div>
          </div>
        </div>
        <div v-if="bet.statusCode == 1" class="m-share">
          <img src="/winning.png" style="height: 100%; width: 100%" />
        </div>
      </div>
      <div
        v-for="(selection, s) in props.bet.selections"
        :key="s"
        
        class="ticket-selection-list ticket-detail-list"
      >
        <div class="seperate px-0">
          <span class="status">
            <span v-if="selection.statusDescription === 'Lost'">
              <svg data-v-54f5b7e7="" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" height="2rem" width="2rem" class="svg-icon-base"><circle cx="12" cy="12" r="7" fill="#fff"></circle><path d="M8.76 16.5L12 13.26l3.24 3.24 1.26-1.26L13.26 12l3.24-3.24-1.26-1.26L12 10.74 8.76 7.5 7.5 8.76 10.74 12 7.5 15.24l1.26 1.26zM12 21a8.764 8.764 0 01-3.51-.709 9.089 9.089 0 01-2.858-1.924A9.089 9.089 0 013.71 15.51a8.764 8.764 0 01-.71-3.51c0-1.245.237-2.415.71-3.51a9.089 9.089 0 011.923-2.858A9.089 9.089 0 018.49 3.71a8.764 8.764 0 013.51-.71c1.245 0 2.415.237 3.51.71a9.089 9.089 0 012.857 1.923 9.089 9.089 0 011.924 2.858A8.764 8.764 0 0121 12a8.764 8.764 0 01-.709 3.51 9.089 9.089 0 01-1.924 2.857 9.089 9.089 0 01-2.857 1.924A8.764 8.764 0 0112 21z" fill="#E41827"></path></svg>
            </span>
            <span v-if="selection.statusDescription === 'Won'">
              <svg data-v-54f5b7e7="" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg" height="2rem" width="2rem" class="won svg-icon-base"><circle cx="12" cy="12.5" r="9" fill="currentColor"></circle><path d="M17 9.825L10.761 16.5 7 12.476l1.239-1.325 2.522 2.698 5-5.349L17 9.825z" fill="#fff" stroke="#fff" stroke-width=".2"></path></svg>
            </span>
            <span v-if="selection.statusDescription === 'Pending'">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="20"
                fill="#333"
                class="bi bi-clock-fill"
                viewBox="0 0 16 16"
              >
                <path
                  d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"
                />
              </svg>
            </span>
            <span v-if="selection.statusDescription === 'Void' || selection.statusDescription === 'Cancelled'">
              <svg data-v-54f5b7e7="" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" height="2rem" width="2rem" class="void svg-icon-base"><circle cx="12" cy="12" r="8" fill="#fff"></circle><mask id="a" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24" style="mask-type: alpha;"><path fill="#D9D9D9" d="M0 0h24v24H0z"></path></mask><g mask="url(#a)"><path d="M7.5 12.9h9v-1.8h-9v1.8zM12 21a8.764 8.764 0 01-3.51-.709 9.089 9.089 0 01-2.858-1.924A9.089 9.089 0 013.71 15.51a8.764 8.764 0 01-.71-3.51c0-1.245.237-2.415.71-3.51a9.089 9.089 0 011.923-2.858A9.089 9.089 0 018.49 3.71a8.764 8.764 0 013.51-.71c1.245 0 2.415.237 3.51.71a9.089 9.089 0 012.857 1.923 9.089 9.089 0 011.924 2.858A8.764 8.764 0 0121 12a8.764 8.764 0 01-.709 3.51 9.089 9.089 0 01-1.924 2.857 9.089 9.089 0 01-2.857 1.924A8.764 8.764 0 0112 21z" fill="currentColor"></path></g></svg>
            </span>
          </span>
          <div class="solo">
            <span>
              <span class="gray">Game ID: {{ selection.eventId }}</span>
              <span class="gray"> | </span>
              <span class="gray">{{ formatDate(selection.eventDate, 'DD/MM HH:mm') }}</span></span
            >
            <div class="ellips">{{ selection.eventName }}</div>
            <span class="score-wrapper"
              ><div class="not-seperate">
                <span class="gray">FT Score: </span>
                <p>
                  <span>
                    <em>{{ selection.score ? selection.score : '-- : --' }}</em></span
                  >
                </p>
              </div></span
            >
            <div class="pick-info">
              <p class="not-seperate">
                <span class="gray colon">Pick</span>
                <span>
                  {{ selection.outcomeName }}
                  @{{ selection.odds.toFixed(2) }}
                </span>
              </p>
              <p class="not-seperate">
                <span class="gray colon">Market</span>
                <span> {{ selection.marketName }} </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { formatDate, formatNumber, loadBetslipByCode } from '@/helpers'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import moment from 'moment'

const props = defineProps({
  bet: {
    type: Object,
    default: JSON.parse(localStorage.getItem('betDetail')) || {}
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const couponStore = useCouponStore()
const isRebetLoading = ref(false)


async function rebet() {
  if (!props.bet) return
  isRebetLoading.value = true
  try {
    const res = await loadBetslipByCode(props.bet.id)
    isRebetLoading.value = false
    if (res.success) {
      if (res.data.selections.length) {
        couponStore.coupon.selections = res.data.selections
        couponStore.coupon.totalOdds = res.data.totalOdd
        couponStore.coupon.totalStake = res.data.stake
        couponStore.coupon.stake = res.data.stake
        couponStore.coupon.maxWin = res.data.possibleWin
        couponStore.coupon.source = 'mobile'
        if (res.data.selections.length === 1) {
          couponStore.coupon.bet_type = 'Single'
          couponStore.coupon.betslip_type = 'Single'
        } else {
          couponStore.coupon.bet_type = 'Multiple'
          couponStore.coupon.betslip_type = 'Multiple'
        }
        emitter.emit('openBetslip')
        return router.push({ name: 'home' })
      } else {
        emitter.emit('showDialogueToaster', 'All selections have expired')
      }
    } else {
      throw Error
    }
  } catch (error) {
    emitter.emit('showDialogueToaster', 'Invalid booking code. ')
  }
}

function copyCode() {
  if (!props.bet) return
  const textToCopy = props.bet.shareCode
  const textarea = document.createElement('textarea')
  textarea.value = textToCopy
  document.body.appendChild(textarea)
  textarea.select()

  try {
    navigator.clipboard.writeText(textToCopy)
    alert('Copied!')
  } catch (err) {
    console.error('Unable to copy to clipboard', err)
  }
}
</script>

<style>
.px-0{
  padding: 0 !important;
}
.rebetting::before {
  content: '\e654';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.rebetting:before {
  -webkit-animation: circles 1s infinite;
  animation: circles 1s infinite;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  color: #ffffff;
  color: var(--brand-tertiary);
  display: inline-block;
  vertical-align: top;
}

.m-ticket-detail {
  background-color: #fff;
  font-size: 1rem;
}
.m-ticket-detail .seperate {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  padding: 0 1.33333333rem;
}

.m-ticket-detail .ticket-top {
  background-color: #1b1e25;
  color: #ffffff;
  color: var(--text-type2-primary);
  padding: 1rem 0 1.41666667rem;
  position: relative;
}
.m-ticket-detail .ticket-top .ticket-info {
  color: #ffffff;
  color: var(--text-type2-primary);
  opacity: 0.5;
  padding: 0 1.33333333rem;
}
.m-ticket-detail .ticket-top .bar {
  font-size: 1.33333333rem;
  padding: 0 1.33333333rem;
}
.m-ticket-detail .ticket-top .stake-amount span:first-child {
  font-size: 1.066rem;
}
.m-ticket-detail .ticket-top .stake-amount span:last-child {
  font-size: 1.66666667rem;
  font-weight: bold;
}
.m-ticket-detail .ticket-top .cash-info {
  font-size: 1.066rem;
  line-height: 1.57;
  margin-bottom: 0.91666667rem;
}
.m-ticket-detail .ticket-top .cash-info em {
  border-top: solid 0.08333333rem #353a45;
  border-color: #353a45;
  border-color: var(--line-type1-tertiary);
  display: block;
  padding-top: 0.83333333rem;
}
.m-ticket-detail .ticket-top .left {
  opacity: 0.5;
}
.m-ticket-detail .m-share {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  border-top: solid 0.08333333rem #353a45;
  border-color: #353a45;
  border-color: var(--line-type1-tertiary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: end;
  -webkit-justify-content: flex-end;
  -ms-flex-pack: end;
  justify-content: flex-end;
  margin-bottom: -1.41666667rem;
}
.m-ticket-detail .rebet-wrapper {
  border-top: 1px solid rgba(234, 236, 239, 0.2);
  margin-top: 1.08333333rem;
  padding: 1rem 1rem 0rem;
}
.m-ticket-detail .rebet-wrapper .book-code-wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.m-ticket-detail .rebet-wrapper .book-code-wrapper .book-code-text {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  display: block;
  font-size: 0.83333333rem;
  margin-bottom: 0.5rem;
}
.m-ticket-detail .rebet-wrapper .book-code-wrapper .book-code {
  display: block;
  font-size: 1.33333333rem;
  font-weight: 500;
  line-height: 1;
}
.m-ticket-detail .rebet-wrapper .book-code-operator {
  color: #dcdee5;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  margin-left: 1rem;
}
.m-ticket-detail .rebet-wrapper .book-code-operator .copy-icon {
  margin-right: 0.66666667rem;
}
.m-ticket-detail .rebet-wrapper .rebet-btn-wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.m-ticket-detail .rebet-wrapper .rebet-btn-wrapper .rebet-btn {
  background: #0d9737;
  background: var(--brand-secondary);
  border-radius: 2px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #ffffff;
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  font-family: Roboto;
  font-size: 1.066rem;
  font-weight: 500;
  line-height: 1.66666667rem;
  padding: 1rem 0.66666667rem;
  text-align: center;
  width: 7.66666667rem;
}
.m-ticket-detail .bets-info {
  border-bottom: 0.08333333rem solid #f2f3f5;
  border-top: 0.08333333rem solid #f2f3f5;
  border-color: #f2f3f5;
  border-color: var(--background-type1-primary);
  padding: 1.5rem 1rem;
}
.m-ticket-detail .bets-info .arrow::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-ticket-detail .bets-info .arrow::before {
  color: #0d9737;
  color: var(--brand-secondary);
  font-size: 0.83333333rem;
  left: 0.66666667rem;
  margin-right: 0.41666667rem;
  position: relative;
}
.m-ticket-detail .bets-info .bets-num {
  color: #353a45;
  color: var(--text-type1-primary);
  font-size: 1.066rem;
}
.ticket-selection-list {
  border-bottom: 0.08333333rem solid #eaecef;
  border-color: #eaecef;
  border-color: var(--brand-border-type1);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 1.33333333rem 1rem;
}
.ticket-selection-list .seperate {
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
}
.ticket-selection-list .seperate .solo {
  position: relative;
  width: 85%;
}
.ticket-selection-list .seperate .solo .ellips {
  color: #000000;
  color: var(--text-default);
}
.ticket-selection-list .gray {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  text-align: right;
}
.ticket-selection-list .gray.colon:after {
  content: ':';
}
.ticket-selection-list .status {
  color: #353a45;
  color: var(--text-type1-primary);
  font-weight: bold;
  line-height: 1;
}
.ticket-selection-list .pick-info {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  margin-bottom: 0.58333333rem;
  padding: 0.41666667rem;
}
.ticket-selection-list .not-seperate {
  display: table-row;
}
.ticket-selection-list .not-seperate span {
  display: table-cell;
}
.ticket-selection-list .not-seperate span:last-child {
  color: #000000;
  color: var(--text-default);
  padding-left: 0.66666667rem;
}

.ticket-selection-list {
  border-bottom: 0.08333333rem solid #eaecef;
  border-color: #eaecef;
  border-color: var(--brand-border-type1);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 1.33333333rem 1rem;
}
.ticket-selection-list .seperate {
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
}
.ticket-selection-list .seperate .right {
  left: 2.5rem;
  position: relative;
}
.ticket-selection-list .seperate .solo {
  position: relative;
  width: 85%;
}
.ticket-selection-list .seperate .solo .ellips {
  color: #000000;
  color: var(--text-default);
}
.ticket-selection-list .index {
  background-color: #353a45;
  background-color: var(--background-type2-secondary);
  border-radius: 0.66666667rem;
  color: #ffffff;
  color: var(--text-type2-primary);
  display: inline-block;
  height: 1.33333333rem;
  line-height: 1.33333333rem;
  margin-right: 8px;
  text-align: center;
  width: 1.33333333rem;
}
.ticket-selection-list .m-icon-live {
  background: #32ce62;
  background: var(--brand-type3-secondary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #353a45;
  display: inline-block;
  margin-right: 0.41666667rem;
  padding: 0 0.16666667rem;
  position: relative;
  vertical-align: top;
}
.ticket-selection-list .m-icon-live:after {
  border-bottom: 0.66666667rem solid transparent;
  border-left: 0.08333333rem solid #32ce62;
  border-right: 0.08333333rem solid transparent;
  border-top: 0.66666667rem solid #32ce62;
  border-left-color: #32ce62;
  border-left-color: var(--brand-type3-secondary);
  border-top-color: #32ce62;
  border-top-color: var(--brand-type3-secondary);
  content: '';
  height: 0;
  position: absolute;
  right: -0.16666667rem;
  top: 0;
  width: 0;
}
.ticket-selection-list .tracker-comments-warp {
  -webkit-box-pack: start;
  -webkit-justify-content: flex-start;
  -ms-flex-pack: start;
  justify-content: flex-start;
  line-height: normal;
}
.ticket-selection-list .tracker-comments-warp .tracker {
  color: #0d9737;
  color: var(--brand-secondary);
  font-size: 0.83333333rem;
  padding-right: 1.66666667rem;
}
.ticket-selection-list .tracker-comments-warp .tracker::before {
  content: '\e64a';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.ticket-selection-list .tracker-comments-warp .tracker::before {
  display: inline-block;
  font-size: 1.33333333rem;
  padding-right: 0.41666667rem;
  vertical-align: middle;
}
.ticket-selection-list .tracker-comments-warp .to-prematch {
  color: #0d9737;
  color: var(--brand-secondary);
  font-size: 0.83333333rem;
}
.ticket-selection-list .tracker-comments-warp .to-prematch .arrow {
  margin-right: 0.5rem;
}
.ticket-selection-list .tracker-comments-warp .to-prematch .arrow::before {
  content: '\e669';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.ticket-selection-list .tracker-comments-warp .to-prematch .arrow::before {
  color: #0d9737;
  color: var(--brand-secondary);
  display: inline-block;
  font-size: 1.066rem;
  vertical-align: middle;
}
.ticket-selection-list .gray {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  text-align: right;
}
.ticket-selection-list .gray.colon:after {
  content: ':';
}
.ticket-selection-list .score em {
  font-weight: bold;
}
.ticket-selection-list .score p {
  color: #000000;
  color: var(--text-default);
  display: inline-block;
}
.ticket-selection-list .status {
  color: #353a45;
  color: var(--text-type1-primary);
  /* font-size: 1.066rem; */
  font-weight: bold;
  line-height: 1;
}
.ticket-selection-list .status .question-mark {
  background: #9ca0ab;
  border-radius: 50%;
  color: #ffffff;
  color: var(--text-type2-primary);
  display: inline-block;
  font-weight: 900;
  height: 1.066rem;
  line-height: 1.066rem;
  text-align: center;
  width: 1.066rem;
}
.ticket-selection-list .status .delayed-icon {
  display: block;
  margin-top: 0.33333333rem;
  width: 1rem;
}
.ticket-selection-list .others {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.ticket-selection-list .won::before {
  content: '\e60b';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.ticket-selection-list .won::before {
  color: #43d66f;
  /* color: var(--brand-secondary); */
  font-size: 1.66666667rem;
  font-weight: normal;
  line-height: 1;
  padding-right: 1.25rem;
  position: relative;
  vertical-align: middle;
}
.ticket-selection-list .pick-info {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  margin-bottom: 0.58333333rem;
  padding: 0.41666667rem;
}
.ticket-selection-list .pick-info .pick-right::before {
  content: '\e611';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.ticket-selection-list .pick-info .pick-right:before {
  color: #0d9737;
  color: var(--brand-secondary);
  font-size: 1rem;
  margin-left: 0.41666667rem;
}
.ticket-selection-list .not-seperate {
  display: table-row;
}
.ticket-selection-list .not-seperate span {
  display: table-cell;
}
.ticket-selection-list .not-seperate span:last-child {
  color: #000000;
  color: var(--text-default);
  padding-left: 0.66666667rem;
}
.ticket-selection-list .not-seperate .banker {
  border: solid 0.08333333rem #0d9737;
  border-color: #0d9737;
  border-color: var(--brand-secondary);
  border-radius: 0.66666667rem;
  color: #0d9737;
  color: var(--brand-secondary);
  display: inline-block;
  font-weight: bold;
  height: 1.33333333rem;
  line-height: 1.33333333rem;
  margin-left: 0.25rem;
  text-align: center;
  width: 1.33333333rem;
}
.ticket-selection-list .to-live {
  border: 0.08333333rem solid #0d9737;
  border-color: #0d9737;
  border-color: var(--brand-secondary);
  border-radius: 0.16666667rem;
  color: #0d9737;
  color: var(--brand-secondary);
  height: 2.83333333rem;
  line-height: 2.83333333rem;
  text-align: center;
}
.ticket-selection-list .to-live .arrow::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.ticket-selection-list .to-live .arrow::before {
  color: #0d9737;
  color: var(--brand-secondary);
  font-size: 1.33333333rem;
  left: 0.83333333rem;
  margin-right: 1.25rem;
  position: relative;
  top: 0.16666667rem;
}
.m-nav-secondary {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #e41827;
  background-color: var(--brand-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #ffffff;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-shrink: 0;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  font-size: 1.33333333rem;
  height: 3.66666667rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  padding: 0 1.33333333rem 0 1.66666667rem;
  width: 100%;
}
.m-nav-secondary .m-nav-left {
  -webkit-box-align: end;
  -webkit-align-items: flex-end;
  -ms-flex-align: end;
  align-items: flex-end;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
}
.m-nav-secondary .m-nav-left .m-icon {
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
  margin-right: 1.58333333rem;
}
.m-nav-secondary .m-nav-left .m-icon :before {
  font-size: 1.33333333rem !important;
}
.m-nav-secondary .m-nav-left .m-icon.m-icon--back::before {
  content: '\e620';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-nav-secondary .m-nav-left .m-icon--close::before {
  content: '\e69a';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-nav-secondary .m-nav-left .m-icon--close :before {
  font-size: 1.5rem !important;
}
.m-nav-secondary.withHome {
  padding: 0 0 0 1.66666667rem;
}
.m-nav-secondary a :visited,
.m-nav-secondary a :active,
.m-nav-secondary a :link,
.m-nav-secondary a :hover {
  color: #ffffff;
  color: var(--text-type2-primary);
  text-decoration: none;
}
.m-nav-secondary .title {
  font-size: 1.66666667rem;
  line-height: 2rem;
}
.m-nav-secondary .title.small-font-height {
  font-size: 1.066rem;
  line-height: 1.5rem;
}

.m-nav-secondary .info-container {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
}
.m-nav-secondary .m-nav-right {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
}

.root {
  display: inline-block;
  position: relative;
}
.won::before {
  content: '\e60b';
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.won::before {
  color: #0D9737;
  color: var(--brand-secondary);
  font-size: 1.66666667rem;
  font-weight: normal;
  line-height: 1;
  padding-right: 1.25rem;
  position: relative;
  vertical-align: middle;
}
.not-start,
.on-going {
  color: #353A45;
}
.void,
.refund-all {
  color: #9CA0AB;
}
.won,
.flash-win,
.flash-save,
.early-payout,
.early-goal {
  color: #0D9737;
}
.delayed {
  bottom: -0.25rem;
  position: absolute;
  right: -0.25rem;
}
 svg.delayed circle {
  fill: #353A45;
}
 svg.delayed path {
  fill: #FAFAFA;
}

</style>
