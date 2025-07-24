import HeaderOther from '../../components/HeaderOther.vue';
<template>
  <div>
    <HeaderOther :header-title="pageTitle.toUpperCase()"></HeaderOther>
    <div class="body">
      <LoadingSpinner v-if="isLoading"></LoadingSpinner>
      <div v-else v-html="html"></div>
    </div>
  </div>
</template>

<script setup>
import HeaderOther from "@/components/HeaderOther.vue";
import { getCMS } from "@/helpers";
import { onMounted, ref, computed } from "vue";
import LoadingSpinner from "@/components/Loaders/LoadingSpinner.vue";
import { useRoute } from "vue-router";

const html = ref("");
const route = useRoute();
const isLoading = ref(false);

const pageTitle = computed(() => {
  let page = route.params.page.replace(/_/g, " ");
  return page;
});

onMounted(async () => {
  try {
    isLoading.value = true;
    const res = await getCMS(route.params.page);
    isLoading.value = false;
    html.value = res.body;
  } catch (error) {}
});
</script>
<style scoped>
.body {
  padding: 1.5rem;
}
h2 {
  font-size: 1.33333333rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

h3 {
  font-size: 1rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

p {
  margin-bottom: 1rem;
}
</style>
