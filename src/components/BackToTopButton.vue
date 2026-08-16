<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps({
  blocked: {
    type: Boolean,
    default: false
  },
  threshold: {
    type: Number,
    default: 480
  }
})

const pastThreshold = ref(false)
let rafId = 0

const updateVisibility = () => {
  if (typeof window === 'undefined') return
  pastThreshold.value = window.scrollY > props.threshold
}

const handleScroll = () => {
  if (rafId) return

  rafId = window.requestAnimationFrame(() => {
    rafId = 0
    updateVisibility()
  })
}

const isVisible = computed(() => pastThreshold.value && !props.blocked)

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

onMounted(() => {
  updateVisibility()
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', updateVisibility)
})

onBeforeUnmount(() => {
  if (rafId) {
    window.cancelAnimationFrame(rafId)
  }

  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', updateVisibility)
})
</script>

<template>
  <Teleport to="body">
    <transition name="back-to-top-fade">
      <button
        v-if="isVisible"
        type="button"
        class="back-to-top-button"
        aria-label="Back to top"
        @click="scrollToTop"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M8 13.5V2.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M3.5 7.5L8 3L12.5 7.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <span>Back to Top</span>
      </button>
    </transition>
  </Teleport>
</template>

<style scoped>
.back-to-top-button {
  position: fixed;
  inset: auto;
  left: 50%;
  bottom: calc(env(safe-area-inset-bottom) + 5.75rem);
  z-index: 700;
  display: inline-flex;
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 0;
  max-width: calc(100vw - 2rem);
  white-space: nowrap;
  align-items: center;
  gap: 0.45rem;
  border: 1px solid rgba(13, 151, 55, 0.24);
  border-radius: 9999px;
  padding: 0.65rem 1rem;
  background: rgba(6, 16, 28, 0.94);
  color: #ffffff;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.28);
  transform: translateX(-50%);
  line-height: 1;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.back-to-top-button svg {
  flex: none;
  color: #32ce62;
}

.back-to-top-button span {
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.02em;
  line-height: 1;
}

.back-to-top-button:active {
  transform: translateX(-50%) scale(0.98);
}

.back-to-top-fade-enter-active,
.back-to-top-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.back-to-top-fade-enter-from,
.back-to-top-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(18px);
}

.back-to-top-fade-enter-to,
.back-to-top-fade-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
</style>
