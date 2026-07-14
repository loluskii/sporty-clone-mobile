<template>
  <div id="carousel" data-html2canvas-ignore="" class="status-carousel">
    <div class="status-rail" aria-label="Promotions">
      <button
        v-for="(banner, index) in displayBanners"
        :key="`${banner.image}-${index}`"
        class="status-card"
        type="button"
        @click="openStory(index)"
      >
        <img class="status-image" :src="banner.image" :alt="getBannerTitle(banner, index)" />
        <span class="status-title">{{ getBannerTitle(banner, index) }}</span>
      </button>
    </div>

    <Teleport to="body">
      <Transition name="story-viewer">
        <div v-if="storyOpen" class="story-viewer" @click.self="closeStory">
          <div class="story-progress-list">
            <div
              v-for="(banner, index) in displayBanners"
              :key="`progress-${banner.image}-${index}`"
              class="story-progress-track"
            >
              <span
                class="story-progress-fill"
                :class="{
                  complete: index < activeStoryIndex,
                  active: index === activeStoryIndex
                }"
                :key="index === activeStoryIndex ? storyProgressKey : `static-${index}`"
              ></span>
            </div>
          </div>

          <button class="story-close" type="button" aria-label="Close story" @click="closeStory">
            &times;
          </button>

          <button
            class="story-nav story-nav-prev"
            type="button"
            aria-label="Previous promotion"
            @click="showPreviousStory"
          ></button>
          <button
            class="story-nav story-nav-next"
            type="button"
            aria-label="Next promotion"
            @click="showNextStory"
          ></button>

          <div class="story-content">
            <img
              class="story-image"
              :src="activeStory.image"
              :alt="getBannerTitle(activeStory, activeStoryIndex)"
            />
            <div class="story-caption">
              <div class="story-caption-title">{{ getBannerTitle(activeStory, activeStoryIndex) }}</div>
              <button
                v-if="activeStory.link"
                class="story-cta"
                type="button"
                @click.stop="goToSlide(activeStory)"
              >
                Open
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useUtilsStore } from '../../stores'
import placeholderBanner from '@/assets/images/banner.png'

defineProps(['type'])

const STORY_DURATION = 5000
const utilsStore = useUtilsStore()
const activeStoryIndex = ref(0)
const storyOpen = ref(false)
const storyTimer = ref(null)
const storyProgressKey = ref(0)

const banners = computed(() => {
  return utilsStore.banners.filter((banner) => banner.position === 'slider')
})

const displayBanners = computed(() => {
  if (banners.value.length) {
    return banners.value
  }

  return [
    {
      image: placeholderBanner,
      link: '',
      title: 'Promo'
    }
  ]
})

const activeStory = computed(() => {
  return displayBanners.value[activeStoryIndex.value] || displayBanners.value[0]
})

function getBannerTitle(banner = {}, index = 0) {
  return banner.title || banner.name || banner.caption || `Promo ${index + 1}`
}

function openStory(index) {
  activeStoryIndex.value = index
  storyOpen.value = true
  document.body.classList.add('no-scroll')
  startStoryProgress()
}

function closeStory() {
  storyOpen.value = false
  document.body.classList.remove('no-scroll')
  stopStoryProgress()
}

function startStoryProgress() {
  stopStoryProgress()
  storyProgressKey.value += 1
  storyTimer.value = setTimeout(() => {
    showNextStory()
  }, STORY_DURATION)
}

function stopStoryProgress() {
  if (!storyTimer.value) return
  clearTimeout(storyTimer.value)
  storyTimer.value = null
}

function showNextStory() {
  if (activeStoryIndex.value >= displayBanners.value.length - 1) {
    closeStory()
    return
  }
  activeStoryIndex.value += 1
  startStoryProgress()
}

function showPreviousStory() {
  if (activeStoryIndex.value <= 0) {
    startStoryProgress()
    return
  }
  activeStoryIndex.value -= 1
  startStoryProgress()
}

function goToSlide(image) {
  if (image.link) {
    window.location.href = image.link
  }
}

onBeforeUnmount(() => {
  closeStory()
})
</script>

<style scoped>
.status-carousel {
  padding: 0.65rem 0.66666667rem 0.75rem;
  position: relative;
}

