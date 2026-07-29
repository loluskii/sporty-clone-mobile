<template>
  <div class="trending-bets">
    <button
      type="button"
      class="trending-header"
      :aria-expanded="!isCollapsed"
      aria-controls="trending-bets-content"
      @click="toggleCollapsed"
    >
      <span class="trending-title-wrap">
        <span class="trending-title">Trending Bets</span>
        <span v-if="codes.length" class="trending-count">{{ codes.length }}</span>
      </span>
      <span class="trending-toggle-icon" :class="{ collapsed: isCollapsed }" aria-hidden="true"></span>
    </button>

    <transition name="trending-collapse">
      <div v-if="!isCollapsed" id="trending-bets-content">
        <div class="trending-cards" v-if="codes.length">
          <!-- Use the CodeHub item for consistent card + drawer UI. -->
          <CodeHubItem v-for="code in codes" :key="code.betslipId" :code="code" />
        </div>

        <div v-else class="trending-empty">No trending bets yet.</div>
        <RouterLink class="trending-view-all" :to="{ name: 'code-central' }">View all</RouterLink>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery } from 'vue-query'
import { getCodeHubItems, getNext7Days, FEED_TOGGLE } from '@/helpers'
import CodeHubItem from '@/components/CodeHub/CodeHubItem.vue'

const isCollapsed = ref(true)

const { data: codesData } = useQuery(
  'trending-codes',
  () => {
    const payload = {
      from: getNext7Days()[0]
    }
    return getCodeHubItems(payload)
  },
  {
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 5 * 60 * 1000,
    enabled: FEED_TOGGLE
  }
)

const codes = computed(() => {
  // Use the same data source as CodeHub and limit to a small, scannable set.
  return codesData.value?.data?.data?.slice(0, 15) || []
})

const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.trending-bets {
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  overflow: visible;
  padding: 1.5rem 1rem 0.5rem;
  border-bottom: 1px solid rgba(53, 58, 69, 0.12);
}

.trending-header {
  align-items: center;
  background: transparent;
  border: 0;
  color: inherit;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 0;
  width: 100%;
  margin-bottom: 1rem;
}

.trending-title-wrap {
  align-items: center;
  display: inline-flex;
  gap: 0.5rem;
}

.trending-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #1b1e25;
}

.trending-count {
  align-items: center;
  background: rgba(53, 58, 69, 0.08);
  border-radius: 999px;
  color: #353a45;
  display: inline-flex;
  font-size: 0.8rem;
  font-weight: 800;
  height: 1.5rem;
  justify-content: center;
  min-width: 1.5rem;
  padding: 0 0.45rem;
}

.trending-toggle-icon {
  border-right: 2px solid #6c727f;
  border-bottom: 2px solid #6c727f;
  height: 0.75rem;
  transform: translateY(-2px) rotate(45deg);
  transition: transform 0.2s ease;
  width: 0.75rem;
}

.trending-toggle-icon.collapsed {
  transform: translateY(2px) rotate(-135deg);
}

.trending-view-all {
  color: var(--brand-secondary);
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  margin-top: 1rem;
}

.trending-cards {
  display: flex;
  gap: 0.83333333rem;
  overflow-x: auto;
  overflow-y: visible;
  scroll-padding: 0.75rem;
}

.trending-empty {
  color: #6c727f;
  font-size: 0.9rem;
}

.trending-collapse-enter-active,
.trending-collapse-leave-active {
  overflow: hidden;
  transition: max-height 0.24s ease, opacity 0.18s ease, transform 0.24s ease;
}

.trending-collapse-enter-from,
.trending-collapse-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-4px);
}

.trending-collapse-enter-to,
.trending-collapse-leave-from {
  max-height: 1000px;
  opacity: 1;
  transform: translateY(0);
}
</style>
