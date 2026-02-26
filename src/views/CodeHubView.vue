<template>
  <div class="x-load-bet">
    <HeaderOther :headerTitle="'Code Central'" :styles="'position: fixed; top: 0'"></HeaderOther>
    <div class="code-hub-content">
      <div class="code-hub-list-container">
        <div
          class="scroll-wrap scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
        >
          <div v-if="!codes.length && !isLoading" class="code-hub-empty">
            <div class="code-hub-empty-title">No trending bets yet.</div>
            <div class="code-hub-empty-subtitle">Check back soon for new code picks.</div>
          </div>
          <div v-else class="code-hub-list-item-container">
            <CodeHubItem
              v-for="(code, index) in codes"
              :code="code"
              :key="code.betslipId"
              :preview-count="index === 0 ? 10 : null"
            />
          </div>
          <div v-if="isLoading" class="code-hub-loading">Loading...</div>
          <div v-if="isLoadingMore" class="code-hub-loading">Loading more...</div>
          <div ref="loadMoreRef" class="code-hub-sentinel"></div>
          <div class="loading-more-wrapper" style="position: relative"></div>
          <div class="bottom-ele"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderOther from '@/components/HeaderOther.vue'
import CodeHubItem from '@/components/CodeHub/CodeHubItem.vue'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { getCodeHubItems, getNext7Days } from '../helpers'
const codes = ref([])
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const searchTerm = ref('')
const currentPage = ref(1)
const loadMoreRef = ref(null)
let loadMoreObserver = null
const dummyCodes = [
  {
    betslipId: 'W11RST',
    totalSelections: 11,
    total_odd: '11.14',
    selections: [
      {
        id: '1',
        outcomeName: 'Borussia Dortmund',
        marketName: '1X2',
        eventName: 'Wolfsburg vs Borussia Dortmund',
        odds: '1.33'
      },
      {
        id: '2',
        outcomeName: 'Chelsea',
        marketName: '1X2',
        eventName: 'Wolves vs Chelsea',
        odds: '1.32'
      },
      {
        id: '3',
        outcomeName: 'Arsenal',
        marketName: '1X2',
        eventName: 'Arsenal vs Sunderland',
        odds: '1.17'
      },
      {
        id: '1',
        outcomeName: 'Borussia Dortmund',
        marketName: '1X2',
        eventName: 'Wolfsburg vs Borussia Dortmund',
        odds: '1.33'
      },
      {
        id: '2',
        outcomeName: 'Chelsea',
        marketName: '1X2',
        eventName: 'Wolves vs Chelsea',
        odds: '1.32'
      },
      {
        id: '3',
        outcomeName: 'Arsenal',
        marketName: '1X2',
        eventName: 'Arsenal vs Sunderland',
        odds: '1.17'
      },
      {
        id: '1',
        outcomeName: 'Borussia Dortmund',
        marketName: '1X2',
        eventName: 'Wolfsburg vs Borussia Dortmund',
        odds: '1.33'
      },
      {
        id: '2',
        outcomeName: 'Chelsea',
        marketName: '1X2',
        eventName: 'Wolves vs Chelsea',
        odds: '1.32'
      },
      {
        id: '3',
        outcomeName: 'Arsenal',
        marketName: '1X2',
        eventName: 'Arsenal vs Sunderland',
        odds: '1.17'
      },
      {
        id: '1',
        outcomeName: 'Borussia Dortmund',
        marketName: '1X2',
        eventName: 'Wolfsburg vs Borussia Dortmund',
        odds: '1.33'
      },
      {
        id: '2',
        outcomeName: 'Chelsea',
        marketName: '1X2',
        eventName: 'Wolves vs Chelsea',
        odds: '1.32'
      },
      {
        id: '3',
        outcomeName: 'Arsenal',
        marketName: '1X2',
        eventName: 'Arsenal vs Sunderland',
        odds: '1.17'
      },
      {
        id: '1',
        outcomeName: 'Borussia Dortmund',
        marketName: '1X2',
        eventName: 'Wolfsburg vs Borussia Dortmund',
        odds: '1.33'
      },
      {
        id: '2',
        outcomeName: 'Chelsea',
        marketName: '1X2',
        eventName: 'Wolves vs Chelsea',
        odds: '1.32'
      },
      {
        id: '3',
        outcomeName: 'Arsenal',
        marketName: '1X2',
        eventName: 'Arsenal vs Sunderland',
        odds: '1.17'
      }
    ]
  },
  {
    betslipId: 'GH9K3L',
    totalSelections: 8,
    total_odd: '7.66',
    selections: [
      {
        id: '4',
        outcomeName: 'Barcelona',
        marketName: '1X2',
        eventName: 'Barcelona vs Mallorca',
        odds: '1.06'
      },
      {
        id: '5',
        outcomeName: 'Napoli',
        marketName: '1X2',
        eventName: 'Napoli vs Empoli',
        odds: '1.57'
      }
    ]
  },
  {
    betslipId: 'K2P7M1',
    totalSelections: 5,
    total_odd: '6.44',
    selections: [
      {
        id: '6',
        outcomeName: 'PSG',
        marketName: '1X2',
        eventName: 'PSG vs Lille',
        odds: '1.28'
      },
      {
        id: '7',
        outcomeName: 'Roma',
        marketName: '1X2',
        eventName: 'Roma vs Lazio',
        odds: '2.10'
      }
    ]
  },
  {
    betslipId: 'Q4T9V8',
    totalSelections: 6,
    total_odd: '9.21',
    selections: [
      {
        id: '8',
        outcomeName: 'Liverpool',
        marketName: '1X2',
        eventName: 'Liverpool vs Fulham',
        odds: '1.43'
      },
      {
        id: '9',
        outcomeName: 'Bayern',
        marketName: '1X2',
        eventName: 'Bayern vs Bremen',
        odds: '1.22'
      }
    ]
  },
  {
    betslipId: 'Z8J5W2',
    totalSelections: 9,
    total_odd: '12.05',
    selections: [
      {
        id: '10',
        outcomeName: 'AC Milan',
        marketName: '1X2',
        eventName: 'AC Milan vs Torino',
        odds: '1.35'
      },
      {
        id: '11',
        outcomeName: 'Inter',
        marketName: '1X2',
        eventName: 'Inter vs Genoa',
        odds: '1.41'
      }
    ]
  }
]

