import HeaderOther from '../../components/HeaderOther.vue';
<template>
  <div>
    <HeaderOther :header-title="'About Us'"></HeaderOther>
    <div class="body">
      <LoadingSpinner v-if="isLoading"></LoadingSpinner>
      <div v-else v-html="html"></div>
    </div>
  </div>
</template>

<script setup>
import HeaderOther from '@/components/HeaderOther.vue'
import { AboutUs } from '@/helpers'
import { onMounted, ref } from 'vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'

const html = ref('')
const isLoading = ref(false)

onMounted(async () => {
  try {
    isLoading.value = true
    const res = await AboutUs()
    isLoading.value = false
    html.value = res.body
  } catch (error) {}
})
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
