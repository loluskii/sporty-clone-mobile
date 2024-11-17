<template>
  <div id="popupLogin" style="height: 100%">
    <div class="register-and-login">
      <div id="enterMobile" class="page-container page-fixed">
        <div class="change-region-wrap">
          <span @click="$router.push({ name: 'home' })" class="close"></span>
        </div>
        <div class="enter-mobile-container" v-if="activeStep === 1">
          <form>
            <div class="enter-mobile-label">
              <p>Join {{ brandName }} with your mobile number</p>
            </div>
            <div
              class="verifyInputs mb-4 m-input-wap-wrapper m-input-wap-group m-input-wap-group--prepend"
              :class="registerError ? 'm-input-wap-wrapper--error' : ''"
            >
              <div class="m-input-wap-prepend m-input-wap-prepend--default">
                <div>+234</div>
              </div>
              <i
                @click="clear"
                v-if="formData.phone_no != ''"
                class="m-input-wap-icon m-input-wap-icon--clickable m-input-wap-icon--show m-icon-delete"
              ></i>
              <input
                type="tel"
                v-model="formData.phone_no"
                placeholder="Mobile Number"
                maxlength="11"
                @blur="validateUsername($event)"
                class="m-input-wap fs-exclude data-hj-suppress"
              />
            </div>
            <div class="verifyInputs mb-4 m-input-wap-wrapper">
              <input
                type="password"
                v-model="formData.password"
                placeholder="Password"
                class="m-input-wap fs-exclude data-hj-suppress"
              />
            </div>
            <div class="verifyInputs m-input-wap-wrapper">
              <input
                type="text"
                v-model="formData.promoCode"
                placeholder="Promo code (optional)"
                class="m-input-wap fs-exclude data-hj-suppress"
              />
            </div>
            <div v-if="registerError" class="error-message">
              <p>
                {{ registerErrorMessage }}
              </p>
            </div>
            <button
              :class="!formData.password || isLoading ? 'is-disabled' : ''"
              class="af-button enter-mobile-btn af-button--primary"
              type="button"
              @disabled="isLoading"
              @click.prevent="registerUser"
            >
              <span v-if="!isLoading"> Continue </span>
              <span v-else> Loading... </span>
            </button>
          </form>
          <div class="action-label" @click="toLogin">Already have an account? Log In</div>
        </div>
        <div v-else class="enter-mobile-container">
          <form>
            <div class="enter-mobile-label">
              <p>Verify Your Number</p>
              <span style="font-size: 15px; font-weight: 400"
                >We’ve sent you a 6-digit code to +234 {{ formData.phone_no }}</span
              >
            </div>
            <div id="verify-otp-container" class="text-center">
              <div class="m-pin-code-wrapper mg-b-16">
                <form>
                  <v-otp-input
                    ref="otpInput"
                    v-model:value="bindModal"
                    input-classes="m-pin-code-input fs-exclude"
                    separator="  "
                    :num-inputs="6"
                    :should-auto-focus="true"
                    input-type="number"
                    :placeholder="['*', '*', '*', '*', '*', '*']"
                    @on-complete="storeOTP"
                  />
                </form>
              </div>
              <div style="position: relative">
                <span
                  class="grey pointer"
                  :class="{ disabled: isDisabled }"
                  @click="resendOtp"
                  :disabled="isDisabled"
                  :style="{
                    fontWeight: 'bold',
                    color: isDisabled ? '#aaa' : ''
                  }"
                >
                  {{ isDisabled ? `Send Again in ${remainingTime}s` : 'Send Again' }} </span
                >&nbsp;
              </div>
            </div>
            <div v-if="registerError" class="error-message" style="text-align: center">
              <p>
                {{ registerErrorMessage }}
              </p>
            </div>
            <button
              :class="isLoading ? 'is-disabled' : ''"
              class="af-button enter-mobile-btn af-button--primary"
              type="button"
              @disabled="isLoading"
              @click.prevent="verifyOTPRequest"
            >
              <span v-if="!isLoading"> Continue </span>
              <span v-else> Please wait... </span>
            </button>
          </form>
          <div class="action-label" @click="restartProcess">Go Back</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue' // Import ref from Vue 3
