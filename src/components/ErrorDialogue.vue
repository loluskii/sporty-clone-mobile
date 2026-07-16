<template>
  <div class="es-dialog-wrap" id="esDialog0" style="visibility: visible">
    <div
      class="layout mask"
      @click="$emit('hide-dialogue')"
      style="z-index: 1000; position: fixed"
    ></div>
    <div v-if="dialogIsError" class="es-dialog m-dialog app-error-dialog">
      <div class="es-dialog-body m-dialog-body">
        <div class="es-dialog-main m-dialog-main app-error-main">
          <h3>{{ errorDialogTitle }}</h3>
          <p>{{ errorMessage }}</p>
        </div>
      </div>
      <div class="m-dialog-footer es-dialog-footer">
        <button
          type="button"
          @click.prevent="nextAction"
          class="es-dialog-btn app-error-ok"
        >
          OK
        </button>
      </div>
    </div>
    <div v-if="dialogIsBetslip" class="es-dialog m-dialog betslip-replace-dialog">
      <div class="es-dialog-body m-dialog-body">
        <div class="es-dialog-main m-dialog-main betslip-replace-main">
          <h3>{{ betslipDialogTitle }}</h3>
          <p>{{ betslipDialogMessage }}</p>
        </div>
      </div>
      <div class="m-dialog-footer es-dialog-footer">
        <button
          type="button"
          class="es-dialog-btn betslip-dialog-cancel"
          :disabled="isReplacingBetslip"
          @click.prevent="$emit('hide-dialogue')"
        >
          {{ betslipCancelText }}
        </button>
        <button
          type="button"
          class="es-dialog-btn es-dialog-focus-btn betslip-dialog-confirm"
          :disabled="isReplacingBetslip"
          @click.prevent="replaceBetslip"
        >
          {{ isReplacingBetslip ? betslipPendingText : betslipConfirmText }}
        </button>
      </div>
    </div>
    <div v-if="dialogIsNotification" class="es-dialog m-dialog app-notification-dialog">
      <div class="es-dialog-body m-dialog-body">
        <div class="es-dialog-main m-dialog-main app-notification-main">
          <div class="app-notification-envelope" aria-hidden="true">
            <img :src="notificationArt" alt="" />
          </div>
          <div class="app-notification-copy">
            <h3>{{ notificationSummaryTitle }}</h3>
            <div class="app-notification-chip">
              <span>Click here to see your messages</span>
            </div>
          </div>
        </div>
      </div>
      <div class="m-dialog-footer es-dialog-footer">
        <button
          type="button"
          @click.prevent="openNotifications"
          class="es-dialog-btn app-notification-action"
        >
          Go 
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#d0021b" fill="none" stroke="#d0021b" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M10.5 8C10.5 8 13.5 10.946 13.5 12C13.5 13.0541 10.5 16 10.5 16" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      </div>
    </div>
    <WithdrawalModal
      v-if="dialogIsWithdrawal"
      @close-modal="$emit('hide-dialogue')"
      :user-data="dialogueMessage"
    ></WithdrawalModal>
    <div
      v-if="dialogIsToast"
      class="es-dialog-toast es-dialog m-dialog"
      style="z-index: 1003; position: fixed; width: 22.91rem; left: 50%; top: 50%; padding: 0"
    >
      <div class="es-dialog-body m-dialog-body">
        <div class="es-dialog-main m-dialog-main" style="height: auto">
          <div>{{ dialogueMessage }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineProps, onMounted, ref } from 'vue'
import WithdrawalModal from '@/components/WithdrawalModal.vue'
import { useRouter } from 'vue-router'
import { useCouponStore } from '../stores'
import { loadBetslipByCode } from '@/helpers'
import emitter from '@/plugins/emitter'
import notificationArt from '@/assets/images/text.png'

const emits = defineEmits(['hide-dialogue'])
const props = defineProps({
  errorMessage: String,
  dialogueMessage: [Object, String],
  dialogueType: String,
  nextRoute: String
})

const dialogIsError = ref(false)
const dialogIsWithdrawal = ref(false)
const dialogIsToast = ref(false)
const dialogIsBetslip = ref(false)
const dialogIsNotification = ref(false)
const isReplacingBetslip = ref(false)
const router = useRouter()
const couponStore = useCouponStore()

const dialogueData = computed(() => {
  return typeof props.dialogueMessage === 'object' && props.dialogueMessage !== null
    ? props.dialogueMessage
    : {}
})

