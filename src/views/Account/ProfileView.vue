<template>
  <div v-if="!showInputFieldView" class="m-uc-wrapper myAccount">
    <HeaderOther :header-title="'Profile'"></HeaderOther>
    <div class="m-ac-info-wrap">
      <ul style="position: relative">
        <li class="lock">
          <em>Username</em><span>{{ currentUser.username }}</span>
        </li>
        <li
          class="lock"
          :class="details?.firstName ? '' : 'with-arrow'"
          @click="showInput('First Name', 'text', details?.firstName, false)"
        >
          <em>First Name</em><span>{{ details?.firstName ? details?.firstName : 'Not Set' }}</span>
        </li>
        <li
          class="lock"
          :class="details?.lastName ? '' : 'with-arrow'"
          @click="showInput('Last Name', 'text', details?.lastName, false)"
        >
          <em>Last Name</em><span>{{ details?.lastName ? details?.lastName : 'Not Set' }}</span>
        </li>
        <li
          :class="currentUser.email ? '' : 'with-arrow'"
          @click="showInput('Email', 'email', currentUser.email, false)"
        >
          <em>Email</em><span>{{ currentUser.email ? currentUser.email : 'Not Set' }}</span>
        </li>
        <li class="lock">
          <em>Phone Number</em><span>+234 {{ details?.username }}</span>
        </li>
        <li
          class="lock"
          :class="details?.address ? '' : 'with-arrow'"
          @click="showInput('Address', 'text', details?.address, false)"
        >
          <em>Address</em
          ><span
            ><span>{{ details?.address ? details?.address : 'Not Set' }}</span></span
          >
        </li>
        <li
          class="lock"
          :class="details?.city ? '' : 'with-arrow'"
          @click="showInput('City', 'text', details?.city, false)"
        >
          <em>City</em
          ><span
            ><span>{{ details?.city ? details?.city : 'Not Set' }}</span></span
          >
        </li>
        <li
          class="with-arrow"
          @click="showInput('Update Password', 'password', null, null, 'password')"
        >
          <em data-cms-key="birthday">Change your password</em><span></span>
        </li>
      </ul>
    </div>
  </div>
  <div v-else class="m-uc-wrapper myAccount">
    <div class="m-ac-form-wrap">
      <HeaderProfile
        :header-title="inputTitle"
        @back-to-profile="handleBackToProfile"
      ></HeaderProfile>
      <form style="margin: 2rem auto 0rem">
        <div tabindex="6" class="m-input-wrapper">
          <input
            :type="textType"
            :placeholder="inputTitle"
            class="m-input fs-exclude"
            style="width: calc(100% - 2rem); padding: 0rem 0.75rem"
            v-model="inputValue"
            v-if="!isPasswordUpdate"
          />
          <template v-else>
            <input
              type="password"
              placeholder="Old Password"
              class="m-input fs-exclude"
              style="width: calc(100% - 2rem); padding: 0rem 0.75rem; margin-bottom: 15px"
              v-model="oldPassword"
            />
            <input
              type="password"
              placeholder="New Password"
              class="m-input fs-exclude"
              style="width: calc(100% - 2rem); padding: 0rem 0.75rem"
              v-model="newPassword"
            />
          </template>
        </div>
        <!---->
        <div class="m-btn-wrapper">
          <button class="af-button af-button--success" @click.prevent="saveUpdate">
            <span> {{ buttonText }} </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import HeaderOther from '@/components/HeaderOther.vue'
import { useUsersStore } from '@/stores'
import { ref, computed } from 'vue'
import HeaderProfile from '../../components/HeaderProfile.vue'
import { updateProfile, CLIENT_ID, updatePassword } from '@/helpers'

const usersStore = useUsersStore()

const currentUser = computed(() => {
  return usersStore.currentUser
})

const details = computed(() => {
  return usersStore.currentUser
})

const inputTitle = ref('')
const textType = ref('text')
const inputValue = ref('')
const showInputFieldView = ref(false)
const isPasswordUpdate = ref(false)

