<template>
  <div class="success-wrap">
    <div class="success-dialog">
      <div class="success-hero">
        <div class="success-badge" aria-hidden="true">
          <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="currentColor" />
            <path
              d="M17.5 28.8L24.25 35.55L39.5 20.45"
              stroke="white"
              stroke-width="5.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>
        <p class="success-kicker">Ticket accepted</p>
        <h3 class="title">
          <span>Bet Successful</span>
        </h3>
      </div>

      <ul class="list" aria-label="Bet summary">
        <li data-op="betslip-success-stake">
          <span>Total Stake</span>
          <strong>{{ formatNumber(stake) }}</strong>
        </li>

        <li>
          <span>Potential Win</span>
          <strong>{{ formatNumber(possibleWin) }}</strong>
        </li>

        <li class="share-code">
          <span class="share-code-label">
            <span>Booking Code</span>
            <span
              class="booking-info"
              aria-hidden="true"
            >
              i
            </span>
          </span>
          <strong class="booking-code-value">
            <button
              class="booking-icon-btn"
              type="button"
              aria-label="Share booking code"
              @click="activateShare"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 18 18"
                class="svg-icon-base"
              >
                <g fill="none" fill-rule="evenodd">
                  <path d="M0 0h18v18H0z"></path>
                  <path
                    fill="currentColor"
                    fill-rule="nonzero"
                    d="M13.5 12.06c-.57 0-1.08.225-1.47.577L6.683 9.525c.037-.173.067-.345.067-.525 0-.18-.03-.352-.067-.525l5.287-3.082a2.247 2.247 0 003.78-1.643c0-1.245-1.005-2.25-2.25-2.25s-2.25 1.005-2.25 2.25c0 .18.03.353.068.525L6.03 7.357A2.247 2.247 0 002.25 9a2.247 2.247 0 003.78 1.643l5.34 3.12c-.037.157-.06.322-.06.487 0 1.207.982 2.19 2.19 2.19 1.207 0 2.19-.983 2.19-2.19 0-1.207-.982-2.19-2.19-2.19z"
                  ></path>
                </g>
              </svg>
            </button>
            <button
              class="booking-icon-btn"
              type="button"
              :aria-label="copied ? 'Booking code copied' : 'Copy booking code'"
              @click="copyToClipboard(shareCode)"
            >
              <svg
                viewBox="5 2 15 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                class="svg-icon-base"
              >
                <path
                  d="M15.79 2.75H5.684C4.758 2.75 4 3.506 4 4.431v11.774h1.684V4.43H15.79V2.75zm2.526 3.364H9.053c-.927 0-1.684.756-1.684 1.681V19.57c0 .925.757 1.681 1.684 1.681h9.263c.927 0 1.684-.756 1.684-1.681V7.795c0-.925-.758-1.681-1.684-1.681zm0 13.453H9.053V7.797h9.263V19.57v-.003z"
                  fill="currentColor"
                ></path>
              </svg>
            </button>
            <span class="booking-code-text">{{ shareCode }}</span>
          </strong>
        </li>
      </ul>

      <div class="jump-box">
        <button data-op="betslip-success-history" type="button" @click="viewOpenBets">
          <span>View Open Bets</span>
          <i></i>
        </button>
      </div>
    </div>

    <div v-if="copied" class="success-toast">Booking code copied</div>

    <div class="btn-box">
      <button class="af-button rebet af-button--primary" type="button" @click="$emit('rebet')">
        <span><span data-cms-key="rebet">Rebet</span></span>
      </button>
      <button class="af-button btn-ok af-button--primary" type="button" @click="$emit('hide-success')">
        <span><span data-cms-key="ok" style="color: white">OK</span></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { formatNumber } from '@/helpers'
import { computed, ref } from 'vue'
const router = useRouter()
const props = defineProps({
  response: Object
})

const emit = defineEmits(['hide-success', 'rebet', 'activate-share'])
const copied = ref(false)

const firstBet = computed(() => props.response?.data?.bets?.[0] || {})
const stake = computed(() => firstBet.value?.stake || 0)
const possibleWin = computed(() => firstBet.value?.possibleWin || 0)
const shareCode = computed(() => firstBet.value?.share_code || '')

