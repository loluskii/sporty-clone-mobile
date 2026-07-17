<template>
    <div v-if="!isAuthenticated" class="m-error-wrapper" style="margin-top: 20px; text-align: center">
        <div>
            <span class="m-error-msg">Please Log In to see your Open Bets and Cashout Bets</span>
            <div class="m-btn" @click="$router.push('/sign-in')">Login</div>
        </div>
        <div v-if="codes.length" class="empty-recommended-code-container">
            <div class="recommended-code">
                <span data-cms-key="recommended_code" data-cms-page="cashout">Recommended Codes</span>
            </div>
            <div class="code-hub-list-item-container" style="position: relative">
                <CodeHubItem v-for="code in codes" :code="code" :key="code.betslipId" />
                <div class="mb-3"></div>
            </div>
        </div>
    </div>

    <div v-else style="margin-top: 20px">
        <template v-if="!hasOpenBets">
            <div v-if="!hasOpenBets && !props.isLoading">
                <div class="m-error-wrapper" style="text-align: center">
                    <span class="m-error-msg"> You currently have no Open Bets. </span>
                </div>
                <div v-if="codes.length" class="empty-recommended-code-container">
                    <div class="recommended-code">
                        <span data-cms-key="recommended_code" data-cms-page="cashout">Recommended Football Codes</span>
                    </div>
                    <div class="code-hub-list-item-container" style="position: relative">
                        <div class="m-loading-wrap m-loading-wrap__center">
                            <div class="m-loading light">
                                <div class="loading"></div>
                            </div>
                        </div>
                        <CodeHubItem v-for="code in codes" :code="code" :key="code.betslipId" />
                        <div class="mb-3"></div>
                    </div>
                </div>
            </div>
            <div v-if="props.isLoading">
                <LoadingSpinner />
            </div>
        </template>
        <div v-else class="m-openbet">
            <div class="m-sportsBet--bets cashout-loading">
                <ul class="m-bet-list">
                    <OpenBetItem
                        v-for="(bet, index) in openBets"
                        :key="bet.id || index"
                        :bet="bet"
                        :index="index"
                        @cashout="handleCashout"
                    />
                </ul>
            </div>
        </div>
        <CashoutPopup
            v-if="showCashoutModal"
            :cashout-data="cashoutData"
            @close="handleCashoutClose"
            @cashout-success="handleCashoutSuccess"
            @refresh-open-bets="handleRefreshOpenBets"
        />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import $ from 'jquery'
import { slugify, getNext7Days, getCodeHubItems } from '@/helpers'
import { useUsersStore } from '@/stores'
import CodeHubItem from '@/components/CodeHub/CodeHubItem.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import OpenBetItem from './OpenBetItem.vue'
import CashoutPopup from './CashoutPopup.vue'

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
    }
})
const emit = defineEmits(['refresh-open-bets'])

const router = useRouter()
const usersStore = useUsersStore()
const openBets = ref([])
const hasOpenBets = computed(() => openBets.value.length > 0)
const codes = ref([])
const showCashoutModal = ref(false)
const cashoutData = ref({})
const hiddenCashoutBetIds = ref(new Set())
const cashoutPollInterval = ref(null)
const POLL_INTERVAL = 30000 // Poll every 30 seconds

async function getCodes() {
    let payload = {
        from: getNext7Days()[0],
        to: getNext7Days()[7],
        betType: 0
    }
    const res = await getCodeHubItems(payload)
    codes.value = res.data.data.slice(0, 10)
}

function handleCashout(bet) {
    showCashoutModal.value = true
    cashoutData.value = bet
}

onMounted(() => {
    getCodes()
})

function handleCashoutClose() {
    showCashoutModal.value = false
}

function handleCashoutSuccess(payload = {}) {
    const betId = payload?.betId || cashoutData.value?.id
    if (betId) {
        hiddenCashoutBetIds.value = new Set([...hiddenCashoutBetIds.value, betId])
        openBets.value = openBets.value.filter((bet) => bet.id !== betId)
    }
    usersStore.loadCurrentUser().catch((error) => {
        console.warn('Failed to refresh user balance after cashout:', error)
    })
    emit('refresh-open-bets', { silent: true })
}

