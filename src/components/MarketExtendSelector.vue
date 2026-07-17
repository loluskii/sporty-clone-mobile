<template>
  <div class="market-extend-selector">
    <div class="market-extend-selector-options">
      <button
        class="market-extend-selector-item"
        :class="{ active: upMode === 'none' }"
        type="button"
        @click="selectMode('none')"
      >
        <BaseIcon v-if="baseIconType" :type="baseIconType" class="market-extend-selector-item-icon" />
        <span>{{ baseText }}</span>
      </button>

      <button
        v-for="option in orderedOptions"
        :key="option.key"
        class="market-extend-selector-item"
        :class="{ active: upMode === option.key }"
        type="button"
        :aria-label="option.label"
        :disabled="isLoading"
        @click="selectMode(option.key)"
      >
        <UpIcon
          v-if="option.key === '1up' || option.key === '2up'"
          :mode="option.key"
          class="market-extend-selector-item-icon market-extend-selector-item-icon--up"
        />
        <span v-else-if="option.key === 'earlygoal'" class="market-extend-selector-item-icon market-extend-selector-item-icon--bolt">⚡</span>
        <span v-if="option.key !== '1up' && option.key !== '2up'">{{ option.label }}</span>
      </button>
    </div>

    <button
      class="market-extend-selector-info"
      type="button"
      aria-label="More information"
      @click.stop="emit('show-info')"
    >
      i
    </button>
  </div>
</template>

<script setup>
import { computed, defineComponent, h } from 'vue'

