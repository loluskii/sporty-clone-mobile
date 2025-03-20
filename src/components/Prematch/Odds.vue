<template lang="">
  <div class="m-outcome m-event-outcome-default" :class="[
      selectionClass,
      odds.odds <= 1 ? 'm-outcome--disabled' : 'x',
      oddUp ? 'm-outcome--up' : oddDown ? 'm-outcome--down' : ''
    ]">
    <span v-if="odds.odds <= 1" class="m-outcome-odds m-icon-lock"></span>
    <span v-else data-op="label-odds-amount" class="m-outcome-odds">{{
      odds.odds.toFixed(2)
    }}</span>
  </div>
</template>
<script setup>
import { formatOdd } from '../../helpers'
import { defineComponent, ref, watch } from 'vue'
const oddUp = ref(false)
const oddDown = ref(false)

const props = defineProps({
  odds: Object,
  selectionClass: String
})

defineComponent({
  name: 'prematch-odds'
})

watch(
  () => props.odds.odds,
  (newValue, oldValue) => {
    if (newValue && oldValue) {
      const nVal = newValue.toFixed(2);
      const oVal = oldValue.toFixed(2);

      if (parseFloat(nVal) > parseFloat(oVal)) {
        oddUp.value = true
        oddDown.value = false
      } else if (parseFloat(nVal) < parseFloat(oVal)) {
        oddUp.value = false
        oddDown.value = true
      }
      // reset indicators
      setTimeout(() => {
        oddDown.value = false
        oddUp.value = false
      }, 5000)
    }
  },
  { immediate: true }
)
</script>
<style lang=""></style>
