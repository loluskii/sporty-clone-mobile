<template>
    <div class="m-sportBets m-cashout">
        <div id="j_pop_cashout" class="m-cashout-pop">
            <div class="m-mask" @click="closeCashoutModal"></div>
            <div class="m-container m-container-fix">
                <div class="m-close" @click="closeCashoutModal"></div>
                <div class="m-main">
                    <div class="m-head f-alg-side">
                        <div class="f-alg-side-item">
                            <div class="m-t-12 m-t-l16 m-t-gray">Stake</div>
                            <div class="m-t-14 m-t-l16 m-t-default">
                                {{ cashoutData.stake.toFixed(2) }}
                            </div>
                        </div>
                        <div class="f-alg-side-item">
                            <div class="m-t-12 m-t-l16 m-t-gray">Pot. Win</div>
                            <div class="m-t-14 m-t-l16 m-t-default">
                                {{ cashoutData.possibleWin.toFixed(2) }}
                            </div>
                        </div>
                    </div>
                    <div class="m-body instant">
                        <div class="m-t-center m-l-top">
                            <div class="m-t-20 m-t-default m-t-bold m-total">
                                
                                <span data-cms-key="partial_cashout" data-cms-page="cashout">Full Cashout
                                </span>
                                <div class="number-grow-warp">
                                    <span class="number-grow">{{ displayCashout }}</span>
                                </div>
                            </div>
                            <div class="m-slider-bar">
                                <div
                                    role="slider"
                                    class="m-slider-wrapper m-slider-horizontal"
                                    :class="{ 'm-slider-disabled': !isCashoutAvailable }"
                                    style="width: auto; padding: 10px;"
                                >
                                    <div
                                        ref="sliderBarRef"
                                        aria-hidden="true"
                                        class="m-slider"
                                        style="height: 4px;"
                                        @pointerdown.prevent="onSliderPointerDown"
                                        @pointermove.prevent="onSliderPointerMove"
                                        @pointerup.prevent="onSliderPointerUp"
                                        @pointercancel.prevent="onSliderPointerUp"
                                    >
                                        <div
                                            class="m-slider-always m-slider-dot"
                                            :style="sliderDotStyle"
                                            style="width: 20px; height: 20px; top: -8px;"
                                        ></div>
                                        <ul class="m-slider-piecewise"></ul>
                                        <div class="m-slider-process" :style="sliderProcessStyle"></div>
                                    </div>
                                    <input
                                        v-model.number="sliderValue"
                                        type="range"
                                        :min="sliderInputMin"
                                        :max="maxCashout"
                                        :step="sliderStep"
                                        :disabled="!isCashoutAvailable"
                                        class="m-slider-sr-only"
                                    />
                                </div>
                                <div class="m-slide-range-label">
                                    <span data-cms-key="min_vmin" data-cms-page="cashout">Min {{ minLabel }}</span>
                                    <span data-cms-key="max_vmax" data-cms-page="cashout">Max {{ maxLabel }}</span>
                                </div>
                            </div>
                        </div>
                        <div class="m-btn-wrapper">
                            <div>
                                <button
                                    @click.prevent="confirmCashout"
                                    class="af-button af-button--primary"
                                    :class="{ 'is-disabled': !isCashoutAvailable || cashingOut }"
                                    :disabled="!isCashoutAvailable || cashingOut"
                                >
                                    <span v-if="!cashingOut"><span>Confirm</span>
                                        <span class="money">
                                            {{ SportsbookGlobalVariable.CurrencyCode }}
                                            {{ displayCashout }}
                                        </span>
                                    </span>
                                    <img v-else src="/loader.gif" height="24" width="24" alt="" srcset="" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { performCashout } from '@/helpers'
import { useUtilsStore } from '@/stores'
import emitter from '@/plugins/emitter'

