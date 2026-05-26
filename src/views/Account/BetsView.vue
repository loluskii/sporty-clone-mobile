<template>
  <div class="m-sportBets" v-if="activeTab !=='bet_detail'">
    <div style="width: 100%; min-height: 87px"></div>
    <div class="fixed-wrap" style="position: fixed; top: 0rem; z-index: 1000; width: 100%">
      <div>
        <div class="m-openbet-header">
          <div v-if="isAuthenticated" class="is-login">
            <span class="balance"
              ><span>{{ SportsbookGlobalVariable.Currency }} </span>
              <span>{{ balance }}</span></span
            >
          </div>
          <div v-else class="no-login">
            <span @click="$router.push({ name: 'sign-up' })">Register</span>
            <span @click="$router.push({ name: 'sign-in' })">Login</span>
          </div>
        </div>
      </div>
      <div class="m-snap-nav-wrap m-list-nav-type m-bets--nav" style="overflow: hidden">
        <ul class="m-snap-nav flex" style="width: 100%">
          <li
            class="m-list-nav-type-item m-snap-nav-item"
            :class="{ active: activeTab === 'open_bets' }"
            @click="setActiveTab('open_bets')"
          >
            <span data-cms-key="open_bets">Open Bets {{ betData.length > 0 && activeTab === 'open_bets'  ? '('+betData.length+')' :'' }}</span>
          </li>
          <li
            :class="{ active: activeTab === 'all_bets' }"
            @click="setActiveTab('all_bets')"
            class="m-list-nav-type-item m-snap-nav-item"
          >
            <span>Bet History</span>
          </li>
        </ul>
        <i class="controls left-controls"></i>
        <i class="controls right-controls"></i>
      </div>
    </div>

    <component
      :is="currentComponent"
      :bets="betData"
      :bet="selectedBet"
      :isAuthenticated="isAuthenticated"
      :isLoading="isLoading"
      :isLoadingMore="isLoadingMore"
      :hasMore="hasMore"
      @view-detail="handleViewDetail"
      @fetch-bets="handleFetchBets"
      @load-more="handleLoadMore"
      @refresh-open-bets="handleRefreshOpenBets"
      @back="activeTab = 'all_bets'"
    />
  </div>
  <bet-detail v-else :bet="selectedBet" :isAuthenticated="isAuthenticated" @reset="resetView" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { getBets, getNext7Days, getCodeHubItems, performCashout } from '@/helpers'
import { useAuthStore, useUtilsStore, useUsersStore } from '@/stores'
import { useRoute, useRouter } from 'vue-router'
import OpenBets from '../../components/Bets/OpenBets.vue'
import AllBets from '../../components/Bets/AllBets.vue'
import BetDetail from '../../components/Bets/BetDetail.vue'
import emitter from '@/plugins/emitter'

const utilsStore = useUtilsStore()
const activeTab = computed({
  get: () => utilsStore.activeBetView || 'open_bets',
  set: (value) => {
    utilsStore.activeBetView = value
  }
})

// Component map for dynamic switching
const componentMap = {
  open_bets: OpenBets,
  all_bets: AllBets,
  bet_detail: BetDetail
}

const currentComponent = computed(() => componentMap[activeTab.value] || OpenBets)
const selectedBet = ref(null || JSON.parse(localStorage.getItem('betDetail')))

const PER_PAGE = 20
const betData = ref([])
const isLoading = ref(true)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
const currentBetStatus = ref('') // tracks the API status filter currently applied for all_bets
const { isAuthenticated } = useAuthStore()
const { SportsbookGlobalVariable } = utilsStore
const usersStore = useUsersStore()
const { balance } = storeToRefs(usersStore)
const showCashoutModal = ref(false)
const cashoutData = ref({})
const cashingOut = ref(false)
const codes = ref([])

function mapTabStatusToApi(statusKey) {
  if (statusKey === -1) return -1
  if (statusKey === 'settled') return [0, 1]
  return ''
}

