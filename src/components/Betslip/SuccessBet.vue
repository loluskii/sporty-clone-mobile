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

        <li v-if="canUseCustomCodes" class="custom-code-row">
          <span>
            <span>Create Custom Code</span>
          </span>
          <button
            class="custom-code-trigger"
            type="button"
            :disabled="customCodeLoading"
            @click="openCustomCodeFlow"
          >
            {{ customCodeLoading ? 'Checking...' : 'Create' }}
          </button>
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

    <Transition name="custom-code-sheet">
      <div v-if="customCodeModal" class="custom-code-overlay" @click="closeCustomCodeModal">
        <div class="custom-code-sheet" :class="`custom-code-sheet--${customCodeModal}`" @click.stop>
          <button class="custom-code-close" type="button" @click="closeCustomCodeModal">&times;</button>

          <template v-if="customCodeModal === 'select'">
            <div class="custom-code-heading">
              <span class="custom-code-eyebrow">Code Studio</span>
              <h3 class="custom-code-title">Attach a custom code</h3>
              <p class="custom-code-subtitle">
                Reuse one of your handles or create a fresh one for this ticket.
              </p>
            </div>
            <div class="custom-code-list">
              <button
                v-for="code in customCodes"
                :key="code"
                class="custom-code-existing"
                type="button"
                :disabled="isAssigningCustomCode"
                @click="assignExistingCustomCode(code)"
              >
                <span class="custom-code-existing-name">{{ code }}</span>
                <strong>{{ isAssigningCustomCode && assignedCustomCode === code ? 'Linking...' : 'Use' }}</strong>
              </button>
            </div>
            <button class="custom-code-secondary-action" type="button" @click="showCreateCustomCode">
              Make a new code
            </button>
          </template>

          <template v-else-if="customCodeModal === 'create'">
            <div class="custom-code-heading">
              <span class="custom-code-eyebrow">Code Studio</span>
              <h3 class="custom-code-title">Name this ticket</h3>
              <p class="custom-code-subtitle">
                Choose a short handle people can use instead of the generated booking code.
              </p>
            </div>
            <form class="custom-code-form" @submit.prevent="submitCustomCode">
              <div class="custom-code-composer">
                <input
                  v-model="customSuffix"
                  class="custom-code-input"
                  type="text"
                  inputmode="text"
                  autocomplete="off"
                  maxlength="25"
                  placeholder="yourhandle"
                  :disabled="isCreatingCustomCode"
                  @input="normalizeCustomSuffix"
                />
              </div>
              <p v-if="customCodeError" class="custom-code-error">{{ customCodeError }}</p>
              <button class="custom-code-confirm" type="submit" :disabled="!canSubmitCustomCode">
                {{ isCreatingCustomCode ? 'Creating...' : 'Create and attach' }}
              </button>
            </form>
          </template>

          <template v-else-if="customCodeModal === 'assigned'">
            <div class="custom-code-heading">
              <span class="custom-code-eyebrow">Ready to share</span>
              <h3 class="custom-code-title">Custom code is live</h3>
            </div>
            <div class="custom-code-live-card">
              <div class="custom-code-live-top">
                <span>Linked ticket</span>
                <strong>{{ shareCode }}</strong>
              </div>
              <div class="custom-code-live-main">
                <span>Use</span>
                <strong>{{ assignedCustomCode }}</strong>
              </div>
              <p>This custom code now opens the same selections as your booking code.</p>
            </div>
            <div class="custom-code-success-actions">
              <button class="custom-code-copy" type="button" @click="copyToClipboard(assignedCustomCode)">
                Copy
                <svg viewBox="5 2 15 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M15.79 2.75H5.684C4.758 2.75 4 3.506 4 4.431v11.774h1.684V4.43H15.79V2.75zm2.526 3.364H9.053c-.927 0-1.684.756-1.684 1.681V19.57c0 .925.757 1.681 1.684 1.681h9.263c.927 0 1.684-.756 1.684-1.681V7.795c0-.925-.758-1.681-1.684-1.681zm0 13.453H9.053V7.797h9.263V19.57v-.003z"
                    fill="currentColor"
                  ></path>
                </svg>
              </button>
              <button class="custom-code-share" type="button" @click="shareCustomCode">
                Share
                <svg viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fill="currentColor"
                    d="M13.5 12.06c-.57 0-1.08.225-1.47.577L6.683 9.525c.037-.173.067-.345.067-.525 0-.18-.03-.352-.067-.525l5.287-3.082a2.247 2.247 0 003.78-1.643c0-1.245-1.005-2.25-2.25-2.25s-2.25 1.005-2.25 2.25c0 .18.03.353.068.525L6.03 7.357A2.247 2.247 0 002.25 9a2.247 2.247 0 003.78 1.643l5.34 3.12c-.037.157-.06.322-.06.487 0 1.207.982 2.19 2.19 2.19 1.207 0 2.19-.983 2.19-2.19 0-1.207-.982-2.19-2.19-2.19z"
                  />
                </svg>
              </button>
            </div>
          </template>
        </div>
      </div>
    </Transition>

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
import { assignCustomCode, createCustomCode, fetchCustomCodes } from '@/helpers/queries'
import { useAuthStore } from '@/stores'
const router = useRouter()
const authStore = useAuthStore()
const props = defineProps({
  response: Object
})