const props = defineProps({
    cashoutData: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['close', 'cashout-success', 'cashout-failed'])

const { SportsbookGlobalVariable } = useUtilsStore()
const cashingOut = ref(false)
const sliderValue = ref(0)
const sliderBarRef = ref(null)
const isDragging = ref(false)
const activePointerId = ref(null)

const rawMaxCashout = computed(() => Number(props.cashoutData?.estimatedCashout || 0))
const isCashoutAvailable = computed(() => rawMaxCashout.value > 0)
const minCashout = computed(() => (rawMaxCashout.value > 0 ? 0.1 : 0))
const maxCashout = computed(() => (isCashoutAvailable.value ? rawMaxCashout.value : 0))
const sliderInputMin = computed(() => (isCashoutAvailable.value ? minCashout.value : 0))
const sliderStep = computed(() => 0.01)
const sliderPercent = computed(() => {
    const min = minCashout.value
    const max = maxCashout.value
    if (max <= min) return isCashoutAvailable.value ? 100 : 0
    const raw = ((sliderValue.value - min) / (max - min)) * 100
    return Math.min(100, Math.max(0, raw))
})
const sliderProcessStyle = computed(() => ({
    width: `${sliderPercent.value}%`,
    transform: 'translateY(calc(-50% + 2px))',
    transitionDuration: '0s',
    left: '0px'
}))
const sliderDotStyle = computed(() => ({
    left: `${sliderPercent.value}%`,
    transform: 'translateX(-50%)',
    transitionDuration: '0s'
}))
const cashoutAmount = computed(() => {
    if (!isCashoutAvailable.value) return 0
    return Math.min(maxCashout.value, Math.max(minCashout.value, sliderValue.value))
})
const displayCashout = computed(() => cashoutAmount.value.toFixed(2))
const minLabel = computed(() => minCashout.value.toFixed(2))
const maxLabel = computed(() => maxCashout.value.toFixed(2))

watch(
    () => props.cashoutData,
    () => {
        sliderValue.value = isCashoutAvailable.value ? maxCashout.value : 0
    },
    { immediate: true, deep: true }
)

watch(
    () => sliderValue.value,
    (value) => {
        if (!isCashoutAvailable.value) {
            sliderValue.value = 0
            return
        }
        const clamped = Math.min(maxCashout.value, Math.max(minCashout.value, value))
        if (clamped !== value) {
            sliderValue.value = clamped
        }
    }
)

function closeCashoutModal() {
    if (!cashingOut.value) {
        emit('close')
    }
}

function setSliderValueFromClientX(clientX) {
    const sliderEl = sliderBarRef.value
    if (!sliderEl) return
    const rect = sliderEl.getBoundingClientRect()
    if (rect.width === 0) return
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    const rawValue = minCashout.value + ratio * (maxCashout.value - minCashout.value)
    const step = sliderStep.value || 0.01
    const stepped = Math.round(rawValue / step) * step
    sliderValue.value = Number(stepped.toFixed(2))
}

function onSliderPointerDown(event) {
    if (!isCashoutAvailable.value) return
    event.preventDefault()
    event.stopPropagation()
    isDragging.value = true
    activePointerId.value = event.pointerId ?? null
    if (event.pointerId != null && sliderBarRef.value?.setPointerCapture) {
        sliderBarRef.value.setPointerCapture(event.pointerId)
    }
    setSliderValueFromClientX(event.clientX)
    window.addEventListener('pointermove', onWindowPointerMove)
    window.addEventListener('pointerup', onWindowPointerUp)
    window.addEventListener('pointercancel', onWindowPointerUp)
}

function onSliderPointerMove(event) {
    if (!isDragging.value || !isCashoutAvailable.value) return
    setSliderValueFromClientX(event.clientX)
}

function onSliderPointerUp() {
    isDragging.value = false
    activePointerId.value = null
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerUp)
    window.removeEventListener('pointercancel', onWindowPointerUp)
}

function onWindowPointerMove(event) {
    if (!isDragging.value) return
    if (activePointerId.value != null && event.pointerId !== activePointerId.value) return
    setSliderValueFromClientX(event.clientX)
}

function onWindowPointerUp(event) {
    if (activePointerId.value != null && event.pointerId !== activePointerId.value) return
    onSliderPointerUp()
}

async function confirmCashout() {
    if (cashingOut.value) return
    cashingOut.value = true
    try {
        const percent = maxCashout.value > 0 ? cashoutAmount.value / maxCashout.value : 0
        const res = await performCashout({
            betId: props.cashoutData.id,
            percent: Math.min(1, Math.max(0.1, percent)),
            source: 'mobile'
        })
        if (res.success) {
            emitter.emit('showDialogueToaster', 'Cashout Successful!')
            emit('cashout-success', res)
        } else {
            emitter.emit('showDialogueToaster', res.message)
            emit('cashout-failed', res)
        }
    } catch (error) {
        emitter.emit('showDialogueToaster', 'Cashout failed. Please try again.')
        emit('cashout-failed', error)
    } finally {
        cashingOut.value = false
        emit('close')
    }
}

onBeforeUnmount(() => {
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerUp)
    window.removeEventListener('pointercancel', onWindowPointerUp)
})

</script>
<style type="text/css">
.m-slider-wrapper {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    position: relative;
    touch-action: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
}

.m-slider-wrapper.m-slider-disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

.m-slider-wrapper.m-slider-disabled .m-slider-dot {
    cursor: not-allowed;
}

.m-slider-wrapper.m-slider-has-label {
    margin-bottom: 15px;
}

.m-slider-wrapper .m-slider {
    background-color: #EAECEF;
    border-radius: 15px;
    display: block;
    position: relative;
    touch-action: none;
}

.m-slider-wrapper .m-slider::after {
    content: "";
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
    z-index: 2;
    pointer-events: none;
}