const oldPassword = ref('')
const newPassword = ref('')

const buttonText = ref('Save')

function showInput(title, text_type, value_exists, editable, inputType = null) {
  if (!editable && value_exists) return
  console.log(inputType)
  showInputFieldView.value = true
  inputTitle.value = title
  if (!value_exists && value_exists !== null) {
    textType.value = text_type
  } else if (value_exists !== null && editable) {
    textType.value = text_type
  } else if (inputType && inputType === 'password') {
    isPasswordUpdate.value = true
  }
}

function handleBackToProfile() {
  showInputFieldView.value = false
}

async function saveUpdate() {
  let url
  let payload = {
    userID: currentUser.value.id,
    roleId: currentUser.value.roleId,
    email: currentUser.value.email ?? '',
    firstName: details.value?.firstName ?? '',
    lastName: details.value?.lastName ?? '',
    phone: details.value?.phone ?? '',
    address: details.value?.address ?? '',
    city: details.value?.city ?? '',
    gender: details.value?.gender ?? ''
    // date_of_birth: details.value?.date_of_birth ?? ''
  }
  switch (inputTitle.value) {
    case 'First Name':
      payload.firstName = inputValue.value
      break
    case 'Last Name':
      payload.lastName = inputValue.value
      break
    case 'Email':
      payload.email = inputValue.value
      break
    case 'Address':
      payload.address = inputValue.value
      break
    case 'City':
      payload.city = inputValue.value
      break
    case 'Gender':
      payload.gender = inputValue.value
      break
    case 'Date of Birth':
      payload.date_of_birth = inputValue.value
      break
    case 'Update Password':
      payload = {
        clientId: CLIENT_ID,
        oldPassword: oldPassword.value,
        password: newPassword.value
      }
      break
    default:
      break
  }
  let res
  if (isPasswordUpdate.value) {
    if (oldPassword.value === '' || newPassword.value === '') return
    buttonText.value = 'Saving...'
    res = await updatePassword(payload)
  } else {
    buttonText.value = 'Saving...'
    res = await updateProfile(payload)
  }
  buttonText.value = 'Save'
  if (res.success) {
    await usersStore.loadCurrentUser()
    alert('Update Successful!')
    showInputFieldView.value = false
    inputTitle.value = ''
    inputValue.value = ''
    textType.value = 'text'
  } else {
    alert(`Error: ${res.message}`)
  }
}
</script>
<style scoped>
.m-uc-wrapper {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  font-family: Roboto;
}
.m-uc-wrapper .mg-b-40 {
  margin-bottom: 3.33333333rem;
}
.m-uc-wrapper .displayName {
  color: #000000;
  color: var(--text-default);
  font-size: 1.33333333rem;
  font-weight: 700;
  margin: 1.66666667rem 0 2rem 0;
  padding: 0 4.9%;
}

