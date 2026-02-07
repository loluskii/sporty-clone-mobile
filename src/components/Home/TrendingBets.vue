<template>
  <div class="trending-bets">
    <div class="trending-header">
      <span class="trending-title">Trending Bets</span>
    </div>

    <div class="trending-cards" v-if="codes.length">
      <div v-for="code in codes" :key="code.betslipId" class="trending-card">
        <div class="trending-card-header">
          <div class="trending-code-wrap">
            <button class="trending-code" type="button" @click="copyCode(code.betslipId)">
              {{ code.betslipId }}
            </button>
            <!-- <button class="trending-copy" type="button" @click="copyCode(code.betslipId)">
              
            </button> -->
          </div>
          <div class="trending-meta">
            <span class="trending-folds">{{ code.totalSelections }} Fold</span>
            <span class="trending-odds">{{ code.total_odd }}</span>
          </div>
        </div>

        <div class="trending-selections">
          <div
            v-for="selection in code.selections"
            :key="selection.id"
            class="trending-selection"
          >
            <div class="trending-selection-info">
              <div class="trending-selection-name">{{ selection.outcomeName }}</div>
              <div class="trending-selection-market">
                {{ selection.marketName }} • {{ selection.eventName }}
              </div>
            </div>
            <div class="trending-selection-odds">{{ selection.odds }}</div>
          </div>
        </div>

        <div class="trending-card-footer">
          <button class="trending-cta" @click="openDrawer(code)">View bet</button>
        </div>
      </div>
    </div>

    <div v-else class="trending-empty">No trending bets yet.</div>
    <a class="trending-view-all" href="/CodeHub">View all</a>

    <Transition name="trending-drawer">
      <div v-if="drawerOpen" class="trending-drawer-overlay" @click="closeDrawer">
        <div class="trending-drawer" @click.stop>
          <div class="trending-drawer-header">
            <div class="trending-drawer-code">
              <button
                class="trending-code"
                type="button"
                @click="copyCode(activeCode?.betslipId)"
              >
                {{ activeCode?.betslipId }}
              </button>
              <button class="trending-copy" type="button" @click="copyCode(activeCode?.betslipId)">
                
              </button>
            </div>
            <button class="trending-drawer-close" type="button" @click="closeDrawer">×</button>
          </div>
          <div class="trending-drawer-meta">
            <span>{{ activeCode?.totalSelections }} Selections</span>
            <span class="trending-drawer-odds">{{ activeCode?.total_odd }}</span>
          </div>
          <div class="trending-drawer-list">
            <div
              v-for="selection in activeCode?.selections || []"
              :key="selection.id"
              class="trending-drawer-item"
            >
              <div class="trending-drawer-info">
                <div class="trending-drawer-name">{{ selection.outcomeName }}</div>
                <div class="trending-drawer-market">
                  {{ selection.marketName }} • {{ selection.eventName }}
                </div>
              </div>
              <div class="trending-drawer-odd">{{ selection.odds }}</div>
            </div>
          </div>
          <div class="trending-drawer-actions">
            <button class="trending-drawer-share" type="button" @click="shareCode(activeCode)">
              <span class="trending-share-icon icon-font-base">î˜½</span>
            </button>
            <button class="trending-drawer-add" type="button" @click="addToBetslip(activeCode)">
              Add to betslip
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useQuery } from 'vue-query'
import { getCodeHubItems, getNext7Days, FEED_TOGGLE } from '@/helpers'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'

const couponStore = useCouponStore()
const addToBetslipLoading = ref(false)
const copiedCode = ref('')
const drawerOpen = ref(false)
const activeCode = ref(null)

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

const dummyCodes = [
  {
    betslipId: 'XNFEEW',
    totalSelections: 7,
    total_odd: '8.66',
    selections: [
      {
        id: '1',
        outcomeName: 'Aston Villa',
        marketName: '1X2 • Half-Time UP',
        eventName: 'Aston Villa vs Wolves',
        odds: '1.43'
      },
      {
        id: '2',
        outcomeName: 'Bournemouth',
        marketName: '1X2 • Half-Time UP',
        eventName: 'Bournemouth vs Arsenal',
        odds: '1.32'
      },
      {
        id: '3',
        outcomeName: 'Porto',
        marketName: '1X2 • Half-Time UP',
        eventName: 'Porto vs Rio Ave',
        odds: '3.22'
      }
    ]
  },
  {
    betslipId: 'GC2C0',
    totalSelections: 12,
    total_odd: '14.92',
    selections: [
      {
        id: '4',
        outcomeName: 'Arsenal',
        marketName: '1X2',
        eventName: 'Arsenal vs Everton',
        odds: '1.64'
      },
      {
        id: '5',
        outcomeName: 'Celtic',
        marketName: '1X2',
        eventName: 'Celtic vs Rangers',
        odds: '1.78'
      },
      {
        id: '6',
        outcomeName: 'Napoli',
        marketName: '1X2',
        eventName: 'Napoli vs Lazio',
        odds: '2.05'
      }
    ]
  }
]

const codes = computed(() => {
  // Use the same data source as CodeHub and limit to a small, scannable set.
  const liveCodes = codesData.value?.data?.data?.slice(0, 6) || []
  // Fall back to dummy cards when the API returns no data.
  return liveCodes.length ? liveCodes : dummyCodes
})