import { useRouter } from 'vue-router'
import {
  CLIENT_ID,
  formattedPhoneNumber,
  sendOTP,
  verifyUsername,
  register,
  verifyOTP
} from '../helpers'
import { useAuthStore, useUtilstStore } from '../stores'

// Use ref for reactive data properties
const authStore = useAuthStore()
const { brandName } = useUtilstStore()
const formData = ref({
  phone_no: null,
  password: null,
  promoCode: null
})
// const showPassword = ref(false)
const isLoading = ref(false)
const router = useRouter()
const registerError = ref(false)
const registerErrorMessage = ref('')
const activeStep = ref(1)
const OTP = ref('')
const isDisabled = ref(false)
const remainingTime = ref(60)
let timer

// Define methods using the Composition API
const clear = () => {
  formData.value.phone_no = ''
}

const startTimer = () => {
  isDisabled.value = true
  remainingTime.value = 60

  if (timer) clearInterval(timer) // Clear any existing timer

  timer = setInterval(() => {
    remainingTime.value -= 1
    if (remainingTime.value === 0) {
      clearInterval(timer)
      isDisabled.value = false
    }
  }, 1000)
}

const registerUser = async () => {
  isLoading.value = true
  let phoneNumber = formData.value.phone_no.replace(/^0/, '')
  const internationalNumber = `234${phoneNumber}`
  let payload = {
    clientID: CLIENT_ID,
    phoneNumber: internationalNumber
  }

  const res = await sendOTP(payload)
  isLoading.value = false

  if (res.data.status) {
    activeStep.value = 2
    startTimer()
  } else {
    registerError.value = true
    registerErrorMessage.value = res.data.message
  }
}

const resendOtp = async () => {
  if (!isDisabled.value && remainingTime.value === 0) {
    let phoneNumber = formData.value.phone_no.replace(/^0/, '')
    const internationalNumber = `234${phoneNumber}`
    let payload = {
      clientID: CLIENT_ID,
      phoneNumber: internationalNumber
    }

    const res = await sendOTP(payload)
    if (res.data.status) {
      startTimer()
    }
  }
}

const storeOTP = async (data) => {
  OTP.value = data
}

const verifyOTPRequest = async () => {
  isLoading.value = true
  let phoneNumber = formattedPhoneNumber(formData.value.phone_no)
  const internationalNumber = `234${phoneNumber}`
  let payload = {
    clientID: CLIENT_ID,
    phoneNumber: internationalNumber,
    code: OTP.value
  }

  const res = await verifyOTP(payload)
  if (res.data.status) {
    await doRegistration()
  } else {
    isLoading.value = false
    registerError.value = true
    registerErrorMessage.value = res.data.message
  }
}

const doRegistration = async () => {
  isLoading.value = true
  registerError.value = false
  registerErrorMessage.value = ''
  let phoneNumber = formattedPhoneNumber(formData.value.phone_no)
  const internationalNumber = `234${phoneNumber}`

  const payload = {
    username: phoneNumber,
    password: formData.value.password,
    phone: internationalNumber,
    clientId: CLIENT_ID,
    promoCode: formData.value.promoCode
  }

  try {
    const res = await register(payload)
    if (res.data.success) {
      await authStore.doLogin(payload)
      isLoading.value = false
    } else {
      isLoading.value = false
      registerError.value = true
      registerErrorMessage.value = 'Something went wrong, process your request.'
    }
  } catch (error) {
    isLoading.value = false
    registerError.value = true
    registerErrorMessage.value = error.message
  }
}

const restartProcess = () => {
  activeStep.value = 1
  formData.value.phone_no = ''
  formData.value.password = ''
  registerError.value = false
  registerErrorMessage.value = ''
}

const validateUsername = async (e) => {
  const username = formattedPhoneNumber(e.target.value)
  await verifyUsername({
    username,
    clientId: CLIENT_ID
  }).then((res) => {
    if (res.responseMessage === 'SUCCESSFUL') {
      registerError.value = true
      registerErrorMessage.value = 'Phone number already registered'
    } else {
      registerError.value = false
      registerErrorMessage.value = ''
    }
  })
}
const toLogin = () => {
  // Access router through the `router` property of the `this.$route` object
  return router.push({ name: 'sign-in' })
}
</script>

