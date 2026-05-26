<template>
  <div class="m-bethistory">
    <template v-if="isAuthenticated">
      <div class="m-order">
        <div>
          <div id="order-new-tabs-wrapper" class="tabs-wrapper">
            <div class="m-l-left flex">
              <ul class="m-uc-nav m-order-select-nav">
                <li
                  v-for="status in betStatus"
                  :key="status"
                  class="m-nav-item"
                  @click="setBetStatus(status.key)"
                  :class="activeBetStatus === status.key ? 'm-nav-item--active' : ''"
                >
                  <span>{{ status.name }}</span>
                </li>
              </ul>
            </div>
            <div class="m-l-right all-dates" @click="showDateDrawer = true">
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-three-dots"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"
                  />
                </svg>
              </span>
            </div>
          </div>
          <div v-if="!props.isLoading && Object.keys(settledBets).length">
            <div class="m-scroll list-wrapper" style="position: relative">
              <div v-for="(group, index) in settledBets" :key="index">
                <div class="ticket-list">
                  <div class="date">
                    <div class="day">{{ betlistformatDate(index, 'D') }}</div>
                    <div class="month" data-cms-key="nov" data-cms-page="common_dates">
                      {{ betlistformatDate(index, 'MMM') }}
                    </div>
                  </div>
                  <div class="place"></div>
                  <div class="list">
                    <template v-for="(bet, b) in group" :key="b">
                      <div
                        class="bar"
                        @click="redirectToBet(bet)"
                        :class="
                          bet.status == 1 || bet.status == 4 || bet.status == 5
                            ? 'win'
                            : bet.status == 0
                              ? 'lost'
                              : 'pending'
                        "
                      >
                        <span class="type"
                          ><span
                            >{{ betTypeDescription(bet) }}&nbsp;
                            {{ bet.isBooked === 2 ? '(SIM)' : '' }}</span
                          >
                        </span>
                        <span class="status"
                          ><span>{{ bet.statusDescription }}</span> <i class="arrow"></i
                        ></span>
                      </div>

                      <div class="title">
                        <span>Total Stake({{ SportsbookGlobalVariable.Currency }})</span>
                        <span class="total_info" style="color: #9ca0ab;">{{ formatNumber(bet.stake) }}</span>
                      </div>
                      <div class="title">
                        <span data-op="history-stake-amount">Total Return</span>
                        <span data-op="history-return-amount" class="total_info" :style="[1,4,5].includes(bet.status) ? 'color: #0d9737;':'color: #9ca0ab;'" style="font-weight: bold; font-size: 20px;">{{
                          bet.status === 1
                            ? formatNumber(bet.possibleWin)
                            : bet.status === 4 || bet.status === 5
                              ? formatNumber(bet.cashoutAmount)
                              : bet.status === -1 ? '--':'0.00'
                        }}</span>
                      </div>
                      <hr />
                      <bet-history-match-list :matches="bet.selections"></bet-history-match-list>
                      <div class="narrow">
                        <hr />
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              <div ref="loadMoreSentinel" class="load-more-sentinel" aria-hidden="true"></div>
              <div v-if="isLoadingMore" class="load-more-status">Loading more…</div>
              <div v-else-if="!hasMore && Object.keys(settledBets).length" class="load-more-status load-more-status--end">
                No more bets
              </div>
            </div>
          </div>
          <div v-if="!props.isLoading && !Object.keys(settledBets).length" class="m-list-none-wrap">
            <div class="m-list-none" style="padding: 5rem 0 7.33333333rem; text-align: center">
              <span class="no-list-txt">No Tickets Available.</span>
            </div>
          </div>
          <LoadingSpinner v-if="props.isLoading" />
        </div>
        <div class="fullscreen-wrapper">
          <div class="drawer" v-show="showDateDrawer">
            <div
              class="drawer__mask"
              @click="showDateDrawer = false"
              style="background-color: black"
            ></div>
            <div class="drawer__content bottom" style="transition-timing-function: ease">
              <div class="drawer-container">
                <div class="option-wrapper">
                  <div class="icon">
                    <div class="icon-font-base" style="font-size: 1.33333rem">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        fill="currentColor"
                        class="bi bi-calendar"
                        viewBox="0 0 16 16"
                      >
                        <path
                          d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div class="text">
                    <span data-cms-key="filter_by_date" data-cms-page="bet_history"
                      >Filter by Date</span
                    >
                  </div>
                </div>
                <div class="option-wrapper">
                  <VueDatePicker
                    v-model="range"
                    range
                    input-class-name="dp-custom-input"
                    placeholder="Select Date"
                    :enable-time-picker="false"
                    @update:model-value="handleDate"
                  ></VueDatePicker>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <div v-else class="m-error-wrapper">
      <div>
        <span class="m-error-msg" data-cms-key="please_log_in_to_see_your_bet_history"
          >Please Log In to see your Bet History</span
        >
        <div class="m-btn">Login</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import _ from 'lodash'
