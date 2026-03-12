<template>
  <div class="fixed-wrap" style="position: fixed; top: 0rem; z-index: 1000; width: 100%">
    <div>
      <div class="m-openbet-header">
        <div v-if="authStore.isAuthenticated" class="is-login">
          <span class="balance"
            ><span>{{ SportsbookGlobalVariable.Currency }} </span>
            <span>{{ usersStore.balance }}</span></span
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
          :class="{ active: route.name === 'open-bets' }"
          @click="$router.push({ name: 'open-bets' })"
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
</template>

<script setup>
import { useUsersStore, useAuthStore, useUtilsStore } from '../stores'
import { useRoute } from 'vue-router'
import { defineProps, computed } from 'vue'

const route = useRoute()
const authStore = useAuthStore()
const usersStore = useUsersStore()
const { SportsbookGlobalVariable } = useUtilsStore()

defineProps({
  active: String
})
</script>
<style scoped>
.m-sportBets .m-list-nav-type {
  background-color: #353a45;
  /* background-color: var(--brand-primary); */
  padding: 0 2.08333333rem;
}
.m-sportBets .m-list-nav-type .m-list-nav-type-item {
  background-color: var(--brand-button-disabled);
  border-top-left-radius: 0.33333333rem;
  border-top-right-radius: 0.33333333rem;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  font-size: 1.066rem;
  font-weight: bold;
  height: 3rem;
  line-height: 3rem;
  margin-right: 0.25rem;
  color: #ffffff;
  color: var(--c-openbet-label-text);
}
.m-sportBets .m-list-nav-type .m-list-nav-type-item:last-child {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-sportBets .m-list-nav-type .m-list-nav-type-item.active {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: #353a45;
  color: var(--text-type1-primary);
}
.m-sportBets .m-list-nav-type .m-list-nav-type-item.m-snap-nav-item--disabled {
  opacity: 0.5;
  text-decoration: line-through;
}
</style>