.status-rail {
  display: flex;
  gap: 0.66666667rem;
  overflow-x: auto;
  padding: 0;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.status-rail::-webkit-scrollbar {
  display: none;
}

.status-card {
  background: #111318;
  border: 0;
  border-radius: 0.33333333rem;
  box-shadow: 0 0.33333333rem 0.75rem rgba(27, 30, 37, 0.22);
  flex: 0 0 7.33333333rem;
  height: 4.33333333rem;
  overflow: hidden;
  padding: 0;
  position: relative;
  text-align: left;
}

.status-card::after {
  background:
    linear-gradient(180deg, rgba(0, 0, 0, 0.05) 28%, rgba(0, 0, 0, 0.72) 100%),
    linear-gradient(90deg, rgba(0, 0, 0, 0.28), transparent 58%);
  content: '';
  inset: 0;
  position: absolute;
  z-index: 1;
}

.status-image {
  display: block;
  height: 100%;
  object-fit: cover;
  width: 100%;
  transition: transform 220ms ease;
}

.status-card:active .status-image {
  transform: scale(1.06);
}

.status-title {
  bottom: 0.58333333rem;
  color: #ffffff;
  display: -webkit-box;
  font-size: 0.95rem;
  font-weight: 900;
  left: 0.58333333rem;
  line-height: 0.98;
  overflow: hidden;
  position: absolute;
  right: 0.58333333rem;
  text-shadow: 0 0.16666667rem 0.5rem rgba(0, 0, 0, 0.75);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  z-index: 2;
}

.story-viewer {
  background: #050608;
  inset: 0;
  position: fixed;
  z-index: 1200;
}

.story-progress-list {
  display: flex;
  gap: 0.25rem;
  left: 0.83333333rem;
  position: absolute;
  right: 0.83333333rem;
  top: calc(env(safe-area-inset-top, 0px) + 0.75rem);
  z-index: 4;
}

.story-progress-track {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  flex: 1;
  height: 0.2rem;
  overflow: hidden;
}

.story-progress-fill {
  background: #ffffff;
  display: block;
  height: 100%;
  transform: scaleX(0);
  transform-origin: left center;
  width: 100%;
}

.story-progress-fill.complete {
  transform: scaleX(1);
}

.story-progress-fill.active {
  animation: story-progress 5s linear forwards;
}

.story-close {
  align-items: center;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  color: #ffffff;
  display: flex;
  font-size: 2rem;
  height: 2.33333333rem;
  justify-content: center;
  line-height: 1;
  position: absolute;
  right: 0.83333333rem;
  top: calc(env(safe-area-inset-top, 0px) + 1.35rem);
  width: 2.33333333rem;
  z-index: 5;
}

.story-nav {
  background: transparent;
  border: 0;
  bottom: 0;
  position: absolute;
  top: 0;
  width: 35%;
  z-index: 3;
}

.story-nav-prev {
  left: 0;
}

.story-nav-next {
  right: 0;
}

.story-content {
  align-items: center;
  display: flex;
  height: 100%;
  justify-content: center;
  overflow: hidden;
  position: relative;
  width: 100%;
}

.story-content::before {
  background:
    radial-gradient(circle at 20% 10%, rgba(228, 24, 39, 0.25), transparent 28%),
    linear-gradient(180deg, rgba(0, 0, 0, 0.3), transparent 20%, rgba(0, 0, 0, 0.72));
  content: '';
  inset: 0;
  pointer-events: none;
  position: absolute;
  z-index: 1;
}

.story-image {
  height: 100%;
  object-fit: contain;
  width: 100%;
}

.story-caption {
  align-items: center;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  left: 1rem;
  position: absolute;
  right: 1rem;
  z-index: 4;
}

.story-caption-title {
  color: #ffffff;
  font-size: 1.15rem;
  font-weight: 800;
  line-height: 1.2;
  text-shadow: 0 0.25rem 1rem rgba(0, 0, 0, 0.45);
}

.story-cta {
  background: #ffffff;
  border: 0;
  border-radius: 999px;
  color: #111318;
  flex: 0 0 auto;
  font-size: 0.9rem;
  font-weight: 800;
  padding: 0.65rem 1.05rem;
}

.story-viewer-enter-active,
.story-viewer-leave-active {
  transition: opacity 180ms ease;
}

.story-viewer-enter-from,
.story-viewer-leave-to {
  opacity: 0;
}

@keyframes story-progress {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}
</style>