import moment from 'moment'
import { formatNumber } from '@/helpers'
import { useUtilsStore } from '@/stores'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import BetHistoryMatchList from '@/components/BetHistoryMatchList.vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const emit = defineEmits(['view-detail', 'fetch-bets', 'load-more'])
const props = defineProps({
  bets: {
    type: Array,
    default: () => []
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  isLoadingMore: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: false
  }
})

const loadMoreSentinel = ref(null)
let scrollObserver = null

function setupScrollObserver() {
  if (typeof IntersectionObserver === 'undefined') return
  if (scrollObserver) {
    scrollObserver.disconnect()
  }
  if (!loadMoreSentinel.value) return
  scrollObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0]
      if (!entry || !entry.isIntersecting) return
      if (props.isLoading || props.isLoadingMore || !props.hasMore) return
      emit('load-more')
    },
    { rootMargin: '200px 0px' }
  )
  scrollObserver.observe(loadMoreSentinel.value)
}

onMounted(() => {
  nextTick(setupScrollObserver)
})

onBeforeUnmount(() => {
  if (scrollObserver) {
    scrollObserver.disconnect()
    scrollObserver = null
  }
})

watch(
  () => [props.hasMore, props.bets.length],
  () => {
    nextTick(setupScrollObserver)
  }
)

const { SportsbookGlobalVariable } = useUtilsStore()

const betStatus = [
  { name: 'All', key: '' },
  { name: 'Settled', key: 'settled' },
  { name: 'Unsettled', key: -1 }
]
const activeBetStatus = ref('')
const showDateDrawer = ref(false)
const range = ref('')

const getDateWithoutTime = (dateString) => {
  const dateObject = new Date(dateString)
  const day = dateObject.getDate()
  const month = dateObject.getMonth() + 1
  const year = dateObject.getFullYear()
  return `${year}-${month}-${day}`
}


const betTypeDescription = (bet) => {
    switch (bet.betType) {
        case "flex":
            return `Flex (${bet.flex.min_wins}+ of ${bet.flex.original_legs})`
            break;
    
        default:
            return bet.betType[0].toUpperCase() + bet.betType.slice(1);
            break;
    }
}

function redirectToBet(bet) {
  localStorage.setItem('betDetail', JSON.stringify(bet))
  emit('view-detail', bet)
}

function setBetStatus(status) {
  activeBetStatus.value = status
  emit('fetch-bets', status)
}

const betlistformatDate = (date, n) => {
  const fixDateForAllBrowsers = date.replace(/-/g, '/')
  const d = new Date(fixDateForAllBrowsers)
  return moment(d).format(n)
}

const handleDate = () => {
  showDateDrawer.value = false
}

const filteredBets = computed(() => {
  let list = Array.isArray(props.bets) ? props.bets : []

  if (Array.isArray(range.value) && range.value.length === 2) {
    const start = moment(range.value[0]).startOf('day')
    const end = moment(range.value[1]).endOf('day')
    list = list.filter((bet) => {
      const created = moment(bet.created)
      return created.isSameOrAfter(start) && created.isSameOrBefore(end)
    })
  }

  return list
})

const settledBets = computed(() => {
  return _.groupBy(filteredBets.value, (item) => getDateWithoutTime(item.created))
})
</script>

<style>
@import url('@/assets/css/bet-history.css');
/* .m-uc-nav {
  height: 4rem;
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  position: relative;
  z-index: 1;
}
.m-uc-nav .m-nav-item {
  font-size: 1.066rem;
  line-height: 4rem;
  width: 33.4%;
  text-align: center;
  text-transform: capitalize;
  color: #1b1e25;
  color: var(--text-type1-tertiary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
} */
/* .m-uc-nav .m-nav-item--active {
  font-weight: bold;
  border-bottom: 0.25rem solid #0d9737;
  border-color: #0d9737;
  border-color: var(--brand-secondary);
} */