const betslipDialogTitle = computed(() => dialogueData.value.title || 'Replace Betslip?')
const betslipDialogMessage = computed(
  () =>
    dialogueData.value.message ||
    'You already have selections in your betslip. Replacing them will remove the current selections.'
)
const betslipCancelText = computed(() => dialogueData.value.cancelText || 'Keep Current')
const betslipConfirmText = computed(() => dialogueData.value.confirmText || 'Replace')
const betslipPendingText = computed(() => dialogueData.value.pendingText || 'Replacing...')
const errorDialogTitle = computed(() => dialogueData.value.title || 'Notice')
const notificationItems = computed(() => {
  const data =
    dialogueData.value.notifications ||
    dialogueData.value.data?.notifications ||
    dialogueData.value.data ||
    []

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  return []
})

const notificationCount = computed(() => {
  const explicitCount = Number(dialogueData.value.notificationCount || dialogueData.value.count || 0)
  if (Number.isFinite(explicitCount) && explicitCount > 0) return explicitCount
  return notificationItems.value.length
})

const notificationSummaryTitle = computed(() => {
  const count = notificationCount.value
  if (!count) return 'You have a message'
  return count === 1 ? 'You have 1 new message' : `You have ${count} new messages`
})

const dialogueType = () => {
  switch (props.dialogueType) {
    case 'error':
      dialogIsError.value = true
      break
    case 'withdrawal':
      dialogIsWithdrawal.value = true
      break
    case 'toaster':
      dialogIsToast.value = true
      break
    case 'betslip':
      dialogIsBetslip.value = true
      break
    case 'notification':
      dialogIsNotification.value = notificationCount.value > 0
      break

    default:
      break
  }
}

function nextAction() {
  emits('hide-dialogue')
  if (props.nextRoute !== null || props.nextRoute !== undefined) {
    return router.push(props.nextRoute)
  }
}

async function replaceBetslip() {
  if (isReplacingBetslip.value) return
  isReplacingBetslip.value = true
  try {
    if (dialogueData.value.action === 'clearBetslip') {
      couponStore.clearBetslip()
      emits('hide-dialogue')
      return
    }

    const loadedData = await getReplacementBetslipData()
    if (dialogueData.value.switchModeTo) {
      couponStore.setBetslipMode(dialogueData.value.switchModeTo)
      couponStore.isSimulating = false
    }
    const loadedSelections = await couponStore.rebuildBetslipFromLoadedSelections(loadedData)
    if (!loadedSelections) {
      emitter.emit('showDialogueToaster', 'All selections have expired')
      return
    }
    emits('hide-dialogue')
    emitter.emit('openBetslip')
    if (dialogueData.value.redirectToHome) {
      router.push({ name: 'home' })
    }
  } catch (error) {
    emitter.emit('showDialogueToaster', 'Invalid booking code. ')
  } finally {
    isReplacingBetslip.value = false
  }
}

function openNotifications() {
  emits('hide-dialogue')
  router.push({ name: 'notifications' })
}

async function getReplacementBetslipData() {
  if (Array.isArray(dialogueData.value.selections)) {
    return dialogueData.value.selections
  }

  const shareCode =
    dialogueData.value.shareCode ||
    dialogueData.value.betslipId ||
    dialogueData.value.data?.shareCode ||
    dialogueData.value.data?.betslipId

  if (!shareCode) return []

  const res = await loadBetslipByCode(shareCode)
  if (res?.status_code === 200 || res?.success) {
    return res.data
  }
  throw new Error('Invalid booking code')
}

onMounted(() => {
  dialogueType()
})
</script>