function viewOpenBets() {
  emit('hide-success')
  return router.push({ name: 'bets-view' })
}

function activateShare() {
  emit('activate-share', props.response)
}

async function copyToClipboard(text) {
  if (!text) return
  const textarea = document.createElement('textarea')
  textarea.value = text
  document.body.appendChild(textarea)
  textarea.select()

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      document.execCommand('copy')
    }
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch (err) {
    console.error('Unable to copy to clipboard', err)
  } finally {
    document.body.removeChild(textarea)
  }
}
</script>
<style scoped>
.success-wrap {
  bottom: 0;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: block;
  height: 100%;
  left: 0;
  position: absolute;
  width: 100%;
  z-index: 1000;
}

.success-wrap .success-dialog {
  background:
    radial-gradient(circle at 50% 0%, rgba(42, 201, 99, 0.14), transparent 15rem),
    #ffffff;
  bottom: 0px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #353a45;
  overflow: auto;
  padding: 2.25rem 1.35rem 6.5rem;
  position: absolute;
  width: 100%;
  z-index: 333;
  border-radius: 1.35rem 1.35rem 0 0;
  box-shadow: 0 -0.5rem 1.8rem rgba(16, 24, 40, 0.14);
}

.success-hero {
  align-items: center;
  display: flex;
  flex-direction: column;
  text-align: center;
}