.m-order .list-wrapper {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 1rem 1rem 0 1rem;
}

.m-order .load-more-sentinel {
  height: 1px;
  width: 100%;
}

.m-order .load-more-status {
  color: #9ca0ab;
  font-size: 0.92rem;
  padding: 1.25rem 0 1.5rem;
  text-align: center;
}

.m-order .load-more-status--end {
  color: #9ca0ab;
  opacity: 0.7;
}

.m-order .m-scroll {
  height: auto;
}

.m-order .m-scroll .only-win {
  height: 3.33333333rem;
  text-align: right;
}

.m-order .m-scroll .only-win .text {
  color: #000000;
  color: var(--text-default);
  font-size: 1rem;
  margin-right: 0.75rem;
  vertical-align: super;
}

.m-order .m-scroll .only-win .outter,
.m-order .m-scroll .only-win .inner {
  display: inline-block;
}

.m-order .m-scroll .only-win .outter {
  border: 0.08333333rem solid #0d9737;
  height: 1.66666667rem;
  line-height: 1.66666667rem;
  text-align: left;
  width: 2.58333333rem;
}

.m-order .m-scroll .only-win .outter .inner {
  background: #ffffff;
  border: 0.08333333rem solid #0d9737;
  height: 1.33333333rem;
  margin: 0.08333333rem 0.08333333rem 0 0.08333333rem;
  width: 1.33333333rem;
}

.m-order .m-scroll .only-win .outter.off {
  background: #dcdee5;
}

.m-order .m-scroll .only-win .outter.on {
  background: #33ea6a;
  text-align: right;
}

.m-order .m-scroll .wide {
  border-top: 0.08333333rem solid #eaecef;
  border-color: #eaecef;
  border-color: var(--brand-border-type1);
  margin-top: -0.83333333rem;
  padding-top: 0.83333333rem;
}

.m-order .m-scroll .year {
  color: #000000;
  color: var(--text-default);
  /* font-size: 1.066rem; */
  margin-bottom: 1rem;
  margin-top: 2.5rem;
  text-align: center;
}

.m-order .m-scroll .ticket-list {
  display: table-row;
}

.m-order .m-scroll .ticket-list .date {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  display: table-cell;
}

.m-order .m-scroll .ticket-list .date.hide {
  visibility: hidden;
}

.m-order .m-scroll .ticket-list .date .day {
  font-size: 1.5rem;
  font-weight: bold;
}

.m-order .m-scroll .ticket-list .date .month {
  font-size: 1rem;
}

.m-order .m-scroll .ticket-list .place {
  display: table-cell;
  width: 2.5rem;
}

.m-order .m-scroll .ticket-list .list {
  display: table-cell;
  padding-bottom: 0.83333333rem;
  position: relative;
  width: 90%;
}

.m-order .m-scroll .ticket-list .list.no-border {
  border-width: 0px;
}

