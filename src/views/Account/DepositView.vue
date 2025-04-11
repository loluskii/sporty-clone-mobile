<template>
  <div id="deposit">
    <HeaderOther :header-title="'Deposit'"></HeaderOther>
    <form v-if="!isLoading" class="m-dp-container">
      <div class="m-tabs m-tabs-no-animation" has-right-btn="true">
        <div class="m-tabs-nav">
          <div class="m-tabs-ink-bar" style="display: block; left: 0px"></div>
          <div
            v-for="(method, index) in depositMethods"
            :class="activeTab == method.provider ? 'm-tabs-tab-active' : ''"
            :key="index"
            class="m-tabs-tab"
            @click="setActiveTab(method.provider)"
          >
            <span style="text-transform: capitalize">{{ method.provider === 'sbengine' ? 'Shop' : method.provider }}</span>
          </div>
        </div>
        <div class="m-tabs-content" style="transform: translateX(0%) translateZ(0px)">
          <div class="deposit-footer deposit-footer--bank-transfer" style="">
            <img
              src="@/assets/images/monnify.svg"
              v-show="activeTab == 'monnify'"
              alt=""
              style="height: 23px"
              srcset=""
            />
            <img src="@/assets/images/paystack.png" v-show="activeTab == 'paystack'" alt="" style="height: 30px" srcset="" />
            <img src="@/assets/images/flutterwave.png" v-show="activeTab == 'flutterwave'" alt="" style="height: 30px" srcset="" />
            <img src="@/assets/images/korapay.png" v-show="activeTab == 'korapay'" alt="" style="height: 30px" srcset="" />
            <br /><br />
            <div class="balance-container">
              <div class="balance-section balance-section--bank-transfer">
                <span class="balance-text balance-text--bank-transfer"
                  ><span data-cms-key="balance">Balance</span> (NGN) {{ balance }}
                </span>
              </div>
            </div>
            <div class="input-container">
              <div
                class="deposit-amount m-input-wap-wrapper m-input-wap-group m-input-wap-group--prepend"
              >
                <div class="m-input-wap-prepend m-input-wap-prepend--default">
                  <span class="amount-prepend"
                    ><span data-cms-key="amount">Amount</span>
                    (NGN)
                  </span>
                </div>
                <i class="m-input-wap-icon m-input-wap-icon--clickable m-icon-delete"></i>
                <input
                  type="number"
                  v-model="amount"
                  name=""
                  placeholder="min. 100"
                  class="m-input-wap"
                />
              </div>
            </div>

            <span class="error-msg"> </span>
            <button
              v-if="availableBonus && !bonus"
              class="af-button deposit-submit af-button--primary"
              :class="amount == '' ? ' is-disabled' : ''"
              @click.prevent="activateBonus"
              :disabled="amount === ''"
            >
              <span>Activate Bonus</span>
            </button>
            <button
              class="af-button deposit-submit af-button--primary"
              :class="amount == '' || isLoading ? ' is-disabled' : ''"
              @click.prevent="beginDeposit"
            >
              <span><span> Top Up Now </span></span>
            </button>
            <p v-if="bonus">
              You have activated <strong>{{ availableBonus?.name }}</strong
              >. Complete payment to receive <strong>{{ formatNumber(bonus?.amount) }}</strong> in
              your bonus account.
            </p>
          </div>
        </div>
      </div>
    </form>
    <LoadingSpinner v-else></LoadingSpinner>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import HeaderOther from '../../components/HeaderOther.vue'
import { useUsersStore } from '@/stores'
import { getPaymentMethods, getDepositURL } from '@/helpers'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import emitter from '../../plugins/emitter'
import { CLIENT_ID, checkFirstDeposit, formatNumber } from '../../helpers'

const activeTab = ref('')
const depositMethods = ref([])
const { currentUser } = useUsersStore()
const router = useRouter()
const amount = ref('')
const isLoading = ref(false)
const availableBonus = ref(null)

const usersStore = useUsersStore()

const balance = computed(() => {
  return parseFloat(usersStore.balance).toFixed(2)
})

const bonus = computed(() => {
  return usersStore.bonus
})

function setActiveTab(method) {
  activeTab.value = method
  amount.value = ''
}

async function getPayments() {
  isLoading.value = true
  const res = await getPaymentMethods()
  depositMethods.value = res.data
  activeTab.value = res.data[0].provider
  isLoading.value = false
}

async function checkForBonus() {
  const resp = await checkFirstDeposit()
  if (resp.success) {
    availableBonus.value = resp.data
  }
}

function activateBonus() {
  let bonusAmount = amount.value
  if (availableBonus.value.type === 'flat') {
    bonusAmount = availableBonus.value.value
  } else {
    bonusAmount = (parseFloat(amount.value) * availableBonus.value.value) / 100
  }

  const bonus = {
    bonusId: availableBonus.value.bonusId,
    amount: bonusAmount,
    username: currentUser.username
  }
  usersStore.setActiveBonus(bonus)
  // availableBonus.value = null;
}

async function beginDeposit() {
  isLoading.value = true
  let payload = {
    amount: amount.value,
    paymentMethod: activeTab.value,
    clientId: CLIENT_ID
  }

  const res = await getDepositURL(payload)
  if (res.success) {
    window.location.href = res.data.link
  } else {
    emitter.emit('showErrorMessage', res)
    console.error(res)
  }
  // if(currentUser.email){
  // }else{
  //   emitter.emit('showErrorMessage', 'Please complete your profile first!')
  // }
}

onMounted(async () => {
  if (!currentUser) {
    return router.push({ name: 'sign-in' })
  }
  usersStore.setActiveBonus(null)

  await getPayments()
  await checkForBonus()
})
</script>

<style>
@import url('@/assets/css/deposit.css');
.af-button--primary {
  background: var(--brand-secondary);
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  float: right;
  font-size: 1.066rem;
  /* font-weight: bold; */
  /* height: 3.33333333rem; */
  width: 100%;
}
.bank-transfer-card {
  margin-bottom: 1.66666667rem;
  padding: 1rem 1.33333333rem 1.33333333rem;
  border-radius: 0.16666667rem;
}
.bank-transfer-card-title {
  margin-bottom: 1rem;
  text-align: center;
  font-size: 1.33333333rem;
}
.bank-transfer-card-steps {
  counter-reset: step-counter;
  list-style: none;
}
.bank-transfer-card-steps li {
  margin-bottom: 1rem;
  display: flex;
  counter-increment: step-counter;
}
.bank-transfer-card-steps li:before {
  content: 'Step ' counter(step-counter);
  margin-right: 1rem;
  color: #9ca0ab;
  display: block;
  min-width: 2.91666667rem;
}
.bank-transfer-card-steps li:last-child {
  margin-bottom: 0;
}

ol.bank-transfer-card-steps {
  padding: 0;
}
html[theme='dark'] {
  color: #fff;
  background-color: #1b1e25;
}

html,
html[theme='light'] {
  color: #000;
  background-color: #fafafa;
}

.m-tabs-tab-active{
  font-weight: bold;
  
}
</style>
