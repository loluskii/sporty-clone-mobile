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
          :class="{ active: route.name === 'bets-view' }"
          @click="$router.push({ name: 'bets-view' })"
        >
          <span data-cms-key="open_bets">Open Bets</span>
        </li>
        <li
          :class="{ active: route.name === 'bet-history' }"
          @click="$router.push({ name: 'bet-history' })"
          class="m-list-nav-type-item m-snap-nav-item"
        >
          <span data-cms-key="bet_history">Bet History</span>
        </li>
      </ul>
      <i class="controls left-controls"></i>
      <i class="controls right-controls"></i>
    </div>
  </div>

    <component :is="currentComponent" :bets="betData" :isAuthenticated="isAuthenticated" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getBets } from '@/helpers'
import { useAuthStore, useUtilsStore, useUsersStore } from '@/stores'
import { useRoute, useRouter } from 'vue-router'
import OpenBets from '../../components/Bets/OpenBets.vue'
import AllBets from '../../components/Bets/AllBets.vue'



const activeTab = ref('open_bets')

// Component map for dynamic switching
const componentMap = {
  open_bets: OpenBets,
  all_bets: AllBets
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

async function changeView(data){
  activeTab.value = data // Update active tab to switch component
  try {
    let payload = {
      status: -1,
      page: '',
      perPage: 20
    }
    const res = await getBets(payload)
    betData.value = res.data.data
    isLoading.value = false
  } catch (error) {
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

onMounted(async () => {
  getCodes()
  if (isAuthenticated) {
    getBetsData()
  }
})

</script>

<style>
@import url('@/assets/css/bet-history.css');
.m-btn--text + .m-btn {
  margin-top: 1.66666667rem;
}
</style>
