<template>
  <div id="me-container" style="min-height: 55%">
    <div class="me-main">
      <div class="header-container">
        <div class="header">
          <div class="account-wrap" @click="redirectToAccount">
            <span class="user">
              <img
                data-v-7405fc91=""
                src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDkiIGhlaWdodD0iNDkiIHZpZXdCb3g9IjAgMCA0OSA0OSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik0yNC40MDQ4IDQ0LjkzNzdDMzUuNTg4NiA0NC45Mzc3IDQ0LjY1NDggMzUuODcxNSA0NC42NTQ4IDI0LjY4NzdDNDQuNjU0OCAxMy41MDQgMzUuNTg4NiA0LjQzNzc0IDI0LjQwNDggNC40Mzc3NEMxMy4yMjEgNC40Mzc3NCA0LjE1NDc5IDEzLjUwNCA0LjE1NDc5IDI0LjY4NzdDNC4xNTQ3OSAzNS44NzE1IDEzLjIyMSA0NC45Mzc3IDI0LjQwNDggNDQuOTM3N1pNMjYuODY3NiAyMy4zNjA3QzI4LjgxMTcgMjIuMjk1MSAzMC4xNDM5IDIwLjExNTQgMzAuMTQzOSAxNy41OTk2QzMwLjE0MzkgMTQuMDMzOCAyNy40Njc0IDExLjE0MzEgMjQuMTY1NyAxMS4xNDMxQzIwLjg2NCAxMS4xNDMxIDE4LjE4NzQgMTQuMDMzOCAxOC4xODc0IDE3LjU5OTZDMTguMTg3NCAyMC4xMjMgMTkuNTI3NyAyMi4zMDgzIDIxLjQ4MTQgMjMuMzcwM0MxNS43NTEgMjQuODIxMyAxMy40MDQ4IDI5LjM2MjQgMTMuNDA0OCAzMi42NjQ5SDIzLjgyNThIMzUuNDA0OEMzNS40MDQ4IDI4LjQ2OCAzMS43NTcgMjQuNDEwMiAyNi44Njc2IDIzLjM2MDdaTTEzLjQwNDggMzIuNjY0OUMxNC4xMDE0IDM1LjgwNTEgMTguNzYwNyAzOC4yMzI0IDI0LjQwNDggMzguMjMyNEMzMC4wNDg4IDM4LjIzMjQgMzQuNzA4MSAzNS44MDUxIDM1LjQwNDggMzIuNjY0OUgxMy40MDQ4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg=="
              />
            </span>
            <div class="wording-wrap">
              <div class="account">
                {{ authStore.isAuthenticated ? userStore.currentUser?.username : 'Login to view' }}
              </div>
              <i class="m-icon-arrow1"></i>
            </div>
          </div>
          <div class="balance-wrap">
            <div class="title">Total Balance</div>
            <div data-op="me_balance" class="value">
                <span>{{ SportsbookGlobalVariable.Currency }} </span
                ><span> {{ userStore.balance }}</span>
            </div>
          </div>
          <div class="w-d-wrap">
            <div class="deposit" @click="$router.push({ name: 'account-deposit' })">
              <img src="@/assets/images/wallet.png" class="w-d-wrap-img" /><span>Deposit</span>
            </div>
            <div class="withdraw" @click="$router.push({ name: 'account-withdraw' })">
              <span>Withdraw</span>
            </div>
          </div>
        </div>
      </div>
      <div class="body">
        <div class="transaction-wrap">
          <div @click="$router.push({ name: 'bets-view' })" class="transaction-wrap-item history">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 10.5V9.99995C19 6.22876 18.9999 4.34311 17.8284 3.17154C16.6568 2 14.7712 2 11 2C7.22889 2 5.34326 2.00006 4.17169 3.17159C3.00015 4.34315 3.00013 6.22872 3.0001 9.99988L3.00006 14.5C3.00003 17.7874 3.00002 19.4312 3.90794 20.5375C4.07418 20.7401 4.25992 20.9258 4.46249 21.0921C5.56883 22 7.21255 22 10.5 22"></path>
              <path d="M7 7H15M7 11H11"></path>
              <path d="M18 18.5L16.5 17.95V15.5M12 17.5C12 19.9853 14.0147 22 16.5 22C18.9853 22 21 19.9853 21 17.5C21 15.0147 18.9853 13 16.5 13C14.0147 13 12 15.0147 12 17.5Z"></path>
          </svg>
            <span>Bet History</span>
          </div>
          <div
            @click="$router.push({ name: 'account-transactions' })"
            class="transaction-wrap-item transaction"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.5795 8.60699L2 8.45417C3.849 3.70488 9.15764 0.999849 14.3334 2.34477C19.8461 3.77722 23.1205 9.26153 21.647 14.5943C20.4283 19.0051 16.3433 21.9307 11.8479 22"></path>
                <path d="M12 22C6.5 22 2 17 2 11" stroke-dasharray="0.5 3"></path>
                <path d="M13.6039 9.72177C13.2524 9.35267 12.3906 8.48536 11.0292 9.10111C9.66784 9.71686 9.45159 11.698 11.5108 11.9085C12.4416 12.0036 13.0484 11.7981 13.6039 12.3794C14.1595 12.9607 14.2627 14.5774 12.8425 15.013C11.4222 15.4487 10.502 14.7292 10.2545 14.5041M11.9078 8.01953V8.81056M11.9078 15.1471V16.0195"></path>
            </svg>
            <span>Transactions</span>
          </div>
          <div class="transaction-wrap-item gift" @click="$router.push({ name: 'account-bonus' })">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
                <path d="M4 11V15C4 18.2998 4 19.9497 5.02513 20.9749C6.05025 22 7.70017 22 11 22H13C16.2998 22 17.9497 22 18.9749 20.9749C20 19.9497 20 18.2998 20 15V11" stroke-linecap="round"></path>
                <path d="M3 9C3 8.25231 3 7.87846 3.20096 7.6C3.33261 7.41758 3.52197 7.26609 3.75 7.16077C4.09808 7 4.56538 7 5.5 7H18.5C19.4346 7 19.9019 7 20.25 7.16077C20.478 7.26609 20.6674 7.41758 20.799 7.6C21 7.87846 21 8.25231 21 9C21 9.74769 21 10.1215 20.799 10.4C20.6674 10.5824 20.478 10.7339 20.25 10.8392C19.9019 11 19.4346 11 18.5 11H5.5C4.56538 11 4.09808 11 3.75 10.8392C3.52197 10.7339 3.33261 10.5824 3.20096 10.4C3 10.1215 3 9.74769 3 9Z"></path>
                <path d="M6 3.78571C6 2.79949 6.79949 2 7.78571 2H8.14286C10.2731 2 12 3.7269 12 5.85714V7H9.21429C7.43908 7 6 5.56091 6 3.78571Z"></path>
                <path d="M18 3.78571C18 2.79949 17.2005 2 16.2143 2H15.8571C13.7269 2 12 3.7269 12 5.85714V7H14.7857C16.5609 7 18 5.56091 18 3.78571Z"></path>
                <path d="M12 11L12 22" stroke-linecap="round"></path>
            </svg>
            <span>Bonus</span>
          </div>
        </div>
        <div class="list-wrap" v-if="authStore.isAuthenticated">
          <div
            class="item"
            @click="$router.push({ name: 'account-pending-withdrawals' })"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round">
              <path d="M8.5469 3.44865L13.9101 5.54728L13.9101 5.54728C17.0034 6.75771 18.55 7.36293 18.4988 8.32296C18.4475 9.28299 16.8334 9.7232 13.6051 10.6036C12.6439 10.8658 12.1633 10.9969 11.8301 11.3301C11.4969 11.6633 11.3658 12.1439 11.1036 13.1051C10.2232 16.3334 9.78299 17.9475 8.82296 17.9988C7.86293 18.05 7.25771 16.5034 6.04728 13.4101L6.04728 13.4101L3.94865 8.0469C2.68138 4.80831 2.04774 3.18901 2.86837 2.36837C3.68901 1.54774 5.30831 2.18138 8.5469 3.44865Z"></path>
              <path d="M17.9999 17.5C19.9329 17.5 21.4999 15.989 21.4999 14.125C21.4999 13.5037 20.9776 13 20.3333 13H15.6666C15.0223 13 14.4999 13.5037 14.4999 14.125C14.4999 15.989 16.0669 17.5 17.9999 17.5ZM17.9999 17.5C19.9329 17.5 21.4999 19.011 21.4999 20.875C21.4999 21.4963 20.9776 22 20.3333 22H15.6666C15.0223 22 14.4999 21.4963 14.4999 20.875C14.4999 19.011 16.0669 17.5 17.9999 17.5Z" stroke-linecap="round"></path>
          </svg>
            <div class="title" style="padding-left: 10px">
              <span>Pending Withdrawals</span>
            </div>

            <div class="item-img more icon-font-base" style="font-size: 1.33333rem"></div>
          </div>
          <div class="item" style="color: #ccc" @click="$router.push({ name: 'notifications' })">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3.00366C11.4383 3.01203 10.3789 3.03449 9.8294 3.07102C5.64639 3.34908 2.31441 6.72832 2.04024 10.9707C1.98659 11.8009 1.98659 12.6606 2.04024 13.4908C2.1401 15.0359 2.82343 16.4665 3.62791 17.6746C4.09501 18.5203 3.78674 19.5758 3.30021 20.4978C2.94941 21.1625 2.77401 21.4949 2.91484 21.735C3.05568 21.9752 3.37026 21.9828 3.99943 21.9981C5.24367 22.0284 6.08268 21.6757 6.74868 21.1846C7.1264 20.906 7.31527 20.7668 7.44544 20.7508C7.5756 20.7347 7.83177 20.8403 8.34401 21.0512C8.8044 21.2408 9.33896 21.3579 9.8294 21.3905C11.2536 21.4851 12.7435 21.4853 14.1706 21.3905C18.3536 21.1124 21.6856 17.7332 21.9598 13.4908C21.9915 13.0001 22.0044 12.4991 21.9987 11.9999"></path>
              <path d="M8.5 15H15.5M8.5 10H12"></path>
              <path d="M20.2649 7.27042L22 9M21.1714 5.08571C21.1714 3.38152 19.7899 2 18.0857 2C16.3815 2 15 3.38152 15 5.08571C15 6.78991 16.3815 8.17143 18.0857 8.17143C19.7899 8.17143 21.1714 6.78991 21.1714 5.08571Z"></path>
          </svg>
            <div class="title" style="padding-left: 10px">
              <span>Messages</span>
            </div>
            <div class="item-img more icon-font-base" style="font-size: 1.33333rem"></div>
          </div>
          <div
            class="item"
            style="color: #ccc"
            @click="$router.push({ name: 'cms-page', params: { page: 'contact_us' } })"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#ffffff" fill="none" stroke="#ffffff" stroke-width="1.5">
                <path d="M15 12C15 10.8954 15.8954 10 17 10C19.2091 10 21 11.7909 21 14C21 16.2091 19.2091 18 17 18C15.8954 18 15 17.1046 15 16V12Z"></path>
                <path d="M9 12C9 10.8954 8.10457 10 7 10C4.79086 10 3 11.7909 3 14C3 16.2091 4.79086 18 7 18C8.10457 18 9 17.1046 9 16V12Z"></path>
                <path d="M3 14V11C3 6.02944 7.02944 2 12 2C16.9706 2 21 6.02944 21 11V15.8462C21 17.8545 21 18.8586 20.6476 19.6417C20.2465 20.5329 19.5329 21.2465 18.6417 21.6476C17.8586 22 16.8545 22 14.8462 22H12" stroke-linecap="round" stroke-linejoin="round"></path>
            </svg>
            <div class="title" style="padding-left: 10px">
              <span>Contact Support</span>
            </div>
            <div class="item-img more icon-font-base" style="font-size: 1.33333rem"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore, useUsersStore, useUtilsStore } from '@/stores'