.m-order .m-scroll .ticket-list .list .bar {
  background-color: #1b1e25;
  background-color: var(--c-bet-history-status-bar-running-bg);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #fafafa;
  color: var(--background-general-primary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-weight: 500;
  height: 2rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  line-height: 2rem;
  padding: 0 0.75rem;
}

.m-order .m-scroll .ticket-list .list .bar .type {
  font-size: 1.13333333rem;
}

.m-order .m-scroll .ticket-list .list .bar .block::before {
  background: #e41827;
  background: var(--warning-primary);
  content: '';
  display: inline-block;
  height: 1rem;
  margin-right: 0.41666667rem;
  vertical-align: middle;
  width: 1rem;
}

.m-order .m-scroll .ticket-list .list .bar .cup::before {
  content: '\e626';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-order .m-scroll .ticket-list .list .bar .cup::before {
  font-size: 1.33333333rem;
  color: #ffffff;
  display: inline-block;
  margin-right: 0.41666667rem;
}

.m-order .m-scroll .ticket-list .list .bar .status {
  /* font-size: 1.066rem; */
}

.m-order .m-scroll .ticket-list .list .bar .status .arrow::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-order .m-scroll .ticket-list .list .bar .status .arrow::before {
  font-size: 0.83333333rem;
  left: 0.66666667rem;
  padding-right: 0.41666667rem;
  position: relative;
}

.m-order .m-scroll .ticket-list .list .win {
  background: #0d9737;
  color: #ffffff;
}

.m-order .m-scroll .ticket-list .list .win .status i.arrow::before {
  color: #ffffff;
  color: var(--brand-tertiary);
}

.m-order .m-scroll .ticket-list .list .lost {
  background: #9ca0ab;
  color: #ffffff;
  color: var(--text-type2-primary);
}

.m-order .m-scroll .ticket-list .list .title {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 0.91666667rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  margin-top: 0.75rem;
}

.m-order .m-scroll .ticket-list .list .total_info {
  color: #353a45;
  color: var(--text-type1-primary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-weight: bold;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  padding: 0 0.75rem;
}

.m-order .m-scroll .ticket-list .list .total_info .green {
  color: #0d9737;
  color: var(--brand-quaternary);
  font-size: 1.66666667rem;
}

.m-order .m-scroll .ticket-list .list .flexibet-title {
  padding: 0 0.75rem;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 0.83333333rem;
  margin-bottom: 0.66666667rem;
  margin-top: 0.41666667rem;
}

.m-order .m-scroll .ticket-list .list .flexibet-title i {
  background-color: #33ea6a;
  color: #ffffff;
  color: var(--brand-tertiary);
  display: inline-block;
  /* font-size: 1.066rem; */
  font-weight: 700;
  line-height: 1;
  margin-right: 0.58333333rem;
  padding: 1px 0 1px 3px;
  padding-right: 0.41666667rem;
  position: relative;
  vertical-align: middle;
}

.m-order .m-scroll .ticket-list .list .flexibet-title i:after {
  background: #33ea6a;
  content: ' ';
  display: block;
  height: 100%;
  position: absolute;
  right: -2px;
  top: 0;
  -webkit-transform: skew(-12deg);
  -ms-transform: skew(-12deg);
  transform: skew(-12deg);
  width: 4px;
}

.m-order .m-scroll .ticket-list .list .teams li {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  /* font-size: 1.066rem; */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 18.75rem;
}

.m-order .m-scroll .ticket-list .list .pending-statement {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 0.83333333rem;
  margin-left: 0.75rem;
  margin-top: 0.75rem;
}

.m-order .m-scroll .ticket-list .list .narrow {
  border-bottom: 0.08333333rem solid #eaecef;
  border-color: #eaecef;
  border-color: var(--brand-border-type1);
  margin-top: 0.75rem;
}

.m-order .m-scroll .ticket-list .list .order-boost {
  color: #353a45;
  color: var(--text-type1-primary);
  font-size: 0.83333333rem;
  line-height: 1.33333333rem;
  padding-left: 0.75rem;
}

.m-order .m-scroll .ticket-list .list .order-boost .boost-icon {
  margin-top: -0.25rem;
}

.m-order .m-scroll .nomore {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 0.83333333rem;
  text-align: center;
}

.m-order .m-scroll .view-more {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  margin-left: -1rem;
  padding-right: 2.41666667rem;
  text-align: center;
  width: 100%;
}

.m-order .m-scroll .view-more p {
  padding-left: 3.33333333rem;
}

.m-order .m-scroll .view-more .view-more-text {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  padding-top: 1.25rem;
}

.m-order .m-scroll .view-more .view-more-btn {
  color: #3656a3;
  padding-bottom: 1.25rem;
}

.m-order .m-scroll .view-more .view-more-btn .icon::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-order .m-scroll .view-more .view-more-btn .icon:before {
  font-size: 1rem;
  margin-left: 0.41666667rem;
}

.m-order .tabs-wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: table;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  display: grid;
  grid-template-columns: 1fr 10rem;
  width: 100%;
}

.m-order .tabs-wrapper .m-l-left,
.m-order .tabs-wrapper .m-l-right {
  display: table-cell;
  vertical-align: middle;
}

.m-order .tabs-wrapper .m-l-left {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  min-width: 1%;
}

.m-order .tabs-wrapper .m-l-right {
  width: 10rem;
}

.m-order .edit-bet-button {
  bottom: 1.66666667rem;
  color: #0d9737;
  color: var(--brand-secondary);
  position: absolute;
  right: 0px;
}
</style>
