<template>
  <div class="m-bet-head">
    <div class="m-snap-nav-wrap m-list-bet-type" style="overflow: hidden">
      <ul class="m-snap-nav flex">
        <li
          :class="betSlipType !== 'Combo' && betType === 'Single' ? 'active' : ''"
          @click="$emit('set-bet-type', 'Single')"
          class="m-list-bet-type-item m-snap-nav-item"
          data-op="betslip-multi-tag-single"
        >
          <span data-cms-key="singles">Single</span>
        </li>
        <li
          :class="betSlipType === 'Multiple' ? 'active' : ''"
          @click="$emit('set-bet-type', 'Multiple')"
          class="flex flex-center m-list-bet-type-item m-snap-nav-item"
          data-op="betslip-multi-tag-multi"
        >
          <span data-cms-key="multiple">Multiple</span>
        </li>
        <li
          :class="betSlipType === 'Combo' ? 'active' : ''"
          @click="$emit('set-bet-type', 'Combo')"
          class="m-list-bet-type-item m-snap-nav-item"
        >
          <span data-cms-key="system">System</span>
        </li>
      </ul>
      <i class="controls left-controls"></i>
      <i class="controls right-controls"></i>
    </div>
    <div class="betslip-notification" v-if="!acceptChanges">
      <div class="change-wrong-message">Note: changes in odds or availability</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  betSlipType: String,
  betType: String,
  acceptChanges: Boolean
})

defineEmits(['set-bet-type'])
</script>
