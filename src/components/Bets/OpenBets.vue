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
        <template v-if="!openBets">
            <div v-if="!openBets & !isLoading">
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
            <div v-if="isLoading">
                <LoadingSpinner />
            </div>
        </template>
        <div v-else class="m-openbet">
            <div class="m-sportsBet--bets cashout-loading">
                <ul class="m-bet-list">
                    <OpenBetItem v-for="(bet, index) in openBets" :key="index" :bet="bet" :index="index" @cashout="handleCashout" />
                </ul>
            </div>
        </div>
        <div v-if="showCashoutModal" class="m-sportBets m-cashout">
            <div id="j_pop_cashout" class="m-cashout-pop">
                <div class="m-mask"></div>
                <div class="m-container m-container-fix">
                    <div class="m-close" @click="closeCashoutModal"></div>
                    <div class="m-main">
                        <div class="m-head f-alg-side">
                            <div class="f-alg-side-item">
                                <div class="m-t-12 m-t-l16 m-t-gray">Stake</div>
                                <div class="m-t-14 m-t-l16 m-t-default">
                                    {{ cashoutData.stake.toFixed(2) }}
                                </div>
                            </div>
                            <div class="f-alg-side-item">
                                <div class="m-t-12 m-t-l16 m-t-gray">Pot. Win</div>
                                <div class="m-t-14 m-t-l16 m-t-default">
                                    {{ cashoutData.possibleWin.toFixed(2) }}
                                </div>
                            </div>
                        </div>
                        <div class="m-body instant">
                            <div class="m-t-center m-l-top">
                                <div class="m-t-20 m-t-default m-t-bold m-total">
                                    <span data-cms-key="partial_cashout" data-cms-page="cashout">Full Cashout
                                    </span>
                                    <div class="number-grow-warp">
                                        <span class="number-grow">{{ cashoutData.cashOutAmount.toFixed(2) }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="m-btn-wrapper">
                                <div>
                                    <button @click.prevent="confirmCashout" class="af-button af-button--primary">
                                        <span v-if="!cashingOut"><span>Confirm</span>
                                            <span class="money">
                                                {{ SportsbookGlobalVariable.CurrencyCode }}
                                                {{ cashoutData.cashOutAmount.toFixed(2) }}
                                            </span>
                                        </span>
                                        <img v-else src="/loader.gif" height="24" width="24" alt="" srcset="" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import $ from 'jquery'
import { getBets, formatNumber, fetchCashoutForBet, slugify, getNext7Days, getCodeHubItems, performCashout } from '@/helpers'
import { useUtilsStore } from '@/stores'
import emitter from '@/plugins/emitter'
import CodeHubItem from '@/components/CodeHub/CodeHubItem.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import OpenBetItem from './OpenBetItem.vue'

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

const router = useRouter()
const { SportsbookGlobalVariable } = useUtilsStore()

const openBets = ref(null)
const isLoading = ref(true)
const codes = ref([])
const showCashoutModal = ref(false)
const cashoutData = ref({})
const cashingOut = ref(false)
const cashoutPollInterval = ref(null)
const POLL_INTERVAL = 30000 // Poll every 30 seconds

async function getBetsData() {
    try {
        const res = await getBets({ status: -1, page: 1, perPage: 5 })
        openBets.value = res.data.data
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
    }
}

function handleCashout(bet) {
    showCashoutModal.value = true
    cashoutData.value = bet
}

// Poll cashout amounts for all open bets
async function pollCashoutAmounts() {
    if (!openBets.value || openBets.value.length === 0) return

    try {
        const updatedBets = await Promise.all(
            openBets.value.map(async (bet) => {
                const cashoutResponse = await fetchCashoutForBet({betId: bet.id, source: "mobile"})
                if (cashoutResponse && cashoutResponse.status_code === 200) {
                    return { ...bet, cashOutAmount: cashoutResponse.data.payout }
                }
                return bet
            })
        )
        openBets.value = updatedBets
    } catch (error) {
        console.error('Error polling cashout amounts:', error)
    }
}

function startCashoutPolling() {
    // Initial fetch
    pollCashoutAmounts()
    // Start interval
    cashoutPollInterval.value = setInterval(pollCashoutAmounts, POLL_INTERVAL)
}

function stopCashoutPolling() {
    if (cashoutPollInterval.value) {
        clearInterval(cashoutPollInterval.value)
        cashoutPollInterval.value = null
    }
}

onMounted(() => {
    getCodes()
    if (props.isAuthenticated) {
        getBetsData().then(() => {
            startCashoutPolling()
        })
    }
})

onUnmounted(() => {
    stopCashoutPolling()
})

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

</script>

<style scoped>
.m-sportsBet--bets.cashout-loading>.m-bet-list {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    padding: 0.83333333rem 0.83333333rem;
    width: 100%;
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