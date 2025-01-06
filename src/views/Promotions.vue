<template>
  <div class="x-load-bet">
    <HeaderOther :headerTitle="'Promotion'"></HeaderOther>
    <div v-if="pageMode === 'general-mode'" class="m-main-info p-3">
      <div class="row">
        <div v-for="promo in promotions" :key="promo.id" class="col-12">
          <div class="card mb-3">
            <img class="card-img-top" :src="promo.imageUrl" alt="Card image cap" />
            <div class="card-body p-2">
              <h5 class="card-title">{{ promo.title }}</h5>
              <p>{{ promo.content.slice(0,100) }}...</p>
            </div>
            <div
              class="card-footer d-flex justify-content-between align-items-center p-2"
            >
              <button
                class="btn btn-sm text-white"
                style="background-color: var(--brand-secondary)"
                @click.prevent="goToLink(promo.targetUrl)"
              >
                Play Now
              </button>
              <a
                href=""
                class="text-decoration-none btn-sm"
                @click.prevent="goToPromotion(promo)"
                >Read More...</a
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import HeaderOther from "@/components/HeaderOther.vue";
import { onMounted, ref } from "vue";
import { getPromotions } from "../helpers";
import { useCouponStore } from "../stores";
import emitter from "../plugins/emitter";
import { useRouter } from "vue-router";

const pageTitle = ref("Promotions");
const pageMode = ref("general-mode");
const bookingCode = ref("");
const isLoading = ref(false);
const couponStore = useCouponStore();
const router = useRouter();
const errorMesssage = ref("");
const promotions = ref([]);

function goToPromotion(promo) {
  pageTitle.value = promo.title;
  pageMode.value = "single-mode";
}

function goToLink(link) {
  window.location.href = link;
}

onMounted(async () => {
  const res = await getPromotions();
  promotions.value = res.data;
});
</script>

<style scoped>
@import url("@/assets/css/casino.css");
</style>