<style>
.es-dialog {
  background-color: #fafafa;
  border-radius: 0.3rem;
  box-shadow:
    0 0 24px 0 rgba(0, 0, 0, 0.25),
    0 0 24px 0 rgba(112, 76, 76, 0.25);
  color: #353a45;
  font-family: 'Roboto', 'Microsoft Yahei', 'simsun';
  font-size: 1rem;
  line-height: 2rem;
  overflow: hidden;
  padding: 1.66666667rem 2rem;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  z-index: 1001;
}
.es-dialog-close {
  display: none;
  padding: 0.3rem 1rem;
  text-decoration: none;
}
.es-dialog-close em {
  color: #353a45;
  color: var(--text-type1-primary);
  font-size: 0;
}
.es-dialog-close em::before {
  content: '\e69a';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.es-dialog-close em:before {
  font-size: 1.5rem;
}
.es-dialog-close em:active {
  -webkit-transform: scale(0.9, 0.9);
  -ms-transform: scale(0.9, 0.9);
  transform: scale(0.9, 0.9);
}
.es-dialog-wrap {
  inset: 0;
  position: fixed;
  visibility: hidden;
  z-index: 30000;
}
.es-dialog-wrap .layout {
  background: #353a45;
  height: 100%;
  left: 0;
  opacity: 0.4;
  overflow: hidden;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1000;
}
.es-dialog-wrap .overlay-animate-enter {
  opacity: 0;
}
.es-dialog-wrap .overlay-animate-enter-active {
  opacity: 0.4;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
.es-dialog-wrap .overlay-animate-leave {
  opacity: 0.4;
}
.es-dialog-wrap .overlay-animate-leave-active {
  opacity: 0;
  -webkit-transition: all 0.3s ease;
  transition: all 0.3s ease;
}
.es-dialog-wrap .body-overflow {
  overflow: hidden;
}
.es-dialog .es-dialog-head {
  padding: 0 2rem 0.66666667rem;
}
.es-dialog .es-dialog-head h1 {
  font-size: 1.66666667rem;
  font-weight: 700;
  min-height: 2.33333333rem;
  line-height: 2.33333333rem;
  margin: 0;
  text-align: center;
  text-align: left;
}
.es-dialog .es-dialog-head .es-dialog-close {
  background: none;
  font-family: 'Microsoft YaHei', arial, simsun, SimHei;
  position: absolute;
  right: 5px;
  top: 1px;
}
.es-dialog .es-dialog-head .es-dialog-close em {
  cursor: default;
  font-style: normal;
}
.es-dialog .es-dialog-body {
  background-color: transparent;
  margin: 0;
  /* min-height: 4rem; */
  padding: 0;
}
.es-dialog .es-dialog-body .es-dialog-main {
  /* background-color: #fafafa;  */
  /* background-color: var(--background-general-primary); */
  overflow: auto;
  /* padding: 0 2rem; */
  word-break: break-word;
  word-wrap: break-word;
}
.es-dialog .es-dialog-footer {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 0.66666667rem;
  text-align: right;
  width: 100%;
}
.es-dialog .es-dialog-footer .es-dialog-btn {
  color: var(--brand-highlight-text);
  color: var(--brand-secondary);
  cursor: pointer;
  display: inline-block;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1.066rem;
  font-weight: 700;
  height: 3rem;
  line-height: 3rem;
  outline: none;
  padding: 0;
  text-align: left;
  text-align: center;
  text-decoration: none;
  vertical-align: middle;
  width: 30%;
}

.app-error-dialog {
  border-radius: 0.75rem;
  padding: 1.25rem;
  width: min(21rem, calc(100vw - 2rem));
}

.app-error-main {
  text-align: left;
}

.app-error-main h3 {
  color: #1b1e25;
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.25;
  margin: 0 0 0.5rem;
}

.app-error-main p {
  color: #62676f;
  font-size: 0.95rem;
  line-height: 1.4;
  margin: 0;
}

.app-error-dialog .es-dialog-footer {
  display: flex;
  justify-content: flex-end;
  padding: 1.25rem 0 0;
}

.app-error-dialog .es-dialog-footer .es-dialog-btn {
  border: 0;
  border-radius: 0.41666667rem;
  font-size: 0.95rem;
  height: 2.75rem;
  line-height: 1;
  padding: 0 1.35rem;
  text-align: center;
  width: auto;
}

.app-error-ok {
  background: #edf0f4;
  color: #353a45 !important;
}

.betslip-replace-dialog {
  border-radius: 0.75rem;
  padding: 1.25rem;
  width: min(22rem, calc(100vw - 2rem));
}

.betslip-replace-main {
  text-align: left;
}

.betslip-replace-main h3 {
  color: #1b1e25;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.25;
  margin: 0 0 0.5rem;
}

.betslip-replace-main p {
  color: #62676f;
  font-size: 0.95rem;
  line-height: 1.4;
  margin: 0;
}

.betslip-replace-dialog .es-dialog-footer {
  display: flex;
  gap: 0.66666667rem;
  padding: 1.25rem 0 0;
}

.betslip-replace-dialog .es-dialog-footer .es-dialog-btn {
  border: 0;
  border-radius: 0.41666667rem;
  flex: 1;
  font-size: 0.95rem;
  height: 2.75rem;
  line-height: 1;
  padding: 0 0.75rem;
  text-align: center;
  width: auto;
}

.betslip-dialog-cancel {
  background: #edf0f4;
  color: #353a45 !important;
}

.betslip-dialog-confirm {
  background: var(--brand-primary-button);
  color: #ffffff !important;
}

.betslip-replace-dialog .es-dialog-footer .es-dialog-btn:disabled {
  opacity: 0.65;
}

.app-notification-dialog {
  border-radius: 1.25rem;
  overflow: hidden;
  padding: 1.25rem;
  width: min(21.5rem, calc(100vw - 2rem));
}

.app-notification-main {
  min-height: auto !important;
  padding: 0.25rem 0 0.1rem !important;
  text-align: center !important;
}

.app-notification-envelope {
  display: inline-flex;
  position: relative;
  width: 6.4rem;
  justify-content: center;
}

.app-notification-envelope img {
  display: block;
  width: 100%;
  height: auto;
}

.app-notification-copy {
  min-width: 0;
}

.app-notification-title,
.app-notification-main h3 {
  color: #202532;
  font-weight: 700;
  line-height: 1.15;
  margin: 0;
}

.app-notification-title {
  color: #2a2f3a;
  font-size: 1.02rem;
  letter-spacing: 0.08em;
  margin-bottom: 0.35rem;
  text-transform: uppercase;
}

.app-notification-main h3 {
  font-size: 1.45rem;
}

.app-notification-chip {
  align-items: center;
  color: #2f3542;
  display: inline-flex;
  gap: 0.4rem;
  margin: 0 auto;
  padding: 0.45rem 0.85rem;
}

.app-notification-chip strong {
  color: #0f9f45;
  font-size: 1rem;
}

.app-notification-dialog .es-dialog-footer {
  display: flex;
  justify-content: center;
  padding: 1.25rem 0 0;
}

.app-notification-dialog .es-dialog-footer .es-dialog-btn {
  border: 0;
  border-radius: 0.3rem;
  font-size: 1rem;
  font-weight: 500;
  height: 2.9rem;
  line-height: 1;
  margin: 0 auto;
  padding: 0 1.9rem;
  text-align: center;
  width: 70%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  column-gap: 5px;
}

.app-notification-action {
  color: var(--brand-highlight-text) !important;
  background-color: transparent !important;
}

.es-dialog.es-ani-show {
  -webkit-transition:
    width,
    height,
    2s liner 3s,
    2s,
    -webkit-transform 3s;
  transition:
    width,
    height,
    2s liner 3s,
    2s,
    -webkit-transform 3s;
  transition:
    width,
    height,
    transform 3s,
    2s liner 3s,
    2s;
  transition:
    width,
    height,
    transform 3s,
    2s liner 3s,
    2s,
    -webkit-transform 3s;
}
.es-dialog.es-ani-hide {
  -webkit-transition: all 0.3s linear;
  transition: all 0.3s linear;
}
.es-dialog.es-dialog-ani-1 {
  opacity: 0.1;
}
.es-dialog.es-dialog-ani-2 {
  opacity: 0.1;
  -webkit-transform: scale(0.1);
  -ms-transform: scale(0.1);
  transform: scale(0.1);
}
.es-dialog.es-dialog-ani-3 {
  opacity: 0.1;
  -webkit-transform: scale(1.8);
  -ms-transform: scale(1.8);
  transform: scale(1.8);
}
.es-dialog.es-dialog-ani-4 {
  opacity: 0;
  -webkit-transform: perspective(300px) rotateY(90deg);
  transform: perspective(300px) rotateY(90deg);
}
.es-dialog.es-dialog-ani-5 {
  opacity: 0.1;
  -webkit-transform: scale(0.3);
  -ms-transform: scale(0.3);
  transform: scale(0.3);
}
.es-dialog.es-dialog-ani-6 {
  opacity: 0.1;
  -webkit-transform: matrix(1, 0, 0, 1, 0, 230);
  -ms-transform: matrix(1, 0, 0, 1, 0, 230);
  transform: matrix(1, 0, 0, 1, 0, 230);
}
.es-dialog.es-dialog-ani-7 {
  opacity: 0.1;
  -webkit-transform: matrix(1, 0, 0, 1, 0, -230);
  -ms-transform: matrix(1, 0, 0, 1, 0, -230);
  transform: matrix(1, 0, 0, 1, 0, -230);
}
.es-dialog-info .es-dialog-body .es-dialog-main,
.es-dialog-error .es-dialog-body .es-dialog-main,
.es-dialog-alert .es-dialog-body .es-dialog-main,
.es-dialog-confirm .es-dialog-body .es-dialog-main {
  vertical-align: middle;
}
.es-dialog-toast {
  background: #3e3e3e;
  border: 1px solid #3e3e3e;
  color: #fff;
  font-size: 1rem;
  padding-top: 0;
}
.es-dialog-toast.es-dialog {
  -webkit-box-shadow: none;
  box-shadow: none;
}
.es-dialog-toast .es-dialog-body {
  min-height: auto;
}
.es-dialog-toast a {
  color: #ffc000;
  text-decoration: underline;
}
.es-dialog-toast a :link {
  color: #ffc000;
}
.es-dialog-toast a :visited {
  color: #ffc000;
}
.es-dialog-toast a :hover {
  color: #ffc000;
}
.es-dialog-toast .es-dialog-body,
.es-dialog-toast .es-dialog-body .es-dialog-main {
  background: transparent;
  min-height: inherit;
  text-align: center;
}
.es-dialog-toast .es-dialog-body .es-dialog-main {
  padding: 0.83rem 1.05rem;
}
</style>
