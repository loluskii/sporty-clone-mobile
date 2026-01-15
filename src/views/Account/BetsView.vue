<template>
  <div class="m-sportBets">
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
      @view-detail="handleViewDetail"
      @back="activeTab = 'all_bets'"
    />
  </div>
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



const activeTab = ref('open_bets')
const selectedBet = ref(null)

// Component map for dynamic switching
const componentMap = {
  open_bets: OpenBets,
  all_bets: AllBets,
  bet_detail: BetDetail
}

const currentComponent = computed(() => componentMap[activeTab.value] || OpenBets)

const betData = ref([])
const isLoading = ref(true)
const { isAuthenticated } = useAuthStore()
const { SportsbookGlobalVariable } = useUtilsStore()
const {balance} = useUsersStore()
const showCashoutModal = ref(false)
const cashoutData = ref({})
const cashingOut = ref(false)
const codes = ref([])
const router = useRouter()
const route = useRoute()

async function getBetsData(status = -1) {
  isLoading.value = true
  try {
    const res = await getBets({status: status})
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
  const res = await performCashout({
    betId: cashoutData.value.id,
    amount: cashoutData.value.cashOutAmount
  })
  cashingOut.value = false
  showCashoutModal.value = false

  if (res.success) {
    console.log('cashout successful')
    emitter.emit('showDialogueToaster', 'Cashout Successful!')
    await getBetsData()
  } else {
    emitter.emit('showDialogueToaster', res.message)
  }
}

function handleViewDetail(bet) {
  if (bet) {
    selectedBet.value = bet
  }
  activeTab.value = 'bet_detail'
}

function setActiveTab(tab) {
  activeTab.value = tab
  if (!isAuthenticated) return
  if (tab === 'open_bets') {
    getBetsData(-1)
  } else if (tab === 'all_bets') {
    getBetsData('')
  }
}

onMounted(async () => {
  getCodes()
  if (isAuthenticated) {
    getBetsData(-1)
  }
})

</script>

<style>
@import url('@/assets/css/bet-history.css');
.m-btn--text + .m-btn {
  margin-top: 1.66666667rem;
}
</style>
