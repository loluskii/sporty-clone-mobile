<template>
  <div class="code-hub-item">
    <div class="trending-card">
      <div class="trending-card-header">
        <div class="trending-code-wrap">
          <button class="trending-code" type="button" @click="copyCode(code.betslipId)">
            {{ code.betslipId }}
          </button>
          <!-- Use icon font classes to avoid encoding issues across builds. -->
          <button class="trending-copy" type="button" @click="copyCode(code.betslipId)">
            <span class="iconfont icon-content_copy" aria-hidden="true"></span>
          </button>
        </div>
        <div class="trending-meta">
          <span class="trending-folds">{{ code.totalSelections }} Fold</span>
          <span class="trending-odds">{{ code.total_odd }}</span>
        </div>
      </div>

      <div class="trending-selections">
        <div
          v-for="selection in displaySelections"
          :key="selection.id"
          class="trending-selection"
        >
          <div class="trending-selection-info">
            <div class="trending-selection-name">{{ selection.outcomeName }}</div>
            <div class="trending-selection-market">
              {{ selection.marketName }} &middot; {{ selection.eventName }}
            </div>
          </div>
          <div class="trending-selection-odds">{{ selection.odds }}</div>
        </div>
      </div>

      <div class="trending-card-footer">
        <button class="trending-cta" @click="openDrawer(code)">View bet</button>
      </div>
    </div>

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
                <span class="iconfont icon-content_copy" aria-hidden="true"></span>
              </button>
            </div>
            <button class="trending-drawer-close" type="button" @click="closeDrawer">
              &times;
            </button>
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
                  {{ selection.marketName }} &middot; {{ selection.eventName }}
                </div>
              </div>
              <div class="trending-drawer-odd">{{ selection.odds }}</div>
            </div>
          </div>
          <div class="trending-drawer-actions">
            <button class="trending-drawer-share" type="button" @click="shareCode(activeCode)">
              <span class="trending-share-icon iconfont icon-share-fb" aria-hidden="true"></span>
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
import { useCouponStore } from '@/stores'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import emitter from '@/plugins/emitter'
import { loadBetslipByCode } from '../../helpers/queries'

const props = defineProps({
  code: {
    type: Object,
    required: true
  },
  previewCount: {
    type: Number,
    default: null
  }
})

const addToBetslipLoading = ref(false)
const shareCodeLoading = ref(false)
const couponStore = useCouponStore()
const copiedCode = ref('')
const drawerOpen = ref(false)
const activeCode = ref(null)
// Expand selections for preview-only UI checks (e.g., 10 selections).
const displaySelections = computed(() => {
  const selections = props.code?.selections || []
  if (!props.previewCount || selections.length >= props.previewCount) return selections
  const expanded = []
  while (expanded.length < props.previewCount) {
    expanded.push(...selections)
  }
  return expanded.slice(0, props.previewCount)
})

async function addToBetslip(code) {
  addToBetslipLoading.value = true
  try {
    if (couponStore.coupon.selections.length) {
      emitter.emit('showBetslipConfirmation', code)
    } else {
      const res = await loadBetslipByCode(code)
      addToBetslipLoading.value = false
      if (res.success) {
        if (res.data.selections.length) {
          couponStore.coupon.selections = res.data.selections
          couponStore.coupon.totalOdds = res.data.totalOdd
          couponStore.coupon.totalStake = res.data.stake
          couponStore.coupon.stake = res.data.stake
          couponStore.coupon.maxWin = res.data.possibleWin
          couponStore.coupon.source = 'mobile'
          if (res.data.selections.length === 1) {
            couponStore.coupon.bet_type = 'Single'
            couponStore.coupon.betslip_type = 'Single'
          } else {
            couponStore.coupon.bet_type = 'Multiple'
            couponStore.coupon.betslip_type = 'Multiple'
          }
        } else {
          emitter.emit('showDialogueToaster', 'All selections have expired')
        }
      } else {
        throw new Error(res.message)
      }
      emitter.emit('openBetslip')
    }
  } catch (error) {
    console.log(error)
    emitter.emit('showDialogueToaster', 'Error Loading Betslip')
  }
}

function shareCode(data) {
  shareCodeLoading.value = true
  setTimeout(() => {
    shareCodeLoading.value = false
    emitter.emit('showBookBetModal', { data: data })
  }, 1000)
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

function setBodyScrollLocked(locked) {
  document.body.classList.toggle('no-scroll', locked)
}

watch(drawerOpen, (isOpen) => {
  setBodyScrollLocked(isOpen)
})

onBeforeUnmount(() => {
  setBodyScrollLocked(false)
})
</script>

<style scoped>
.drawer-lock {
  overflow: hidden;
}
.code-hub-item {
  width: 100%;
}

.trending-card {
  background: rgba(15, 18, 24, 0.04);
  border-radius: 0.5rem;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 0.65rem;
  height: 17rem;
  /* box-shadow: 0 12px 26px rgba(17, 24, 39, 0.2); */
  min-width: 19rem;
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
  color: #1b1e25;
  font-weight: 800;
  padding: 0rem 0.75rem;
  border-radius: 0.4rem;
  font-size: 1.2rem;
  border: none;
  background: transparent;
}

.trending-copy {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  color: #1b1e25;
  font-family: 'iconfont' !important;
  display: inline-flex;
  align-items: center;
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
  scrollbar-width: none;
}
.trending-selections::-webkit-scrollbar {
  width: 0;
  height: 0;
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

.trending-cta {
  background: var(--brand-primary);
  color: #ffffff;
  border: none;
  border-radius: 0.4rem;
  padding: 0.35rem 0.8rem;
  font-weight: 600;
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
  min-height: 0;
  overflow: hidden;
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
  flex: 1 1 auto;
  min-height: 0;
  max-height: 100%;
  scrollbar-width: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.trending-drawer-list::-webkit-scrollbar {
  width: 0;
  height: 0;
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
  background: var(--brand-secondary);
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