// import { formatNumber } from '@/helpers'
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUsersStore()
const { SportsbookGlobalVariable } = useUtilsStore()

function redirectToAccount() {
  router.push({ name: 'account-profile' })
}
defineComponent({
  name: 'me-view'
})
</script>

<style>
#me-container {
  /* background: var(--brand-background-secondary); */

  /* background: rgb(233, 45, 45); */
  background: linear-gradient(188deg, #6e0d18 0%, #1e1114 62%, #140b0e 100%);
}

.me-main .header-container {
  /* background: var(--brand-background-secondary);
  background: linear-gradient(
    176deg,
    var(--brand-background-secondary) 38%,
    rgba(255, 255, 255, 1) 100%
  ); */
  color: #ffffff;
  /* color: var(--text-type2-primary); */
  padding: 1.66666667rem 1.33333333rem;
}

.me-main .header-container .header {
  position: relative;
}

.me-main .header-container .header .account-wrap {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.33333333rem;
  height: 4.41666667rem;
  position: relative;
}

.me-main .header-container .header .account-wrap .user {
  border-radius: 50%;
  height: 5rem;
  margin-right: 0.66666667rem;
  overflow: hidden;
  width: 5rem;
}

.me-main .header-container .header .account-wrap .user img {
  height: 100%;
  vertical-align: top;
  width: 100%;
}