function addToBetslip(code) {
  addToBetslipLoading.value = true
  setTimeout(() => {
    addToBetslipLoading.value = false
    try {
      if (couponStore.coupon.selections.length) {
        emitter.emit('showBetslipConfirmation', code)
      } else {
        couponStore.coupon.selections = code.selections
        couponStore.coupon.totalOdds = parseFloat(code.totalOdd || code.total_odd || 0)
        couponStore.coupon.totalStake = parseFloat(code.stake || 0)
        couponStore.coupon.stake = parseFloat(code.stake || 0)
        couponStore.coupon.maxWin = parseFloat(code.possibleWin || 0)
        couponStore.coupon.source = code.source
        if (code.selections.length === 1) {
          couponStore.coupon.bet_type = 'Single'
          couponStore.coupon.betslip_type = 'Single'
        } else {
          couponStore.coupon.bet_type = 'Multiple'
          couponStore.coupon.betslip_type = 'Multiple'
        }
        emitter.emit('openBetslip')
      }
    } catch (error) {
      console.log(error)
      emitter.emit('showDialogueToaster', 'Error Loading Betslip')
    }
  }, 600)
}

function copyCode(code) {
  copiedCode.value = code
  if (navigator?.clipboard?.writeText) {
    navigator.clipboard.writeText(code).catch(() => {})
  }
}

function openDrawer(code) {
  // Open the details drawer instead of adding to betslip directly.
  activeCode.value = code
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  activeCode.value = null
}

function shareCode(code) {
  if (!code) return
  emitter.emit('showBookBetModal', { data: code })
}
</script>

<style scoped>
.trending-bets {
  background: #ffffff;
  /* margin: 0.83333333rem; */
  border-radius: 0.5rem;
  /* padding: 1.83333333rem; */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  /* Ensure shadows can render outside the card rail. */
  overflow: visible;
}

.trending-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 1.8rem 1.8rem 0rem;
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
  margin-top: .8rem;
  padding: 0rem 1.8rem 1.8rem;
}

.trending-cards {
  display: flex;
  gap: 0.83333333rem;
  overflow-x: auto;
  /* Allow card shadows to show above/below the scroll area. */
  overflow-y: visible;
  padding: 1rem 1.8rem 1.25rem;
  scroll-padding: 0.75rem;
}

.trending-card {
  /* Slightly tinted dark surface for a neutral, modern look. */
  background: rgba(15, 18, 24, 0.04);
  border-radius: 0.5rem;
  min-width: 20rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  height: 20rem;
  box-shadow: -1px 1px 2px 0px rgba(17, 24, 39, 0.2);
  /* Use drop-shadow so it renders outside the scroll container. */
  filter: drop-shadow(0 12px 26px rgba(17, 24, 39, 0.16));
}

.trending-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trending-code-wrap {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.trending-code {
  /* background: #e8eefc; */
  color: #1b1e25;
  font-weight: 800;
  padding: 0rem 0.75rem;
  border-radius: 0.4rem;
  font-size: 1.2rem;
  border: none;
}

.trending-copy {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #1b1e25;
  font-family: 'iconfont' !important;
}

.trending-meta {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  font-size: 0.85rem;
  color: #6c727f;
}

.trending-folds {
  font-weight: 600;
}

.trending-odds {
  font-weight: 700;
  color: #1b1e25;
}

.trending-selections {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  padding-right: 0.25rem;
  flex: 1;
}

.trending-selection {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.35rem;
  padding: 0.45rem 0.5rem;
}

.trending-selection-name {
  font-weight: 600;
  color: #1b1e25;
  font-size: 0.92rem;
}

.trending-selection-market {
  color: #6c727f;
  font-size: 0.8rem;
}

.trending-selection-odds {
  font-weight: 700;
  color: #1b1e25;
}

.trending-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  padding-top: 0.25rem;
  margin-top: auto;
}

.trending-total {
  font-weight: 600;
  color: #1b1e25;
  font-size: 0.9rem;
}

.trending-cta {
  background: var(--brand-secondary);
  color: #ffffff;
  border: none;
  border-radius: 0.4rem;
  padding: 0.35rem 0.8rem;
  font-weight: 600;
}

.trending-empty {
  color: #6c727f;
  font-size: 0.9rem;
}

.trending-drawer-overlay {
  background: rgba(0, 0, 0, 0.4);
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.trending-drawer {
  background: #ffffff;
  border-radius: 1rem 1rem 0 0;
  padding: 1rem;
  width: 100%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.trending-drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.trending-drawer-code {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.trending-drawer-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  color: #6c727f;
}

.trending-drawer-meta {
  display: flex;
  justify-content: space-between;
  color: #6c727f;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
}

.trending-drawer-odds {
  font-weight: 700;
  color: #1b1e25;
}

.trending-drawer-list {
  overflow-y: auto;
  padding-right: 0.25rem;
  flex: 1;
}

.trending-drawer-item {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid #eaecef;
}

.trending-drawer-name {
  font-weight: 600;
  color: #1b1e25;
}

.trending-drawer-market {
  color: #6c727f;
  font-size: 0.85rem;
}

.trending-drawer-odd {
  font-weight: 700;
  color: #1b1e25;
}

.trending-drawer-actions {
  display: flex;
  gap: 0.75rem;
  padding-top: 0.75rem;
}

.trending-drawer-share,
.trending-drawer-add {
  border: none;
  border-radius: 0.5rem;
  padding: 0.7rem 0.75rem;
  font-weight: 700;
}

.trending-drawer-share {
  flex: 0 0 30%;
  background: #eaecef;
  color: #353a45;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.trending-drawer-add {
  flex: 0 0 70%;
  border: none;
  border-radius: 0.5rem;
  padding: 0.7rem 0.75rem;
  font-weight: 700;
}

.trending-drawer-add {
  background: #111111;
  color: #ffffff;
}

.trending-share-icon {
  font-size: 1.2rem;
}

.trending-drawer-enter-active,
.trending-drawer-leave-active {
  transition: opacity 0.2s ease;
}

.trending-drawer-enter-from,
.trending-drawer-leave-to {
  opacity: 0;
}
</style>
