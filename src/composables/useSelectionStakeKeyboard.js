import { computed } from 'vue'
import { useCouponStore, useUtilsStore } from '@/stores'

export function useSelectionStakeKeyboard(selectionRef, options = {}) {
  const couponStore = useCouponStore()
  const { SportsbookGlobalVariable } = useUtilsStore()

  const minStake = computed(() => Number(SportsbookGlobalVariable?.singleMinStake || 0))
  const maxStake = computed(() => Number(SportsbookGlobalVariable?.singleMaxStake || 0))

  const keyboardKey = computed(() => `selection:${selectionRef.value?.matchId || ''}`)
  const isKeyboardVisible = computed(() => couponStore.activeKeyboardKey === keyboardKey.value)

  const handleStakeChange = (stake) => {
    if (!selectionRef.value) return
    const parsed = Number(stake)
    const normalized = Number.isFinite(parsed)
      ? Math.min(maxStake.value || parsed, Math.max(minStake.value, parsed))
      : minStake.value
    return couponStore.updateWinnings({
      stake: normalized,
      id: selectionRef.value.selectionId || selectionRef.value.id
    })
  }

  const openKeyboard = () => {
    if (options.onOpen) {
      options.onOpen()
    }
    couponStore.setActiveKeyboardKey(keyboardKey.value)
  }

  const hideKeyboard = () => {
    if (options.onClose) {
      options.onClose()
    }
    couponStore.setActiveKeyboardKey(null)
  }

  const onKeyClick = (type, value) => {
    if (!selectionRef.value) return
    let stake = (selectionRef.value.stake ?? '').toString()
    let finalStake
    switch (type) {
      case 'number':
        if (stake.length < 7) {
          if (typeof value === 'number') {
            if (stake === '') {
              finalStake = value
            } else {
              finalStake = parseFloat(stake) + value
            }
          } else {
            finalStake = stake + value
          }
          handleStakeChange(finalStake)
        }
        break
      case 'dot':
        if (stake.length < 6 && !stake.includes('.')) {
          stake += '.'
          handleStakeChange(stake)
        }
        break
      case 'double-zero':
        if (stake.length < 6) {
          stake += '00'
          handleStakeChange(stake)
        }
        break
      case 'clear':
        stake = ''
        handleStakeChange(stake)
        break
      case 'delete':
        stake = stake.toString().slice(0, -1)
        handleStakeChange(stake)
        break
      case 'done':
        couponStore.setActiveKeyboardKey(null)
        break
    }
  }

  return {
    isKeyboardVisible,
    openKeyboard,
    hideKeyboard,
    onKeyClick
  }
}