.me-main .header-container .header .account-wrap .wording-wrap {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
}

.me-main .header-container .header .account-wrap .wording-wrap .account {
  display: inline-block;
  font-weight: 500;
  margin-right: 0.66666667rem;
}

.me-main .header-container .header .account-wrap .wording-wrap .account .name {
  max-width: 50vw;
  overflow: hidden;
  position: relative;
  text-overflow: ellipsis;
}

.me-main .header-container .header .account-wrap .wording-wrap .account .phone {
  color: #9ca0ab;
  color: var(--text-type2-tertiary);
}

.me-main .header-container .header .account-wrap .wording-wrap .m-icon-arrow1 {
  color: #9ca0ab;
  color: var(--text-type2-tertiary);
}

.me-main .header-container .header .account-wrap .wording-wrap .m-icon-arrow1::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.me-main .header-container .header .account-wrap .wording-wrap .m-icon-arrow1:before {
  font-size: 1rem;
  line-height: 1rem;
}

.me-main .header-container .header .account-wrap .bell-icon {
  margin-right: 1.66666667rem;
}

.me-main .header-container .header .balance-wrap {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  flex-direction: column;
  font-size: 1.066rem;
  margin-top: 1.66666667rem;
  position: relative;
}

.me-main .header-container .header .balance-wrap .title {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  color: #fff;
  font-size: 1rem;
}