<style>
.af-button.is-disabled,
.af-button.is-disabled:focus,
.af-button.is-disable:hover {
  background-color: #dcdee5 !important;
  background-image: none;
  cursor: not-allowed;
  border-color: #dcdee5 !important;
  border-color: var(--disable-brand-secondary) !important;
  color: #9ca0ab !important;
  color: var(--text-disable-type1-primary) !important;
}
.register-and-login {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  display: block;
  height: 100%;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  width: 100%;
}

.register-and-login .head-container {
  left: 0;
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 10;
}
.register-and-login .warn-label {
  background-color: #e41827;
  background-color: var(--warning-primary);
  color: #ffffff;
  font-size: 0.83333333rem;
  height: 2.16666667rem;
  line-height: 2.16666667rem;
  text-align: center;
  width: 100%;
}
.register-and-login .page-container {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  height: 100%;
  -webkit-box-pack: start;
  -webkit-justify-content: flex-start;
  -ms-flex-pack: start;
  justify-content: flex-start;
  padding: 8.91666667rem 2.5rem 1.66666667rem;
  width: 100%;
}
.register-and-login .page-container.page-fixed {
  padding: 1.66666667rem 0 1.66666667rem;
}

.enter-mobile.es-dialog .es-dialog-footer .es-dialog-btn {
  border-top: 1px solid #d4d4d4;
  width: 100%;
}
#enterMobile .enter-mobile-top-banner {
  margin-top: -1.66666667rem;
  width: 100%;
}
#enterMobile .enter-mobile-top-banner img {
  width: 100%;
}
#enterMobile .change-region-wrap {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #353a45;
  color: var(--text-type1-primary);
  font-size: 1.33333333rem;
  line-height: 1.5rem;
  padding: 0rem 1.25rem 0 2.5rem;
  width: 100%;
}

#enterMobile .change-region-wrap .m-icon-right::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
#enterMobile .change-region-wrap .m-icon-right::before {
  color: #0d9737;
  color: var(--brand-secondary);
}
#enterMobile .change-region-wrap .close {
  float: right;
}
#enterMobile .change-region-wrap .close::before {
  content: '\e69a';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
#enterMobile .change-region-wrap .close:before {
  font-size: 1.25rem;
}
#enterMobile .enter-mobile-container {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  padding: 5.41666667rem 2.5rem 0;
  width: 100%;
}
#enterMobile .enter-mobile-container form {
  width: 100%;
}
#enterMobile .enter-mobile-container form .progress-container {
  height: 62px;
}
#enterMobile .enter-mobile-container .enter-mobile-label {
  color: #353a45;
  color: var(--text-type1-primary);
  font-size: 1.66666667rem;
  font-weight: bold;
  line-height: 2rem;
  margin-bottom: 2rem;
  margin-top: 0.83333333rem;
  text-align: center;
  width: 100%;
}
#enterMobile .enter-mobile-container .m-input-wap-wrapper--active {
  border: 1px solid #0d9737;
}
#enterMobile .enter-mobile-container .verifyInputs {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  font-size: 1.066rem;
  height: 4rem;
  padding-left: 1px;
  padding-right: 1px;
  width: 100%;
}
#enterMobile .enter-mobile-container .verifyInputs .m-loading-circle-icon::before {
  content: '\e654';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