function handleRefreshOpenBets() {
    emit('refresh-open-bets', { silent: true })
}

function goToEvent(event) {
    if (!event.isLive) {
        return router.push({
            name: 'fixtures-detail',
            params: {
                sport: slugify(event.sport),
                tournament_name: slugify(event.tournament),
                event_name: slugify(event.eventName),
                event_id: event.matchId
            }
        })
    } else {
        return router.push({
            name: 'live-fixtures-detail',
            params: {
                sport: slugify(event.sport),
                tournament_name: slugify(event.tournament),
                event_name: slugify(event.eventName),
                event_id: event.matchId
            }
        })
    }
}

function showChild(e, index) {
    let y = $(e.target).hasClass('hide')
    if (y) {
        $(e.target).removeClass('hide')
    } else {
        $(e.target).addClass('hide')
    }
    $('#' + index + '_bop').toggleClass('d-none')
    $('#' + index + '_child').toggleClass('d-none')
}

watch(
    () => props.bets,
    (value) => {
        const bets = Array.isArray(value) ? value : []
        openBets.value = bets.filter((bet) => !hiddenCashoutBetIds.value.has(bet.id))
        if (showCashoutModal.value && cashoutData.value?.id) {
            const updatedCashoutBet = openBets.value.find((bet) => bet.id === cashoutData.value.id)
            if (updatedCashoutBet) {
                cashoutData.value = updatedCashoutBet
            }
        }
        // if (props.isAuthenticated) {
        //     isLoading.value = false
        // }
    },
    { immediate: true }
)

</script>

<style scoped>
.m-sportsBet--bets.cashout-loading>.m-bet-list {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    padding: 0.83333333rem 0.83333333rem;
    width: 100%;
    padding-bottom: 90px;
}
.no_bets {
    color: #353a45;
    color: var(--text-type1-primary);
    font-size: 1rem;
    line-height: 1.19333333rem;
    padding: 1.66666667rem 0 1.91666667rem;
    text-align: center;
}

.no_bets .content {
    margin-top: 0.66666667rem;
}

.none-login-wrapper .login-tip {
    margin: 0 auto;
    padding: 2.33333333rem 0;
    text-align: center;
}

.none-login-wrapper .login-tip .error-msg {
    color: #353a45;
    color: var(--text-type1-primary);
    display: block;
    font-size: 1rem;
    line-height: 1.58333333rem;
    margin: 0 auto 1.33333333rem;
    width: 17.08333333rem;
}

.none-login-wrapper .login-tip .login-btn {
    border: 1px solid var(--brand-secondary);
    border-radius: 0.25rem;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    color: var(--brand-secondary);
    display: inline-block;
    height: 2.33333333rem;
    line-height: 2.33333333rem;
    min-width: 4.66666667rem;
    padding: 0 0.58333333rem;
}

.empty-recommended-code-container .recommended-code {
    color: #353a45;
    color: var(--text-type1-primary);
    -webkit-box-align: center;
    -webkit-align-items: center;
    -ms-flex-align: center;
    align-items: center;
    display: -webkit-box;
    display: -webkit-flex;
    display: -ms-flexbox;
    display: flex;
    font-size: 1.33333333rem;
    font-weight: 700;
    padding-left: 0.66666667rem;
    padding-top: 2.66666667rem;
}

.empty-recommended-code-container .recommended-code span {
    display: inline-block;
    /* margin-left: 1rem; */
}

.empty-recommended-code-container .code-hub-list-item-container {
    padding-top: 0.66666667rem;
    padding-bottom: 0.66666667rem;
    position: relative;
}

.code-hub-list-item-container .code-hub-list-item-wrap+.code-hub-list-item-wrap {
    margin-top: 0.66666667rem;
}
</style>