async function fetchCodes({ page = 1, reset = false } = {}) {
  // Track loading state separately for initial load vs pagination.
  isLoading.value = reset
  isLoadingMore.value = !reset
  const payload = {
    from: getNext7Days()[0],
    to: getNext7Days()[7],
    betType: 0,
    page: page,
    limit: 10,
    search: searchTerm.value || ''
  }
  const res = await getCodeHubItems(payload)
  const liveCodes = res?.data?.data || []
  const nextCodes = reset ? liveCodes : [...codes.value, ...liveCodes]
  // Use dummy codes when API returns empty.
  codes.value = nextCodes.length ? nextCodes : dummyCodes
  // Stop when the API returns fewer than the page size.
  hasMore.value = liveCodes.length >= 10
  isLoading.value = false
  isLoadingMore.value = false
}

onMounted(async () => {
  // Initial load.
  await fetchCodes({ page: 1, reset: true })
  // Setup infinite scroll sentinel.
  loadMoreObserver = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (!entry?.isIntersecting || isLoading.value || isLoadingMore.value || !hasMore.value) return
    currentPage.value += 1
    fetchCodes({ page: currentPage.value })
  })
  if (loadMoreRef.value) {
    loadMoreObserver.observe(loadMoreRef.value)
  }
})

onUnmounted(() => {
  if (loadMoreObserver && loadMoreRef.value) {
    loadMoreObserver.unobserve(loadMoreRef.value)
  }
  loadMoreObserver = null
})

watch(searchTerm, async () => {
  // Reset pagination when search changes.
  currentPage.value = 1
  hasMore.value = true
  await fetchCodes({ page: 1, reset: true })
})
</script>