const props = defineProps({
  upMode: {
    type: String,
    default: 'none'
  },
  baseLabel: {
    type: String,
    default: 'Base'
  },
  modeOptions: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['set-mode', 'show-info'])

const orderedOptions = computed(() => {
  const priority = {
    '1up': 1,
    '2up': 2,
    earlygoal: 3
  }
  const allowedModes = new Set(['1up', '2up', 'earlygoal'])

  return [...props.modeOptions]
    .filter((option) => allowedModes.has(option?.key))
    .sort((a, b) => {
      return (priority[a.key] || 10) - (priority[b.key] || 10)
    })
})

const baseText = computed(() => {
  return (
    String(props.baseLabel || 'Base')
      .replace(/^(1x2|o\/u|over\/under)\s*/i, '')
      .trim() || 'Base'
  )
})

const baseIconType = computed(() => {
  const label = String(props.baseLabel || '').toLowerCase()
  if (label.includes('1x2')) return '1x2'
  if (label.includes('o/u') || label.includes('over/under')) return 'over-under'
  return ''
})

const selectMode = (mode) => {
  if (props.isLoading) return
  emit('set-mode', mode)
}

const BaseIcon = defineComponent({
  name: 'BaseIcon',
  props: {
    type: {
      type: String,
      default: '1x2'
    }
  },
  setup(iconProps) {
    return () => {
      if (iconProps.type === 'over-under') {
        return h(
          'svg',
          {
            viewBox: '0 0 15 12',
            fill: 'none',
            xmlns: 'http://www.w3.org/2000/svg'
          },
          [
            h('path', {
              d: 'M3.4823 4.58411C3.73507 4.59321 3.91825 4.63369 4.03931 4.698L4.04114 4.6991C4.17207 4.76457 4.26379 4.8794 4.3125 5.05652C4.36371 5.24286 4.39087 5.51077 4.39087 5.86438C4.39086 6.22257 4.36379 6.49534 4.3125 6.68689C4.26381 6.86396 4.17237 6.97883 4.0415 7.04431C3.91983 7.10515 3.73571 7.14308 3.4823 7.15161L3.36951 7.15344C3.10109 7.15344 2.89816 7.12338 2.75464 7.06885L2.69678 7.04395C2.56558 6.97804 2.47136 6.86226 2.41809 6.68469C2.37999 6.54138 2.35554 6.35284 2.34558 6.11743L2.34045 5.86438C2.34045 5.55494 2.36137 5.3111 2.40088 5.13013L2.41882 5.05652C2.4723 4.87979 2.56644 4.76469 2.69751 4.6991L2.69861 4.69873C2.84274 4.62448 3.06318 4.58228 3.36951 4.58228L3.4823 4.58411Z',
              fill: 'currentColor'
            }),
            h('path', {
              'fill-rule': 'evenodd',
              'clip-rule': 'evenodd',
              d: 'M14.25 -0.00195312C14.6642 -0.00195303 15 0.333833 15 0.748047V11.248C15 11.6623 14.6642 11.998 14.25 11.998H0.75C0.335787 11.998 0 11.6623 0 11.248V0.748047C0 0.333833 0.335786 -0.00195312 0.75 -0.00195312H14.25ZM7.86365 2.84094L6.22375 9.15515H7.53259L9.17249 2.84094H7.86365ZM3.36951 3.354C2.76378 3.354 2.28007 3.43121 1.92554 3.59277L1.92517 3.59314C1.57043 3.75727 1.31809 4.02866 1.17078 4.4021L1.17041 4.4032C1.03084 4.77021 0.963501 5.25916 0.963501 5.86438L0.965332 6.0321C0.973526 6.41616 1.01042 6.74977 1.07739 7.03113C1.15461 7.35029 1.28489 7.61374 1.47144 7.81628C1.65888 8.01978 1.91062 8.16372 2.22107 8.25171C2.52962 8.33913 2.9133 8.38208 3.36951 8.38208L3.53723 8.38025C3.92047 8.37085 4.24798 8.3282 4.51794 8.25171C4.82838 8.16372 5.08014 8.01979 5.26758 7.81628C5.45448 7.61335 5.58248 7.34931 5.65466 7.02966L5.6543 7.0293C5.72105 6.74823 5.75818 6.41552 5.76636 6.0321L5.76819 5.86438C5.76819 5.46999 5.73953 5.12598 5.68103 4.83386L5.6543 4.71191C5.58214 4.38829 5.4543 4.12259 5.26758 3.9198C5.08018 3.71634 4.82848 3.57202 4.51794 3.48401C4.20935 3.39657 3.82563 3.35401 3.36951 3.354ZM9.77454 3.42102V6.28809C9.77454 6.78001 9.83456 7.18269 9.95984 7.49072C10.0882 7.80625 10.3144 8.03696 10.6329 8.1803L10.6348 8.1814C10.9539 8.31737 11.3924 8.38208 11.9429 8.38208L12.137 8.37915C12.5775 8.36486 12.9339 8.30029 13.2008 8.18066L13.2019 8.17993C13.511 8.03603 13.7291 7.80468 13.8519 7.48962L13.8516 7.48926C13.9608 7.21992 14.0204 6.87845 14.0336 6.46826L14.0365 6.28809V3.42102H12.6595V6.26575C12.6595 6.51451 12.6371 6.70192 12.5966 6.83264C12.5586 6.95487 12.4928 7.03434 12.4006 7.08093C12.3292 7.1151 12.2271 7.13897 12.0908 7.14868L11.9429 7.15344C11.7153 7.15344 11.5485 7.1265 11.4364 7.0791C11.3342 7.03102 11.2626 6.9504 11.2211 6.83008C11.1876 6.73292 11.1653 6.60366 11.1562 6.44043L11.1519 6.26575V3.42102H9.77454Z',
              fill: 'currentColor'
            })
          ]
        )
      }

      return (
      h(
        'svg',
        {
          viewBox: '0 0 15 12',
          fill: 'none',
          xmlns: 'http://www.w3.org/2000/svg'
        },
        [
          h('path', {
            'fill-rule': 'evenodd',
            'clip-rule': 'evenodd',
            d: 'M14.25 0C14.6642 9.66383e-08 15 0.335787 15 0.75V11.25C15 11.6642 14.6642 12 14.25 12H0.75C0.335787 12 0 11.6642 0 11.25V0.75C0 0.335786 0.335786 6.0399e-09 0.75 0H14.25ZM11.8817 3.39954C11.5009 3.39954 11.1484 3.43936 10.8245 3.51892C10.5005 3.59849 10.239 3.70078 10.04 3.82581V4.94275H10.1166C10.3326 4.82339 10.5828 4.71838 10.8669 4.62744C11.1512 4.53081 11.4298 4.48242 11.7026 4.48242C11.9867 4.48243 12.2054 4.52778 12.3589 4.61865C12.518 4.70391 12.6007 4.85459 12.6064 5.07056C12.6121 5.25244 12.5212 5.40894 12.3336 5.53967C12.1517 5.66471 11.8988 5.79548 11.5748 5.93188C11.1429 6.11376 10.8045 6.28982 10.5601 6.46033C10.3156 6.63085 10.1424 6.81857 10.04 7.02319C9.94343 7.22778 9.89504 7.47495 9.89502 7.76477V8.71985H13.9365V7.63696H11.157C11.157 7.50626 11.2507 7.37546 11.4382 7.24475C11.6315 7.10834 11.9812 6.94361 12.4871 6.75037C13.0099 6.55144 13.3737 6.31839 13.5784 6.05127C13.7887 5.77844 13.8937 5.41741 13.8937 4.96838C13.8937 4.39999 13.709 3.99643 13.3396 3.75769C12.9758 3.51897 12.4899 3.39955 11.8817 3.39954ZM2.06104 3.44202L1.06348 4.073V5.52246H1.10632L2.01855 4.91711H2.06104V8.67737H3.35706L3.34021 3.44202H2.06104ZM4.22607 3.28015L5.70117 5.88062V5.9231L4.12354 8.67737H5.82898L6.80933 6.76721H6.83496L7.81567 8.67737H9.52075L7.94348 5.9231V5.88062L9.41858 3.28015H7.73877L6.83496 5.15588H6.80933L5.90588 3.28015H4.22607Z',
            fill: 'currentColor'
          })
        ]
      )
      )
    }
  }
})

const UpIcon = defineComponent({
  name: 'UpIcon',
  props: {
    mode: {
      type: String,
      required: true
    }
  },
  setup(iconProps) {
    return () => {
      const isOne = iconProps.mode === '1up'
      return h(
        'svg',
        {
          viewBox: isOne ? '0 0 60 30' : '0 0 64 30',
          xmlns: 'http://www.w3.org/2000/svg'
        },
        isOne
          ? [
              h('path', {
                d: 'M3.2 6.3L11.8 1.5H17.2V27.4H10.2V10.2L6.1 12.5L3.2 6.3Z',
                fill: 'currentColor'
              }),
              h('path', {
                d: 'M20.5 2.1H27.8V16.7C27.8 19.1 29 20.5 31.3 20.5C33.6 20.5 34.8 19.1 34.8 16.7V2.1H42.1V17C42.1 24.1 38 28 31.3 28C24.6 28 20.5 24.1 20.5 17V2.1Z',
                fill: 'currentColor'
              }),
              h('path', {
                d: 'M44.7 2.1H52.1C56.7 2.1 59.3 4.7 59.3 8.7C59.3 12.7 56.7 15.3 52.1 15.3H50.7V27.4H44.7V2.1ZM51.4 10.5C52.9 10.5 53.8 9.8 53.8 8.7C53.8 7.5 52.9 6.9 51.4 6.9H50.7V10.5H51.4Z',
                fill: 'currentColor'
              })
            ]
          : [
              h('path', {
                d: 'M3.5 9.2C3.5 4.3 7.3 1.5 13.1 1.5C18.8 1.5 22.2 4.1 22.2 8.4C22.2 11.6 20.5 13.8 16.7 16.1L11.6 19.2H22.5V27.4H3.6V21.1L13.1 15.1C15 13.9 15.7 12.9 15.7 11.5C15.7 10.1 14.6 9.2 12.9 9.2C11 9.2 9.8 10.4 9.8 12.4H3.5V9.2Z',
                fill: 'currentColor'
              }),
              h('path', {
                d: 'M25.2 2.1H32.5V16.7C32.5 19.1 33.7 20.5 36 20.5C38.3 20.5 39.5 19.1 39.5 16.7V2.1H46.8V17C46.8 24.1 42.7 28 36 28C29.3 28 25.2 24.1 25.2 17V2.1Z',
                fill: 'currentColor'
              }),
              h('path', {
                d: 'M49.4 2.1H56.8C61.4 2.1 64 4.7 64 8.7C64 12.7 61.4 15.3 56.8 15.3H55.4V27.4H49.4V2.1ZM56.1 10.5C57.6 10.5 58.5 9.8 58.5 8.7C58.5 7.5 57.6 6.9 56.1 6.9H55.4V10.5H56.1Z',
                fill: 'currentColor'
              })
            ]
      )
    }
  }
})
</script>

<style scoped>
.market-extend-selector {
  align-items: center;
  background: var(--background-general-primary, #fafafa);
  box-sizing: border-box;
  display: flex;
  gap: 0.45rem;
  overflow: hidden;
  padding: 0.45rem 0.75rem 0.55rem;
  position: relative;
  width: 100%;
}

.market-extend-selector-options {
  align-items: center;
  background: #e6e7eb;
  border-radius: 999px;
  box-sizing: border-box;
  display: flex;
  flex: 1 1 auto;
  gap: 0.15rem;
  min-width: 0;
  overflow: hidden;
  padding: 0.12rem;
}

.market-extend-selector-item {
  align-items: center;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
  box-sizing: border-box;
  color: #8d909b;
  cursor: pointer;
  display: inline-flex;
  flex: 1 1 0;
  font-size: 0.9rem;
  font-weight: 700;
  gap: 0.28rem;
  height: 2.15rem;
  line-height: 1;
  min-width: 0;
  padding: 0 0.55rem;
  justify-content: center;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease;
}

.market-extend-selector-item span:not(.market-extend-selector-item-icon) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.market-extend-selector-item.active {
  background-color: var(--background-general-primary, #fafafa);
  border-color: var(--brand-active-tab-bg, var(--brand-highlight-text, #5b4a99));
  box-shadow: 0 0.08rem 0.22rem rgba(27, 30, 37, 0.08);
  color: var(--brand-highlight-text);
}

.market-extend-selector-item:disabled {
  cursor: wait;
  opacity: 0.6;
}

.market-extend-selector-item-icon {
  color: currentColor;
  display: block;
  flex: 0 0 auto;
  height: 1rem;
  width: 1.25rem;
}

.market-extend-selector-item-icon--up {
  height: 1.15rem;
  max-width: 2.4rem;
  width: 100%;
}

.market-extend-selector-item-icon--bolt {
  align-items: center;
  display: inline-flex;
  font-size: 1rem;
  justify-content: center;
  width: 1rem;
}

.market-extend-selector-info {
  align-items: center;
  background: #8d909b;
  border: 0;
  border-radius: 50%;
  box-sizing: border-box;
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 1.65rem;
  font-size: 0.9rem;
  font-weight: 700;
  height: 1.65rem;
  justify-content: center;
  line-height: 1;
  width: 1.65rem;
}

</style>