.me-main .header-container .header .balance-wrap .value {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  font-size: 1.833rem;
}

.me-main .header-container .header .balance-wrap .value .invisible {
  letter-spacing: 0.16666667rem;
  opacity: 0.5;
}

.me-main .header-container .header .w-d-wrap {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.066rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  margin-top: 1.66666667rem;
}

.me-main .header-container .header .w-d-wrap div.deposit {
  background-color: var(--brand-primary);
  font-weight: 500;
  height: 3rem;
  line-height: 3rem;
  text-align: center;
  width: calc(50% - 0.66666667rem);
}

.me-main .header-container .header .w-d-wrap div.withdraw {
  border: 1px solid white;
  font-weight: 500;
  height: 3rem;
  line-height: 3rem;
  text-align: center;
  width: calc(50% - 0.66666667rem);
  color: white;
}

.me-main .header-container .header .w-d-wrap div .w-d-wrap-img {
  height: 50%;
  margin-right: 1rem;
}

.me-main .header-container .header .w-d-wrap div .w-d-wrap-img + span {
  color: #ffffff;
}

.me-main .body {
  color: #fff;
}

.me-main .body .transaction-wrap {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  padding: 1.33333333rem;
  color: #fff;
}

.me-main .body .transaction-wrap-item {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  text-align: center;
  width: 8rem;
}

.me-main .body .transaction-wrap-item.gift {
  position: relative;
}

.me-main .body .transaction-wrap-item>svg {
  height: 1.66666667rem;
  margin-bottom: 0.66666667rem;
}

.me-main .body .list-wrap a.item {
  color: inherit;
}

.me-main .body .list-wrap .item {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.066rem;
  height: 4.08333333rem;
  padding: 0 0.66666667rem 0 1.66666667rem;
}

.me-main .body .list-wrap .item .item-img {
  margin-right: 1rem;
}

.me-main .body .list-wrap .item .item-img.more {
  color: #9ca0ab;
}

.me-main .body .list-wrap .item .title {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
}

.me-main .body .list-wrap .item .status {
  color: #0d9737;
  font-weight: 500;
  margin-right: 0.33333333rem;
}

.me-main .body .list-wrap .item .count {
  background-color: #e41827;
  border-radius: 1rem;
  color: #ffffff;
  font-size: 0.83333333rem;
  min-width: 2.08333333rem;
  padding: 0.16666667rem 0.33333333rem;
  text-align: center;
}

.me-main .body .list-wrap .item .red-dot {
  background-color: #e41827;
  border-radius: 50%;
  height: 7px;
  margin-right: 0.33333333rem;
  width: 7px;
}

.me-main .body .list-wrap .item .kyc {
  font-size: 1rem;
  font-weight: 400;
  padding: 0.5rem 1rem;
}

.me-main .body .list-wrap .item .kyc.bg {
  background-color: #0d9737;
  border-radius: 0.16666667rem;
  color: #ffffff;
}

.red-dot-with-num {
  background-color: #e41827;
  border-radius: 50%;
  color: #ffffff;
  font-size: 12px;
  line-height: 1;
  min-width: 1rem;
  padding: 0.25rem 0.16666667rem;
  position: absolute;
  -webkit-transform: translate(90%, -60%);
  -ms-transform: translate(90%, -60%);
  transform: translate(90%, -60%);
}
</style>