.success-badge {
  color: var(--brand-highlight-text, #16a34a);
  display: grid;
  height: 5.2rem;
  margin-bottom: 0.85rem;
  place-items: center;
  position: relative;
  width: 5.2rem;
}

.success-badge::before {
  background: currentColor;
  border-radius: 999px;
  content: '';
  inset: -0.55rem;
  opacity: 0.1;
  position: absolute;
}

.success-badge svg {
  filter: drop-shadow(0 0.55rem 0.9rem rgba(0, 145, 70, 0.24));
  height: 100%;
  position: relative;
  width: 100%;
}

.success-kicker {
  color: var(--brand-highlight-text, #16a34a);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0 0 0.35rem;
  text-transform: uppercase;
}

.success-wrap .success-dialog .title {
  color: #1f2430;
  font-size: 1.8rem;
  font-weight: 900;
  line-height: 2rem;
  margin: 0;
  padding-bottom: 1.45rem;
  text-align: center;
}

.success-wrap .success-dialog .title .m-icon-suc {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: block;
  padding-bottom: 1.33333333rem;
  text-align: center;
}

.success-wrap .success-dialog .title .m-icon-suc:before {
  content: '\e60b';
  font-family: 'iconfont' !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.success-wrap .success-dialog .title .m-icon-suc:before {
  color: var(--brand-primary);
  font-size: 4rem;
  line-height: 1;
  position: relative;
  text-align: center;
  vertical-align: middle;
  z-index: 11;
}

.success-wrap .success-dialog .list {
  background: #f7f8fa;
  border: 1px solid #eef0f4;
  border-radius: 1.05rem;
  list-style: none;
  margin: 0;
  padding: 0.45rem 0.95rem;
}

.success-wrap .success-dialog .list li {
  align-items: center;
  border-bottom: 1px solid rgba(53, 58, 69, 0.08);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1rem;
  gap: 1rem;
  line-height: 1.25rem;
  min-height: 3.4rem;
  padding: 0.35rem 0;
}

.success-wrap .success-dialog .list li:last-child {
  border-bottom: 0;
}

.success-wrap .success-dialog .list li span {
  -webkit-box-flex: 1;
  -webkit-flex: 1 0 0%;
  -ms-flex: 1 0 0%;
  flex: 1 0 0%;
}

.success-wrap .success-dialog .list li strong {
  color: #252a36;
  flex: 1 0 0%;
  font-size: 1.08rem;
  font-weight: 900;
  text-align: right;
}

.success-wrap .success-dialog .list li span:first-child {
  color: #8f96a3;
  font-weight: 700;
}

.success-wrap .success-dialog .list li.share-code img {
  -webkit-transform: translateY(-2px);
  -ms-transform: translateY(-2px);
  transform: translateY(-2px);
}

.share-code-label {
  align-items: center;
  display: inline-flex;
  gap: 0.4rem;
}

.booking-info {
  align-items: center;
  background: #a2a7b3;
  border: 0;
  border-radius: 50%;
  color: #ffffff;
  display: inline-flex;
  font-size: 0.75rem;
  font-weight: 900;
  height: 1.25rem;
  justify-content: center;
  width: 1.25rem;
}

.booking-code-value {
  align-items: center;
  background: #ffffff;
  border: 1px solid #e5e7ec;
  border-radius: 999px;
  display: inline-flex;
  flex: 0 0 auto !important;
  gap: 0.45rem;
  justify-content: flex-end;
  padding: 0.45rem 0.65rem;
  text-align: right;
}

.booking-icon-btn {
  align-items: center;
  background: transparent;
  border: 0;
  color: #8f96a3;
  cursor: pointer;
  display: inline-flex;
  height: 1.35rem;
  justify-content: center;
  padding: 0;
  width: 1.35rem;
}

.booking-icon-btn .svg-icon-base {
  height: 1.22rem;
  width: 1.22rem;
}

.booking-code-text {
  color: #252a36 !important;
  flex: 0 0 auto !important;
  font-weight: 900 !important;
  letter-spacing: 0.04em;
  text-align: right;
}

.success-wrap .success-dialog .list li.share-code em:before {
  content: '\e651';
  font-family: 'iconfont' !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.success-wrap .success-dialog .list li.share-code em:before {
  color: #9ca0ab;
  padding-left: 0.41666667rem;
}

.success-wrap .success-dialog .cashout-top {
  color: #9ca0ab;
  font-size: 0.83333333rem;
  padding: 0.66666667rem 1.33333333rem 0;
}

.success-wrap .success-dialog .jump-box {
  margin-top: 1.25rem;
  text-align: center;
}

.success-wrap .success-dialog .jump-box button {
  align-items: center;
  background: transparent;
  border: 0;
  color: var(--brand-highlight-text, #16a34a);
  cursor: pointer;
  display: inline-flex;
  font-size: 1.05rem;
  font-weight: 900;
  gap: 0.35rem;
  justify-content: center;
  min-height: 2.8rem;
  padding: 0 0.5rem;
}

.success-wrap .success-dialog .jump-box i {
  display: inline-block;
  padding-left: 10px;
  vertical-align: middle;
}

.success-wrap .success-dialog .jump-box i:before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.success-wrap .success-dialog .jump-box i::before {
  color: var(--brand-highlight-text, #16a34a);
}

.success-wrap .success-dialog .bottomImg {
  display: block;
  margin-top: 1.75rem;
}

.success-wrap .success-dialog .bottomImg img {
  max-height: 100px;
  width: 100%;
}

@media only screen and (max-width: 320px) and (max-height: 480px) {
  .success-wrap .success-dialog {
    padding: 1.33333333rem 2.33333333rem 5.33333333rem 2.33333333rem;
  }

  .success-wrap .success-dialog .jump-box {
    margin-top: 2.33333333rem;
  }
}

.success-wrap .btn-box {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  bottom: 0;
  color: #ffffff;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.066rem;
  font-weight: bold;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  left: 0;
  position: absolute;
  width: 100%;
  z-index: 350;
  box-shadow: 0 -0.25rem 1rem rgba(16, 24, 40, 0.08);
}

.success-wrap .btn-box .rebet {
  background-color: #252a36;
  border: none;
  border-radius: 0;
  line-height: 4rem;
  padding: 0 2.08333333rem;
  width: 33%;
}

.success-wrap .btn-box .btn-ok {
  background-color: var(--brand-primary-button, var(--brand-primary));
  border: none;
  border-radius: 0;
  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  line-height: 4rem;
  padding: 0 2.08333333rem;
  color: black;
}

.success-toast {
  background: rgba(31, 36, 48, 0.92);
  border-radius: 999px;
  bottom: 5.2rem;
  color: #ffffff;
  font-size: 0.88rem;
  font-weight: 800;
  left: 50%;
  padding: 0.62rem 1rem;
  position: absolute;
  transform: translateX(-50%);
  z-index: 360;
}
</style>