const emit = defineEmits(['hide-success', 'rebet', 'activate-share'])
const copied = ref(false)
const customCodeLoading = ref(false)
const customCodeModal = ref('')
const customCodes = ref([])
const customSuffix = ref('')
const customCodeError = ref('')
const isCreatingCustomCode = ref(false)
const isAssigningCustomCode = ref(false)
const assignedCustomCode = ref('')

const firstBet = computed(() => props.response?.data?.bets?.[0] || {})
const stake = computed(() => firstBet.value?.stake || 0)
const possibleWin = computed(() => firstBet.value?.possibleWin || 0)
const shareCode = computed(() => firstBet.value?.share_code || '')
const canUseCustomCodes = computed(() => Boolean(authStore.isAuthenticated))
const canSubmitCustomCode = computed(() => {
  return /^[a-z0-9]{1,25}$/.test(customSuffix.value) && !isCreatingCustomCode.value
})

function viewOpenBets() {
  emit('hide-success')
  return router.push({ name: 'bets-view' })
}

function activateShare() {
  emit('activate-share', { bets: [firstBet.value] })
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

const normalizeCustomCodes = (payload = {}) => {
  const data = payload?.data ?? payload ?? []
  const list = Array.isArray(data)
    ? data
    : data.codes || data.customCodes || data.custom_codes || data.items || []

  return list
    .map((item) => {
      if (typeof item === 'string') return item
      return item?.code || item?.custom_code || item?.customCode || item?.name || ''
    })
    .filter(Boolean)
}

const extractCustomCode = (payload = {}) => {
  const data = payload?.data ?? payload ?? {}
  return (
    data?.code ||
    data?.custom_code ||
    data?.customCode ||
    data?.name ||
    payload?.code ||
    payload?.custom_code ||
    payload?.customCode ||
    customSuffix.value
  )
}

function normalizeCustomSuffix() {
  customSuffix.value = customSuffix.value.toLowerCase().replace(/[^a-z0-9]/g, '')
  customCodeError.value = ''
}

async function openCustomCodeFlow() {
  if (!canUseCustomCodes.value || !shareCode.value || customCodeLoading.value) return

  customCodeLoading.value = true
  customCodeError.value = ''
  try {
    const res = await fetchCustomCodes()
    customCodes.value = normalizeCustomCodes(res)
    customCodeModal.value = customCodes.value.length ? 'select' : 'create'
  } catch (error) {
    customCodeModal.value = 'create'
  } finally {
    customCodeLoading.value = false
  }
}

function showCreateCustomCode() {
  customCodeError.value = ''
  customSuffix.value = ''
  customCodeModal.value = 'create'
}

function closeCustomCodeModal() {
  if (isCreatingCustomCode.value || isAssigningCustomCode.value) return
  customCodeModal.value = ''
  customCodeError.value = ''
}

async function submitCustomCode() {
  normalizeCustomSuffix()
  if (!canSubmitCustomCode.value) {
    customCodeError.value = 'Use 1-25 lowercase letters or numbers.'
    return
  }

  isCreatingCustomCode.value = true
  customCodeError.value = ''
  try {
    const created = await createCustomCode({ suffix: customSuffix.value })
    const code = extractCustomCode(created)
    await assignCreatedCustomCode(code)
  } catch (error) {
    customCodeError.value = error?.message || 'Could not create custom code. Please try again.'
  } finally {
    isCreatingCustomCode.value = false
  }
}

async function assignCreatedCustomCode(code) {
  if (!code || !shareCode.value) throw new Error('Missing custom code or booking code.')

  await assignCustomCode(code, { system_code: shareCode.value })
  assignedCustomCode.value = code
  customCodeModal.value = 'assigned'
}

async function assignExistingCustomCode(code) {
  if (!code || !shareCode.value || isAssigningCustomCode.value) return

  isAssigningCustomCode.value = true
  assignedCustomCode.value = code
  try {
    await assignCustomCode(code, { system_code: shareCode.value })
    customCodeModal.value = 'assigned'
  } catch (error) {
    customCodeError.value = error?.message || 'Could not assign custom code. Please try again.'
  } finally {
    isAssigningCustomCode.value = false
  }
}

async function shareCustomCode() {
  const text = `${window.location.origin}?shareCode=${assignedCustomCode.value}`
  if (navigator?.share) {
    try {
      await navigator.share({ text })
      return
    } catch (error) {
      if (error?.name === 'AbortError') return
    }
  }
  await copyToClipboard(text)
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

.custom-code-row {
  align-items: center;
  border-top: 1px solid rgba(53, 58, 69, 0.02);
}

.custom-code-row > span {
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.custom-code-row small {
  color: #a2a7b3;
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1rem;
}

.custom-code-trigger {
  background: #ffffff;
  border: 1px solid rgba(9, 150, 64, 0.28);
  border-radius: 999px;
  box-shadow: 0 0.18rem 0.4rem rgba(16, 24, 40, 0.04);
  color: var(--brand-highlight-text, #099640);
  cursor: pointer;
  flex: 0 0 auto;
  font-size: 0.82rem;
  font-weight: 900;
  min-height: 2rem;
  min-width: auto;
  padding: 0 0.78rem;
}

.custom-code-trigger:disabled {
  cursor: wait;
  opacity: 0.65;
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

.custom-code-overlay {
  background:
    linear-gradient(180deg, rgba(9, 11, 16, 0.48), rgba(9, 11, 16, 0.72));
  bottom: 0;
  left: 0;
  position: absolute;
  right: 0;
  top: 0;
  z-index: 500;
}

.custom-code-sheet {
  background:
    linear-gradient(180deg, #ffffff 0%, #f7f8fb 100%);
  border-radius: 1.35rem 1.35rem 0 0;
  bottom: 0;
  box-shadow: 0 -0.65rem 2rem rgba(16, 24, 40, 0.22);
  box-sizing: border-box;
  left: 0;
  min-height: 52%;
  max-height: 86%;
  overflow-y: auto;
  padding: 1.25rem 1.05rem 1.25rem;
  position: absolute;
  right: 0;
}

.custom-code-sheet::before {
  background: rgba(37, 42, 54, 0.16);
  border-radius: 999px;
  content: '';
  height: 0.28rem;
  left: 50%;
  position: absolute;
  top: 0.55rem;
  transform: translateX(-50%);
  width: 3rem;
}

.custom-code-close {
  align-items: center;
  background: rgba(37, 42, 54, 0.06);
  border: 1px solid rgba(37, 42, 54, 0.04);
  border-radius: 50%;
  color: #8f96a3;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.35rem;
  height: 2rem;
  justify-content: center;
  line-height: 1;
  position: absolute;
  right: 1.05rem;
  top: 1.05rem;
  width: 2rem;
}

.custom-code-sheet button,
.custom-code-sheet input {
  appearance: none;
  font-family: var(--brand-text-secondary-font-family), sans-serif !important;
  line-height: 1 !important;
}

.custom-code-heading {
  margin: 0.65rem 2.5rem 1.2rem 0;
}

.custom-code-eyebrow {
  color: var(--brand-highlight-text, #099640);
  display: inline-flex;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin-bottom: 0.4rem;
  text-transform: uppercase;
}

.custom-code-title {
  color: #252a36;
  font-size: 1.42rem;
  font-weight: 900;
  line-height: 1.65rem;
  margin: 0;
}

.custom-code-subtitle {
  color: #8f96a3;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.32rem;
  margin: 0.55rem 0 0;
}

.custom-code-form {
  display: flex !important;
  flex-direction: column;
  gap: 0.82rem;
}

.custom-code-composer {
  align-items: center;
  background: #ffffff;
  border: 1px solid rgba(9, 150, 64, 0.35);
  border-radius: 1rem;
  box-shadow:
    0 0.45rem 1.15rem rgba(16, 24, 40, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  display: flex !important;
  height: 3.65rem !important;
  min-height: 0 !important;
  padding: 0 0.85rem;
}

.custom-code-composer-prefix {
  color: var(--brand-highlight-text, #099640);
  flex: 0 0 auto;
  font-size: 1rem;
  font-weight: 900;
  padding-right: 0.25rem;
}

.custom-code-input {
  background: transparent;
  border: 0;
  color: #252a36;
  flex: 1 1 auto;
  font-size: 1.12rem;
  font-weight: 900;
  height: 100% !important;
  line-height: 1 !important;
  min-width: 0;
  outline: 0;
  padding: 0;
}

.custom-code-input::placeholder {
  color: #c0c5ce;
}

.custom-code-confirm {
  align-items: center;
  background: var(--brand-highlight-text, #099640);
  border: 0;
  border-radius: 0.9rem;
  box-shadow: 0 0.5rem 1rem rgba(9, 150, 64, 0.2);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex !important;
  font-size: 0.98rem;
  font-weight: 900;
  height: 3.05rem !important;
  justify-content: center;
  min-height: 0 !important;
  padding: 0 1rem !important;
  width: 100%;
}

.custom-code-confirm:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.custom-code-error {
  color: #e11d48;
  font-size: 0.92rem;
  font-weight: 800;
  margin: -0.4rem 0 0;
}

.custom-code-list {
  display: grid;
  gap: 0.6rem;
}

.custom-code-existing {
  align-items: center;
  background: #ffffff;
  border: 1px solid rgba(37, 42, 54, 0.08);
  border-radius: 0.9rem;
  box-shadow: 0 0.35rem 0.9rem rgba(16, 24, 40, 0.05);
  color: #252a36;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  min-height: 3.25rem;
  padding: 0 0.85rem;
}

.custom-code-existing-name {
  color: #252a36 !important;
  font-size: 0.98rem;
  font-weight: 900 !important;
}

.custom-code-existing strong {
  background: rgba(9, 150, 64, 0.1);
  border-radius: 999px;
  color: var(--brand-highlight-text, #099640);
  font-size: 0.82rem;
  padding: 0.36rem 0.62rem;
}

.custom-code-existing:disabled {
  cursor: wait;
  opacity: 0.7;
}

.custom-code-secondary-action {
  background: transparent;
  border: 1px dashed rgba(9, 150, 64, 0.55);
  border-radius: 0.9rem;
  color: var(--brand-highlight-text, #099640);
  cursor: pointer;
  font-size: 0.92rem;
  font-weight: 900;
  margin-top: 1rem;
  min-height: 3rem;
  width: 100%;
}

.custom-code-live-card {
  background:
    linear-gradient(135deg, rgba(9, 150, 64, 0.12), rgba(9, 150, 64, 0.02)),
    #ffffff;
  border: 1px solid rgba(9, 150, 64, 0.16);
  border-radius: 1.05rem;
  box-shadow: 0 0.75rem 1.5rem rgba(16, 24, 40, 0.08);
  display: block !important;
  overflow: hidden;
  padding: 0.9rem;
}

.custom-code-live-top {
  align-items: center;
  display: flex !important;
  justify-content: space-between;
  margin-bottom: 0.85rem;
}

.custom-code-live-top span {
  color: #8f96a3;
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.custom-code-live-top strong {
  background: rgba(37, 42, 54, 0.08);
  border-radius: 999px;
  color: #252a36;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  padding: 0.38rem 0.65rem;
}

.custom-code-live-main {
  background: #252a36;
  border-radius: 0.95rem;
  color: #ffffff;
  display: block !important;
  padding: 0.95rem 0.85rem;
}

.custom-code-live-main span {
  color: rgba(255, 255, 255, 0.72);
  display: block;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
}

.custom-code-live-main strong {
  display: block;
  font-size: 1.82rem;
  font-weight: 900;
  letter-spacing: 0.03em;
  line-height: 2rem;
  overflow-wrap: anywhere;
}

.custom-code-live-card p {
  color: #5d6470;
  font-size: 0.95rem;
  font-weight: 750;
  line-height: 1.4rem;
  margin: 1rem 0 0;
}

.custom-code-success-actions {
  display: grid !important;
  gap: 0.8rem;
  grid-template-columns: 1fr 1fr;
  margin-top: 0.85rem;
}

.custom-code-copy,
.custom-code-share {
  align-items: center;
  border-radius: 0.85rem;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.98rem;
  font-weight: 900;
  gap: 0.45rem;
  justify-content: center;
  min-height: 3.25rem;
}

.custom-code-copy {
  background: #ffffff;
  border: 1px solid var(--brand-highlight-text, #099640);
  color: var(--brand-highlight-text, #099640);
}

.custom-code-share {
  background: var(--brand-highlight-text, #099640);
  border: 1px solid var(--brand-highlight-text, #099640);
  color: #ffffff;
}

.custom-code-sheet--assigned {
  min-height: 0;
  padding-bottom: 1.6rem;
}

.custom-code-sheet--assigned .custom-code-heading {
  margin-bottom: 0.9rem;
}

.custom-code-copy svg,
.custom-code-share svg {
  height: 1.25rem;
  width: 1.25rem;
}

.custom-code-sheet-enter-active,
.custom-code-sheet-leave-active {
  transition: opacity 180ms ease;
}

.custom-code-sheet-enter-active .custom-code-sheet,
.custom-code-sheet-leave-active .custom-code-sheet {
  transition: transform 180ms ease;
}

.custom-code-sheet-enter-from,
.custom-code-sheet-leave-to {
  opacity: 0;
}

.custom-code-sheet-enter-from .custom-code-sheet,
.custom-code-sheet-leave-to .custom-code-sheet {
  transform: translateY(1rem);
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