.m-slider-wrapper .m-slider-process {
    background-color: #0D9737;
    border-radius: 15px;
    position: absolute;
    -webkit-transition: all 0s;
    transition: all 0s;
    z-index: 1;
}

.m-slider-wrapper .m-slider-dot {
    background-color: #FFFFFF;
    border-radius: 50%;
    -webkit-box-shadow: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.32);
    box-shadow: 0.5px 0.5px 2px 1px rgba(0, 0, 0, 0.32);
    cursor: pointer;
    position: absolute;
    -webkit-transition: all 0s;
    transition: all 0s;
    will-change: transform;
    z-index: 3;
    touch-action: none;
}

.m-slider-wrapper .m-slider-dot:after {
    bottom: -10px;
    content: "";
    left: -10px;
    position: absolute;
    right: -10px;
    top: -10px;
}

.m-slider-wrapper .m-slider-piecewise {
    height: 100%;
    left: 0;
    list-style: none;
    margin: 0;
    padding: 0;
    position: absolute;
    top: 0;
    width: 100%;
}

.m-slider-wrapper .m-slider-piecewise-item {
    height: 8px;
    position: absolute;
    width: 8px;
}

.m-slider-wrapper .m-slider-piecewise-item:first-child .m-slider-piecewise-dot,
.m-slider-wrapper .m-slider-piecewise-item:last-child .m-slider-piecewise-dot {
    visibility: hidden;
}

.m-slider-wrapper .m-slider-piecewise-dot {
    background-color: rgba(0, 0, 0, 0.16);
    border-radius: 50%;
    display: inline-block;
    height: 100%;
    left: 50%;
    position: absolute;
    top: 50%;
    -webkit-transform: translate(-50%, -50%);
    -ms-transform: translate(-50%, -50%);
    transform: translate(-50%, -50%);
    -webkit-transition: all 0.3s;
    transition: all 0.3s;
    width: 100%;
    z-index: 2;
}

.m-slider-wrapper .m-slider-sr-only {
    clip: rect(1px, 1px, 1px, 1px);
    height: 1px;
    overflow: hidden;
    position: absolute !important;
    width: 1px;
}

.m-slider-wrapper.m-slider-horizontal .m-slider-process {
    height: 100%;
    left: 0;
    top: 0;
    width: 0;
    will-change: width;
}

.m-slider-wrapper.m-slider-horizontal .m-slider-dot {
    left: 0;
}

.m-slider-wrapper.m-slider-horizontal .m-slider-piecewise-label {
    color: #353A45;
    display: inline-block;
    font-size: 12px;
    left: 50%;
    position: absolute;
    top: 100%;
    -webkit-transform: translate(-50%, 8px);
    -ms-transform: translate(-50%, 8px);
    transform: translate(-50%, 8px);
    visibility: visible;
    white-space: nowrap;
}

.m-slider-wrapper.m-slider-vertical .m-slider-process {
    bottom: 0;
    height: 0;
    left: 0;
    width: 100%;
    will-change: height;
}

.m-slider-wrapper.m-slider-vertical .m-slider-dot {
    bottom: 0;
}

.m-slider-wrapper.m-slider-vertical .m-slider-piecewise-label {
    color: #353A45;
    display: inline-block;
    font-size: 12px;
    left: 100%;
    position: absolute;
    top: 50%;
    -webkit-transform: translate(8px, -50%);
    -ms-transform: translate(8px, -50%);
    transform: translate(8px, -50%);
    visibility: visible;
    white-space: nowrap;
}

.m-slider-wrapper.m-slider-horizontal-reverse .m-slider-process {
    height: 100%;
    right: 0;
    top: 0;
    width: 0;
}

.m-slider-wrapper.m-slider-horizontal-reverse .m-slider-dot {
    right: 0;
}

.m-slider-wrapper.m-slider-horizontal-reverse .m-slider-piecewise-label {
    color: #353A45;
    display: inline-block;
    font-size: 12px;
    left: 50%;
    position: absolute;
    top: 100%;
    -webkit-transform: translate(-50%, 8px);
    -ms-transform: translate(-50%, 8px);
    transform: translate(-50%, 8px);
    visibility: visible;
    white-space: nowrap;
}

.m-slider-wrapper.m-slider-vertical-reverse .m-slider-process {
    height: 0;
    left: 0;
    top: 0;
    width: 100%;
}

.m-slider-wrapper.m-slider-vertical-reverse .m-slider-dot {
    top: 0;
}

.m-slider-wrapper.m-slider-vertical-reverse .m-slider-piecewise-label {
    color: #353A45;
    display: inline-block;
    font-size: 12px;
    left: 100%;
    position: absolute;
    top: 50%;
    -webkit-transform: translate(8px, -50%);
    -ms-transform: translate(8px, -50%);
    transform: translate(8px, -50%);
    visibility: visible;
    white-space: nowrap;
}
</style>