.m-uc-wrapper .m-ac-info-wrap .verify-btn {
  border: 1px solid #0d9737;
  border-radius: 4px;
  color: #0d9737;
  font-size: 1.066rem;
  font-weight: 500;
  margin-left: 10px;
  margin-right: auto;
  padding: 0 1.25rem;
}
.m-uc-wrapper .m-ac-info-wrap li {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  border-bottom: 1px solid;
  border-bottom-color: #eaecef;
  border-bottom-color: var(--brand-border-type1);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 2.16666667rem;
  line-height: 2.16666667rem;
  padding: 1.066rem 1.33333333rem 1.066rem 4.9%;
  position: relative;
}
/* .m-uc-wrapper .m-ac-info-wrap li > span {
  color: var(--brand-primary) !important;
} */
.m-uc-wrapper .m-ac-info-wrap li > span.gray {
  color: #9ca0ab !important;
}
.m-uc-wrapper .m-ac-info-wrap li.lock > span {
  color: #9ca0ab !important;
}
.m-uc-wrapper .m-ac-info-wrap li.with-arrow::before {
  content: '\e608';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-uc-wrapper .m-ac-info-wrap li.with-arrow::before {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  line-height: 1;
  position: absolute;
  right: 0.5rem;
  top: 1.5rem;
}
.m-uc-wrapper .m-ac-info-wrap li.with-check > span {
  color: #9ca0ab !important;
}
.m-uc-wrapper .m-ac-info-wrap li em {
  color: #353a45;
  color: var(--text-type1-primary);
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  font-size: 1.066rem;
  font-weight: normal;
}
.m-uc-wrapper .m-ac-info-wrap li > span {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 1.066rem;
  margin-right: 1rem;
  max-width: 50%;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-uc-wrapper .m-ac-info-wrap li > span.block {
  background-color: #eaecef;
  background-color: var(--background-type1-tertiary);
  font-size: 0.66666667rem;
  height: 1.33333333rem;
  line-height: 1.33333333rem;
  padding: 0.5rem 0.66666667rem;
}
.m-uc-wrapper .m-ac-info-wrap li > span.unverified {
  background-color: #0d9737;
  color: #ffffff !important;
  font-size: 0.66666667rem;
  height: 1.33333333rem;
  line-height: 1.33333333rem;
  padding: 0.58333333rem 1rem;
}
.m-uc-wrapper .noticed {
  margin: 2.25rem 2.5rem 1.75rem;
}
.m-uc-wrapper .noticed p {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 1rem;
  line-height: 1.5rem;
  text-align: center;
}
.m-uc-wrapper .m-input-wrapper {
  width: 100%;
}
.m-uc-wrapper .m-input-wrapper .m-input {
  border: 1px solid #9ca0ab;
  border-radius: 0.16666667rem;
  font-size: 1rem;
  height: 4rem;
  line-height: 2.66666667rem;
  padding: 0.66666667rem 0.75rem;
  border-color: #9ca0ab;
  border-color: var(--line-type1-secondary);
}
.m-uc-wrapper .m-input-wrapper .m-input-com {
  display: block;
  position: static;
}
.m-uc-wrapper .m-input-wrapper .m-input-icon {
  right: 0.66666667rem;
  width: 1.66666667rem;
}
.m-uc-wrapper .m-input-wrapper .m-input-icon::before {
  content: '\e69a';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-uc-wrapper .m-input-wrapper .m-input-icon::before {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  border-radius: 1.66666667rem;
  font-size: 1rem;
  height: 1.66666667rem;
  line-height: 1.66666667rem;
  position: absolute;
  right: 0;
  text-align: center;
  top: 50%;
  -webkit-transform: translate(0, -50%);
  -ms-transform: translate(0, -50%);
  transform: translate(0, -50%);
  width: 1.66666667rem;
  color: #353a45;
  color: var(--text-type1-primary);
}
.m-uc-wrapper .m-input-wrapper .m-input-icon + .m-input {
  padding-right: 2.33333333rem;
}
.m-uc-wrapper .m-input-wrapper .m-input-icon.m-input-icon--clickable:hover {
  color: #0d9737;
  color: var(--brand-text-secondary);
}
.m-uc-wrapper .m-input-wrapper .m-input-icon.m-input-icon--clickable:hover + .m-input {
  border-color: #0d9737;
  border-color: var(--brand-text-secondary);
}
.m-uc-wrapper .m-input-wrapper .m-input-text--icon {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #3656a3;
  font-size: 1.066rem;
  -webkit-box-pack: end;
  -webkit-justify-content: flex-end;
  -ms-flex-pack: end;
  justify-content: flex-end;
  padding-right: 0.83333333rem;
  text-align: left;
  width: 3.75rem;
}
.m-uc-wrapper .m-input-wrapper .m-input-text--icon + .m-input {
  padding-right: 3.75rem;
}
.m-uc-wrapper .m-input-wrapper.m-input-wrapper--error .m-input {
  border-color: #e41827 !important;
  border-color: var(--warning-primary) !important;
}
.m-uc-wrapper .m-input-wrapper.m-input-wrapper--error .m-input-prepend {
  border-color: #e41827 !important;
  border-color: var(--warning-primary) !important;
}
.m-uc-wrapper .m-input-wrapper.m-input-wrapper--active .m-input {
  border-color: #0d9737;
  border-color: var(--brand-text-secondary);
}
.m-uc-wrapper .m-input-wrapper:nth-of-type(2).m-input-wrapper--active .m-input {
  border-color: #0d9737;
  border-color: var(--brand-text-secondary);
}
.m-uc-wrapper .m-input-group--prepend {
  border: 1px solid #0d9737 !important;
  border-radius: 0.16666667rem;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 0.33333333rem 0.5rem;
  border-color: #0d9737 !important;
  border-color: var(--brand-text-secondary) !important;
}
.m-uc-wrapper .m-input-group--prepend .m-input-prepend,
.m-uc-wrapper .m-input-group--prepend .m-input {
  border: none !important;
}
.m-uc-wrapper .m-input-group--prepend .m-input-prepend {
  font-size: 1.33333333rem;
  padding: 0 0.58333333rem 0 0;
}
.m-uc-wrapper .m-input-group--prepend.m-input-wrapper--active {
  border: 1px solid #0d9737 !important;
  border-color: #0d9737 !important;
  border-color: var(--brand-text-secondary) !important;
}
.m-uc-wrapper .m-input-group--prepend.m-input-wrapper--error {
  border: 1px solid #e41827 !important;
  border-color: #e41827 !important;
  border-color: var(--warning-primary) !important;
}
.m-uc-wrapper .m-input-group--prepend.m-input-wrapper--error input.m-input {
  border: none !important;
}
.m-uc-wrapper .m-input-group--prepend .m-input-icon {
  right: 1.08333333rem;
}
.m-uc-wrapper .m-input-group--prepend .m-input-icon + .m-input {
  padding-right: 0.83333333rem;
}
.m-uc-wrapper .m-input-group--prepend .m-input-icon.m-input-icon--show + .m-input {
  padding-right: 2.33333333rem;
}
.m-uc-wrapper .m-input-group--prepend .m-input {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  border: none !important;
  border-radius: 0.16666667rem;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  height: 3.16666667rem;
  line-height: 3.16666667rem;
  padding: 0.25rem 2.58333333rem 0.25rem 0.83333333rem;
}
.myAccount .dateSelect {
  position: fixed;
}
.left-words {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  position: absolute;
  right: 0.83333333rem;
  top: 1.25rem;
}
.fixPos {
  right: 2.91666667rem;
}
.m-input {
  font-size: 1.066rem !important;
}
.selected {
  color: #0d9737 !important;
}
.edit {
  color: #9ca0ab !important;
}
.verified {
  color: #9ca0ab !important;
}
.m-ac-form-wrap {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  height: 100%;
  left: 0;
  overflow: auto;
  position: fixed;
  top: 0;
  width: 100%;
  z-index: 1;
}
.m-ac-form-wrap form {
  margin: 2rem auto 0;
  width: 83.33%;
}
.m-ac-form-wrap form.m-psw-wrap {
  margin-top: 1.66666667rem;
}
.m-ac-form-wrap form.m-psw-wrap h1 {
  font-size: 1.83333333rem;
  font-weight: bold;
  text-align: center;
}
.m-ac-form-wrap form.m-psw-wrap p {
  font-size: 1rem;
  line-height: 1.33333333rem;
  margin: 0.83333333rem 0 1.66666667rem;
  text-align: center;
}
.m-ac-form-wrap form.m-psw-wrap .m-link-awrap {
  padding-top: 0.58333333rem;
  text-align: center;
}
.m-ac-form-wrap form.m-psw-wrap .m-link-awrap a {
  color: #0d9737;
  font-size: 1.33333333rem;
}
.m-ac-form-wrap .password-nav .m-icon-close::before {
  content: '\e69a';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-ac-form-wrap .m-btn-wrapper {
  margin-top: 0.66666667rem;
}
.m-ac-form-wrap .m-error-infos {
  color: #e41827;
  color: var(--warning-primary);
  font-size: 0.83333333rem;
  line-height: 1.33333333rem;
  margin-top: 0.66666667rem;
}
.af-button {
  width: 100%;
}

.af-button {
  -webkit-appearance: none;
  background: #fff;
  border: 1px solid #c4c4c4;
  border-radius: 4px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  cursor: pointer;
  display: inline-block;
  font-size: 14px;
  line-height: 1;
  margin: 0;
  outline: 0;
  padding: 10px 15px;
  text-align: center;
  -moz-user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  white-space: nowrap;
  color: #ffffff;
  color: var(--brand-tertiary);
}
.af-button.is-disabled,
.af-button.is-disabled:focus,
.af-button.is-disable:hover {
  background-color: #dcdee5 !important;
  background-color: var(--disable-brand-secondary) !important;
  background-image: none;
  cursor: not-allowed;
  border-color: #dcdee5 !important;
  border-color: var(--disable-brand-secondary) !important;
  color: #9ca0ab !important;
  color: var(--text-disable-type1-primary) !important;
}
.af-button.is-disabled.af-button--text {
  background-color: transparent;
}
.af-button.is-disabled.is-plain,
.af-button.is-disabled.is-plain:focus,
.af-button.is-disabled.is-plain:hover {
  background-color: transparent !important;
  border-color: #dcdee5 !important;
  border-color: var(--disable-brand-secondary) !important;
  color: #dcdee5 !important;
  color: var(--disable-brand-secondary) !important;
}
.af-button.is-plain:active {
  background-color: #fff;
  border-color: #1d90e6;
  color: #1d90e6;
  outline: 0;
}
.af-button.is-loading {
  pointer-events: none;
  position: relative;
}
.af-button.is-loading:before {
  background-color: rgba(255, 255, 255, 0.35);
  border-radius: inherit;
  bottom: -1px;
  color: black;
  content: '';
  left: -1px;
  pointer-events: none;
  position: absolute;
  right: -1px;
  top: -1px;
}
.af-button [class*='af-icon-'] + span,
.af-button [class^='af-icon-'] {
  display: inline-block;
  font-family: element-icons !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
  font-variant: normal;
  font-weight: 400;
  line-height: 1;
  margin-left: 5px;
  text-transform: none;
  vertical-align: baseline;
}
@-webkit-keyframes loading-rotate {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
@keyframes loading-rotate {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
.af-button .af-icon-loading:before {
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
  content: '\e648';
  font-size: 1.066rem;
}
.af-button .af-icon-loading {
  -webkit-animation: loading-rotate 2s linear infinite;
  animation: loading-rotate 2s linear infinite;
}
.af-button .af-icon-edit:before {
  content: '\e61c';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.af-button .af-icon-share:before {
  content: '\e63d';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.af-button .af-icon-upload:before {
  content: '\e601';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.af-button .af-icon-search:before {
  content: '\e613';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.af-button .af-icon-delete:before {
  content: '\e677';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.af-button .af-icon--right {
  margin-left: 5px;
}
.af-button .af-icon--left {
  margin-right: 5px;
}
.af-button--primary {
  background-color: #226262;
  background-color: var(--brand-primary);
  color: #ffffff;
  /* color: var(--brand-tertiary); */
}
.af-button--primary:focus,
.af-button--primary:hover:not(.is-disabled) {
  background-color: #0a7e2e;
  border-color: #0a7e2e;
  color: #ffffff;
  color: var(--brand-tertiary);
}

.af-button--success {
  background-color: #0d9737;
  background-color: var(--brand-text-secondary);
  color: #ffffff;
}
.af-button--success:active {
  outline: 0;
}
</style>