<style scoped>
.code-hub-root {
  font-family: Roboto;
}
.code-hub-root .sport-text {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  gap: 1.33333333rem;
}
.code-hub-root .sport-text span {
  font-size: 1.16666667rem;
}
.code-hub-root .tab-wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: transparent;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  border-bottom-width: 1px;
  border-bottom-style: solid;
  border-bottom-color: #eaecef;
  border-bottom-color: var(--line-type1-primary);
}
.code-hub-root .tab-wrapper .tab-list {
  max-width: 100%;
  overflow: hidden;
  width: 100%;
}
.code-hub-root .tab-wrapper.justify-content-space-around {
  -webkit-justify-content: space-around;
  -ms-flex-pack: distribute;
  justify-content: space-around;
}
.code-hub-root .nav-tab-item {
  color: #1b1e25;
  color: var(--text-type1-tertiary);
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
  font-size: 1.16666667rem;
  height: 4rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding: 0 1rem;
  text-align: center;
  text-decoration: none;
}
.code-hub-root .nav-tab-item.active {
  border-bottom-width: 4px;
  border-bottom-style: solid;
  border-bottom-color: #0d9737;
  border-bottom-color: var(--brand-secondary);
  font-weight: bold;
}
.code-hub-root .tab-item {
  color: #1b1e25;
  color: var(--text-type1-tertiary);
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
  font-size: 1.16666667rem;
  height: 4rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  text-align: center;
  text-decoration: none;
}
.code-hub-root .tab-item.router-link-active {
  border-bottom-width: 4px;
  border-bottom-style: solid;
  border-bottom-color: #0d9737;
  border-bottom-color: var(--brand-secondary);
  font-weight: bold;
}
.code-hub-root .width-100 {
  width: 100%;
}
.m-topnav {
  position: fixed;
  z-index: 9999;
}
.code-hub-content {
  /* background-color: #fafafa;
  background-color: var(--background-general-primary); */
  margin-top: 3.66666667rem;
  position: relative;
  z-index: 0;
  padding-top: 0.75rem;
}
.code-hub-search {
  display: none;
}

.code-hub-empty {
  align-items: center;
  color: #6c727f;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 2.5rem 1.5rem;
  text-align: center;
}

.code-hub-empty-title {
  color: #1b1e25;
  font-size: 1.2rem;
  font-weight: 700;
}

.code-hub-empty-subtitle {
  font-size: 0.95rem;
}
.loading-icon-input {
  -webkit-animation: rotation-0885939a 2s infinite linear;
  animation: rotation-0885939a 2s infinite linear;
  left: 21.41666667rem;
  position: absolute;
}
@-webkit-keyframes rotation-0885939a {
  from {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  to {
    -webkit-transform: rotate(359deg);
    transform: rotate(359deg);
  }
}
@keyframes rotation-0885939a {
  from {
    -webkit-transform: rotate(0deg);
    transform: rotate(0deg);
  }
  to {
    -webkit-transform: rotate(359deg);
    transform: rotate(359deg);
  }
}
.code-hub-list-container .space-from-top-navbar {
  left: 0;
  position: -webkit-sticky;
  position: sticky;
  right: 0;
  top: 3.66666667rem;
  z-index: 500;
}
.code-hub-list-container .code-hub-list-item-container {
  padding: 0.66666667rem;
  position: relative;
}
.code-hub-list-container {
  position: relative;
  z-index: 0;
}
.code-hub-list-container
  .code-hub-list-item-intersection-observer-wrap
  + .code-hub-list-item-intersection-observer-wrap {
  margin-top: 0.66666667rem;
}
.code-hub-list-container .loading-more-wrapper .m-loading-wrap {
  min-height: 58px;
}
.booking-code {
  background-color: rgba(0, 0, 0, 0.7);
  position: fixed;
  z-index: 501;
}

.code-hub-loading {
  color: #6c727f;
  font-size: 0.9rem;
  padding: 1rem 0.75rem;
  text-align: center;
}

.code-hub-sentinel {
  height: 1px;
}
</style>
