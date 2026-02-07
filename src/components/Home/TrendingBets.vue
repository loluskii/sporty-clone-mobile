<template>
  <div class="trending-bets">
    <div class="trending-header">
      <span class="trending-title">Trending Bets</span>
    </div>

    <div class="trending-cards" v-if="codes.length">
      <!-- Use the CodeHub item for consistent card + drawer UI. -->
      <CodeHubItem v-for="code in codes" :key="code.betslipId" :code="code" />
    </div>

    <div v-else class="trending-empty">No trending bets yet.</div>
    <a class="trending-view-all" href="/CodeCentral">View all</a>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery } from 'vue-query'
import { getCodeHubItems, getNext7Days, FEED_TOGGLE } from '@/helpers'
import CodeHubItem from '@/components/CodeHub/CodeHubItem.vue'

const addToBetslipLoading = ref(false)

const { data: codesData } = useQuery(
  'trending-codes',
  () => {
    const payload = {
      from: getNext7Days()[0],
      to: getNext7Days()[7],
      betType: 0
    }
    return getCodeHubItems(payload)
  },
  {
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    staleTime: 60000,
    cacheTime: 300000,
    enabled: FEED_TOGGLE
  }
)

const codes = computed(() => {
  // Use the same data source as CodeHub and limit to a small, scannable set.
  return codesData.value?.data?.data?.slice(0, 6) || []
})
</script>

<style scoped>
.trending-bets {
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  overflow: visible;
  padding: 1.5rem;
}

.trending-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.trending-title {
  font-size: 1.35rem;
  font-weight: 800;
  color: #1b1e25;
}

.trending-view-all {
  color: #0d9737;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  margin-top: 1.5rem;
}

.trending-cards {
  display: flex;
  gap: 0.83333333rem;
  overflow-x: auto;
  overflow-y: visible;
  padding: 1rem 0.75rem 1.25rem;
  scroll-padding: 0.75rem;
}

.trending-empty {
  color: #6c727f;
  font-size: 0.9rem;
}
</style>