#enterMobile .enter-mobile-container .verifyInputs input {
  height: 100%;
  padding: 1.41666667rem 10px;
}
#enterMobile .enter-mobile-container .error-message {
  color: #e41827;
  color: var(--warning-primary);
  font-size: 1rem;
  line-height: 1.67;
  margin-top: 0.08333333rem;
  min-height: 1.66666667rem;
  text-align: left;
  width: 100%;
}
#enterMobile .enter-mobile-container .error-message .err-login-btn {
  color: #3656a3;
}
#enterMobile .enter-mobile-container .enter-mobile-btn {
  background-color: var(--brand-secondary);
  color: white;
  border: none;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  font-size: 1.066rem;
  height: 3.95833333rem;
  margin-top: 1.91666667rem;
  padding-left: 1px;
  padding-right: 1px;
  width: 100%;
}
#enterMobile .enter-mobile-container .action-label {
  color: #0d9737;
  color: var(--brand-secondary);
  font-size: 1.066rem;
  margin-top: 1.75rem;
  text-align: center;
  width: 100%;
}
#enterMobile .mobile-warning-info {
  font-size: 12px;
  font-weight: bold;
  padding: 5px;
}
.wap-register.es-dialog .es-dialog-head h1 {
  font-size: 1.66666667rem;
  height: auto;
}
.m-input-wap-wrapper {
  border: 1px solid #9ca0ab;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: inline-block;
  font-size: 14px;
  position: relative;
  border-color: #9ca0ab;
  border-color: var(--line-type1-secondary);
}
.m-input-wap-wrapper .m-input-wap {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  border: none;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: inline-block;
  font-size: inherit;
  height: 32px;
  line-height: 1;
  max-width: 100%;
  outline: none;
  padding: 3px 10px;
  -webkit-transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
  width: 100%;
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: #000000;
  color: var(--c-input-text);
}
.m-input-wap-wrapper .m-input-wap::-webkit-input-placeholder {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper .m-input-wap::-moz-placeholder {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper .m-input-wap::-ms-input-placeholder {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper .m-input-wap::placeholder {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper .m-input-wap.on {
  height: 1.33333333rem;
  padding: 0px;
}
.m-input-wap-wrapper .m-input-wap.m-input-wap__password {
  padding-right: 42px !important;
}
.m-input-wap-wrapper .m-input-transform {
  display: block;
  padding-bottom: 8px;
  padding-left: 10px;
  padding-top: 8px;
}
.m-input-wap-wrapper .m-input-transform .m-input-transform-text {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 10px;
  height: 12px;
  line-height: 12px;
  margin-bottom: 4px;
  text-align: left;
}
.m-input-wap-wrapper .m-input-wap-icon {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  height: 100%;
  position: absolute;
  right: 0;
  text-align: center;
  top: 0;
  -webkit-transition: all 0.3s;
  transition: all 0.3s;
  visibility: hidden;
  width: 35px;
}
.m-input-wap-wrapper .m-input-wap-icon::before {
  content: '\e602';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-input-wap-wrapper .m-input-wap-icon::after {
  content: '';
  display: inline-block;
  height: 100%;
  vertical-align: middle;
  width: 0;
}
.m-input-wap-wrapper .m-input-wap-icon + .m-input-wap {
  padding-right: 35px;
}
.m-input-wap-wrapper .m-input-wap-icon.m-input-wap-icon--clickable:hover {
  color: #0d9737;
  color: var(--brand-secondary);
  cursor: pointer;
}
.m-input-wap-wrapper .m-input-wap-icon.m-input-wap-icon--clickable:hover + .m-input-wap {
  border-color: #0d9737;
  border-color: var(--brand-secondary);
}
.m-input-wap-wrapper .m-input-wap-icon.m-input-wap-icon--show {
  visibility: visible;
}
.m-input-wap-wrapper .m-input-wap-text--icon {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  position: absolute;
  right: 0;
  text-align: center;
  top: 0;
  -webkit-transition: all 0.3s;
  transition: all 0.3s;
  width: 42px;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper .m-input-wap-text--icon + .m-input-wap {
  padding-right: 42px;
}
.m-input-wap-wrapper.m-input-wap-wrapper--active {
  border: 1px solid #0d9737;
}
.m-input-wap-wrapper.m-input-wap-wrapper--active .m-input-transform-text {
  color: #0d9737;
  color: var(--brand-secondary);
}
.m-input-wap-wrapper.m-input-wap-wrapper--disabled .m-input-wap,
.m-input-wap-wrapper.m-input-wap-wrapper--disabled .m-input-wap-append,
.m-input-wap-wrapper.m-input-wap-wrapper--disabled .m-input-wap-prepend {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  border-color: #9ca0ab;
  border-color: var(--line-type1-secondary);
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  cursor: not-allowed;
}
.m-input-wap-wrapper.m-input-wap-wrapper--disabled .m-input-wap::-webkit-input-placeholder {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper.m-input-wap-wrapper--disabled .m-input-wap::-moz-placeholder {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper.m-input-wap-wrapper--disabled .m-input-wap::-ms-input-placeholder {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper.m-input-wap-wrapper--disabled .m-input-wap::placeholder {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper.m-input-wap-wrapper--error {
  border: 1px solid #e41827 !important;
  border-color: #e41827 !important;
  border-color: var(--warning-primary) !important;
}
.m-input-wap-wrapper.m-input-wap-wrapper--large {
  font-size: 16px;
}
.m-input-wap-wrapper.m-input-wap-wrapper--large .m-input-wap {
  height: 42px;
}
.m-input-wap-wrapper.m-input-wap-wrapper--small {
  font-size: 13px;
}
.m-input-wap-wrapper.m-input-wap-wrapper--small .m-input-wap {
  height: 30px;
}
.m-input-wap-group {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  line-height: 1;
  width: 100%;
}
.m-input-wap-group > .m-input-wap {
  display: table-cell;
  line-height: normal;
  vertical-align: middle;
}
.m-input-wap-group .m-input-wap-append,
.m-input-wap-group .m-input-wap-prepend {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  border-radius: 4px;
  margin-left: 10px;
  position: relative;
  vertical-align: middle;
  white-space: nowrap;
  color: #000000;
  color: var(--c-input-text);
}
.m-input-wap-group .m-input-wap-append .m-input-wap,
.m-input-wap-group .m-input-wap-prepend .m-input-wap {
  font-size: inherit;
}
.m-input-wap-wrapper .m-input-wap-prepend--default i,
.m-input-wap-wrapper .m-input-wap-prepend--default svg {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
}
.m-input-wap-wrapper .m-input-wap-prepend--default img {
  -webkit-filter: grayscale(100%);
  filter: grayscale(100%);
}
.m-input-wap-wrapper--active .m-input-wap-prepend--default i,
.m-input-wap-wrapper--active .m-input-wap-prepend--default svg {
  color: #0d9737;
  color: var(--brand-secondary);
}
.m-input-wap-wrapper--active .m-input-wap-prepend--default img {
  -webkit-filter: grayscale(0%);
  filter: grayscale(0%);
}
#verify-otp-container {
  color: #353a45;
  color: var(--text-type1-primary);
}
#verify-otp-container .m-loading-wrap {
  background-color: #ffffff;
  min-height: initial;
}
#verify-otp-container .m-loading-wrap .m-loading .loading {
  background-color: #ffffff;
}
#verify-otp-container .m-loading-wrap {
  background-color: var(--background-type1-quaternary);
  min-height: initial;
}
#verify-otp-container .m-loading-wrap .m-loading .loading {
  background-color: var(--background-type1-quaternary);
}
#verify-otp-container .split-line {
  background-color: #eaecef;
  background-color: var(--background-type1-tertiary);
  height: 1px;
  margin: 1.66666667rem 0;
  width: 100%;
}
#verify-otp-container .sec-left {
  color: #353a45;
  color: var(--text-type1-primary);
}

.m-pin-code-wrapper {
  display: -webkit-inline-box;
  display: -webkit-inline-flex;
  display: -ms-inline-flexbox;
  display: inline-flex;
  -webkit-flex-wrap: nowrap;
  -ms-flex-wrap: nowrap;
  flex-wrap: nowrap;
}
.m-pin-code-wrapper .m-pin-code-input {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  border: solid 1px #9ca0ab;
  border-radius: 2px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  font-size: 20px;
  outline: none;
  text-align: center;
  border-color: #9ca0ab;
  border-color: var(--line-type1-secondary);
  color: #1b1e25;
  color: var(--text-type1-tertiary);
  max-width: 44px;
  min-width: 40px;
  width: 43px;
  height: 47px;
}
.m-pin-code-wrapper .m-pin-code-input.mask {
  -webkit-text-security: disc;
}
.m-pin-code-wrapper .m-pin-code-input.mask.text-security {
  font-family: text-security-disc;
}
@font-face {
  font-family: text-security-disc;
  src: url(//s.sporty.net/global/main/common/iconfont/text-security-disc.4fa38d775a.woff);
}
.m-pin-code-wrapper .m-pin-code-input:not(:last-child) {
  margin-right: 10px;
}
.m-pin-code-wrapper .m-pin-code-input:focus {
  border: solid 1px #0d9737;
  border-color: #0d9737;
  border-color: var(--brand-secondary);
}
.m-pin-code-wrapper .m-pin-code-input.error {
  border: solid 1px #e41827;
  border-color: #e41827;
  border-color: var(--warning-primary);
}
</style>
