<template>
  <div class="m-sportBets" v-if="activeTab !=='bet_detail'">
    <div style="width: 100%; height: 87px"></div>
    <div class="fixed-wrap" style="position: fixed; top: 0rem; z-index: 1000; width: 100%">
      <div>
        <div class="m-openbet-header">
          <div v-if="isAuthenticated" class="is-login">
            <span class="balance"
              ><span>{{ SportsbookGlobalVariable.CurrencyCode }} </span>
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
            <span data-cms-key="open_bets">Open Bets</span>
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
      @view-detail="handleViewDetail"
      @fetch-bets="handleFetchBets"
      @back="activeTab = 'all_bets'"
    />
  </div>
  <bet-detail v-else :bet="selectedBet" :isAuthenticated="isAuthenticated" @reset="resetView" />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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

const betData = ref([])
const isLoading = ref(true)
const { isAuthenticated } = useAuthStore()
const { SportsbookGlobalVariable } = utilsStore
const {balance} = useUsersStore()
const showCashoutModal = ref(false)
const cashoutData = ref({})
const cashingOut = ref(false)
const codes = ref([])

async function getBetsData(status) {
  isLoading.value = true
  console.log(status)
  try {
    const payload = status === '' ? {perPage: 20} : { status: -1 }
    const res = await getBets(payload)
    betData.value = res?.data?.data || []
  } catch (error) {
    betData.value = []
  } finally {
    isLoading.value = false
  }
}

async function getCodes() {
  let payload = {
    from: getNext7Days()[0],
    to: getNext7Days()[7],
    betType: 0
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
    await getBetsData('')
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

function setActiveTab(tab) {
  isLoading.value = true
  betData.value = []
  activeTab.value = tab
  if (!isAuthenticated) return
  if (tab === 'open_bets') {
    getBetsData(-1)
  } else if (tab === 'all_bets') {
    getBetsData('')
  }
}

function resetView(){
  localStorage.removeItem('betDetail')
  activeTab.value = 'all_bets'
  if (!isAuthenticated) return
  getBetsData('')
}

function handleFetchBets(statusKey) {
  if (activeTab.value !== 'all_bets') return
  if (statusKey === -1) {
    getBetsData(-1)
    return
  }
  getBetsData('')
}

onMounted(() => {
  if (isAuthenticated) {
    if (activeTab.value === 'all_bets') {
      getBetsData('')
    }else {
      getBetsData(-1)
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
