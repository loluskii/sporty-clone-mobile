<template>
  <div>
    <Vue3Marquee>
      <div
        v-if="winners"
        style="
          padding: 3px 10px;
          background-color: var(--brand-secondary);
          width: 100%;
          display: inline-flex;
        "
      >
        <p
          style="color: #fafafa; padding-right: 10px"
          v-for="(winner, index) in winners"
          :key="index"
        >
          {{ `${winner.username} won ` }} &bull;
          <b style="font-weight: bold">{{
            `${winner.currency} ${winner.winAmount.toLocaleString("en")}`
          }}</b>
        </p>
      </div>
    </Vue3Marquee>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue";
import { getJackpotWinners } from "@/helpers";
const winners = ref(null);

onMounted(async () => {
  try {
    const res = await getJackpotWinners();
    winners.value = res.data.winners ?? null;
  } catch (error) {
    winners.value = null;
  }
});
</script>