async function getBetsData(status, options = {}) {
  const { silent = false, append = false, page = 1 } = options

  if (append) {
    if (!hasMore.value || isLoadingMore.value) return
    isLoadingMore.value = true
  } else if (!silent) {
    isLoading.value = true
  }

  try {
    const payload = { page, perPage: PER_PAGE }
    if (status !== '' && status !== null && status !== undefined) {
      payload.status = status
    }
    const res = await getBets(payload)
    const meta = res?.data || {}
    const newBets = meta.data || []

    if (append) {
      betData.value = [...betData.value, ...newBets]
    } else {
      betData.value = newBets
    }

    const nextPage = Number(meta.nextPage || 0)
    const lastPage = Number(meta.lastPage || 0)
    const returnedPage = Number(meta.currentPage || page)
    hasMore.value = nextPage > 0 || (lastPage > 0 && returnedPage < lastPage)
    currentPage.value = returnedPage
  } catch (error) {
    if (!silent && !append) {
      betData.value = []
    }
    hasMore.value = false
  } finally {
    if (append) {
      isLoadingMore.value = false
    } else if (!silent) {
      isLoading.value = false
    }
  }
}

async function getCodes() {
  let payload = {
    from: getNext7Days()[0]
  }
  const res = await getCodeHubItems(payload)
  codes.value = res.data.data.slice(0, 10)
}

function closeCashoutModal() {
  if (!cashingOut.value) {
    showCashoutModal.value = false
  } else {
    return
  }
}

function handleCashout(bet) {
  // console.log(bet);
  showCashoutModal.value = true
  cashoutData.value = bet
}

async function confirmCashout() {
  cashingOut.value = true
  const estimatedCashout = Number(cashoutData.value.estimatedCashout || cashoutData.value.cashOutAmount || 0)
  const percentRaw = estimatedCashout > 0 ? cashoutData.value.cashOutAmount / estimatedCashout : 0
  const res = await performCashout({
    betId: cashoutData.value.id,
    percent: Math.min(1, Math.max(0.1, percentRaw)),
    source: 'mobile'
  })
  cashingOut.value = false
  showCashoutModal.value = false

  if (res.success) {
    console.log('cashout successful')
    emitter.emit('showDialogueToaster', 'Cashout Successful!')
    currentPage.value = 1
    hasMore.value = false
    await getBetsData(currentBetStatus.value, { page: 1 })
  } else {
    emitter.emit('showDialogueToaster', res.message)
  }
}

function handleViewDetail(bet) {
  if (bet) {
    selectedBet.value = bet
    activeTab.value = 'bet_detail';
  }
}

function resetPagination() {
  currentPage.value = 1
  hasMore.value = false
  isLoadingMore.value = false
}

function setActiveTab(tab) {
  isLoading.value = true
  betData.value = []
  resetPagination()
  activeTab.value = tab
  if (!isAuthenticated) return
  if (tab === 'open_bets') {
    currentBetStatus.value = -1
    getBetsData(-1, { page: 1 })
  } else if (tab === 'all_bets') {
    currentBetStatus.value = ''
    getBetsData('', { page: 1 })
  }
}

function resetView(){
  localStorage.removeItem('betDetail')
  activeTab.value = 'all_bets'
  resetPagination()
  currentBetStatus.value = ''
  if (!isAuthenticated) return
  getBetsData('', { page: 1 })
}

function handleFetchBets(statusKey) {
  if (activeTab.value !== 'all_bets') return
  const apiStatus = mapTabStatusToApi(statusKey)
  currentBetStatus.value = apiStatus
  resetPagination()
  getBetsData(apiStatus, { page: 1 })
}

function handleLoadMore() {
  if (!hasMore.value || isLoadingMore.value || isLoading.value) return
  getBetsData(currentBetStatus.value, {
    page: currentPage.value + 1,
    append: true
  })
}

function handleRefreshOpenBets(options = {}) {
  if (activeTab.value !== 'open_bets' || !isAuthenticated) return
  getBetsData(-1, { silent: options.silent === true, page: 1 })
}

onMounted(() => {
  if (isAuthenticated) {
    if (activeTab.value === 'all_bets') {
      currentBetStatus.value = ''
      getBetsData('', { page: 1 })
    } else {
      currentBetStatus.value = -1
      getBetsData(-1, { page: 1 })
    }
  }
})

</script>

<style>
@import url('@/assets/css/bet-history.css');
.m-btn--text + .m-btn {
  margin-top: 1.66666667rem;
}
</style>
