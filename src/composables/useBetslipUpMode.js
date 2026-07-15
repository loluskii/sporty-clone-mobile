import { computed } from 'vue'
import { useCouponStore } from '@/stores'
import { EARLY_WIN_DEFAULT_MODE } from '@/helpers'

export function useBetslipUpMode() {
  const couponStore = useCouponStore()

  const selections = computed(() => couponStore.coupon.selections || [])
  const bulkMode = computed({
    get: () => couponStore.earlyWinBulkMode || EARLY_WIN_DEFAULT_MODE,
    set: (mode) => {
      couponStore.earlyWinBulkMode = mode || EARLY_WIN_DEFAULT_MODE
    }
  })
  const isLoadingUpMode = computed(() => couponStore.isEarlyWinLoading)

  const supportedSelections = computed(() =>
    selections.value.filter((selection) => selection.supportsEarlyWin)
  )
  const actionableSelections = computed(() =>
    selections.value.filter(
      (selection) => selection.supportsEarlyWin || selection.earlyWinMode === '1up' || selection.earlyWinMode === '2up'
    )
  )
  const unsupportedSelections = computed(() =>
    selections.value.filter(
      (selection) => !selection.supportsEarlyWin && (selection.earlyWinMode || 'base') === 'base'
    )
  )
  const hasDerivedMarkets = computed(() => supportedSelections.value.length > 0)
  const hasUnsupportedSelections = computed(() => unsupportedSelections.value.length > 0)
  const eligibleSelectionsCount = computed(() => supportedSelections.value.length)
  const unsupportedSelectionsCount = computed(() => unsupportedSelections.value.length)
  const isBulkEarlyWinEnabled = computed(() =>
    selections.value.some((selection) => selection.earlyWinMode && selection.earlyWinMode !== 'base')
  )

  const setSelectionUpMode = async (selection, mode) => {
    if (!selection?.selectionId) return
    const nextMode = selection.earlyWinMode === mode ? 'base' : mode
    if (nextMode !== 'base') {
      bulkMode.value = nextMode
    }
    await couponStore.applyEarlyWinModeToSelections([String(selection.selectionId)], nextMode)
  }

  const toggleBulkUpMode = async () => {
    const selectionIds = (
      isBulkEarlyWinEnabled.value ? actionableSelections.value : supportedSelections.value
    ).map((selection) => String(selection.selectionId))
    if (!selectionIds.length) return

    const nextMode = isBulkEarlyWinEnabled.value ? 'base' : bulkMode.value || EARLY_WIN_DEFAULT_MODE
    await couponStore.applyEarlyWinModeToSelections(selectionIds, nextMode)
  }

  const setBulkUpMode = async (mode) => {
    bulkMode.value = mode || EARLY_WIN_DEFAULT_MODE
    if (!isBulkEarlyWinEnabled.value) return

    const selectionIds = supportedSelections.value.map((selection) => String(selection.selectionId))
    if (!selectionIds.length) return
    await couponStore.applyEarlyWinModeToSelections(selectionIds, bulkMode.value)
  }

  return {
    bulkMode,
    isLoadingUpMode,
    hasDerivedMarkets,
    hasUnsupportedSelections,
    eligibleSelectionsCount,
    unsupportedSelectionsCount,
    isBulkEarlyWinEnabled,
    toggleBulkUpMode,
    setBulkUpMode,
    setSelectionUpMode
  }
}
