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
            <div v-if="!isLoading && Object.keys(settledBets).length">
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
                            bet.statusCode == 1 ? 'win' : bet.statusCode == 2 ? 'lost' : 'pending'
                          "
                        >
                          <span class="type"
                            ><span
                              >{{ bet.selections?.length > 1 ? 'Multiple' : 'Single' }}&nbsp;
                              {{ bet.isSim ? '(SIM)' : '' }}</span
                            >
                          </span>
                          <span class="status"
                            ><span>{{ bet.statusDescription }}</span> <i class="arrow"></i
                          ></span>
                        </div>

                        <div class="title">
                          <span data-op="history-stake-text" data-cms-key="total_stake_vcurrency"
                            >Total Stake({{ SportsbookGlobalVariable.CurrencyCode }})</span
                          >
                          <span data-op="history-return-text" data-cms-key="total_return"
                            >Total Return</span
                          >
                        </div>
                        <div class="total_info">
                          <span data-op="history-stake-amount">{{ formatNumber(bet.stake) }}</span>
                          <span data-op="history-return-amount" class="">{{
                            bet.winnings ? formatNumber(bet.winnings) : '0.00'
                          }}</span>
                        </div>
                        <bet-history-match-list :matches="bet.selections"></bet-history-match-list>
                        <div class="narrow"></div>
                      </template>
                    </div>
                  </div>
                </div>
                <div style="width: 100%; opacity: 0; visibility: hidden"></div>
              </div>
            </div>
            <div v-if="!isLoading && !Object.keys(settledBets).length" class="m-list-none-wrap">
              <div class="m-list-none" style="padding: 5rem 0 7.33333333rem; text-align: center">
                <span class="no-list-txt">No Tickets Available.</span>
              </div>
            </div>
            <LoadingSpinner v-if="isLoading" />
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
import { computed, ref } from 'vue'
import _ from 'lodash'
import moment from 'moment'
import { formatNumber } from '@/helpers'
import { useUtilsStore } from '@/stores'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import BetHistoryMatchList from '@/components/BetHistoryMatchList.vue'
import VueDatePicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const emit = defineEmits(['view-detail'])
const props = defineProps({
  bets: {
    type: Array,
    default: () => []
  },
  isAuthenticated: {
    type: Boolean,
    default: false
  }
})

const isLoading = ref(false)
const { SportsbookGlobalVariable } = useUtilsStore()

const betStatus = [
  { name: 'All', key: '' },
  { name: 'Settled', key: 'settled' },
  { name: 'Unsettled', key: '0' }
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

function redirectToBet(bet) {
  localStorage.setItem('betDetail', JSON.stringify(bet))
  emit('view-detail', bet)
}

function setBetStatus(status) {
  activeBetStatus.value = status
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

  if (activeBetStatus.value === 'settled') {
    list = list.filter((bet) => bet.statusCode === 1 || bet.statusCode === 2)
  } else if (activeBetStatus.value === '0') {
    list = list.filter(
      (bet) => bet.statusCode === 0 || bet.statusDescription === 'Pending'
    )
  }

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
