<template lang="">
  <div class="m-snap-nav-wrap m-sports-choose">
    <div
      v-if="isAviatorLoading"
      class="aviator-loading-overlay"
      role="status"
      aria-live="polite"
      aria-label="Loading Aviator"
    >
      <span class="aviator-loading-spinner" aria-hidden="true"></span>
    </div>
    <ul class="m-snap-nav flex" style="width: 100%">
      <li class="m-sports-choose-item m-snap-nav-item">
        <a @click.prevent="$router.push({ name: 'sports', query: { sport: 'Soccer' } })">
          <div class="sport-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              color="#4a4a4a"
              fill="none"
              stroke="#4a4a4a"
              stroke-width="1.5"
            >
              <path
                d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              ></path>
              <path
                d="M11.7077 9.34893C11.882 9.21702 12.118 9.21702 12.2923 9.34893L14.545 11.054C14.7193 11.1859 14.7922 11.4197 14.7256 11.6332L13.8652 14.3921C13.7986 14.6055 13.6077 14.75 13.3923 14.75H10.6077C10.3923 14.75 10.2014 14.6055 10.1348 14.3921L9.27437 11.6332C9.20781 11.4197 9.28073 11.1859 9.45499 11.054L11.7077 9.34893Z"
              ></path>
              <path
                d="M12 9V5M15 11L19 9.5M14 15L16 18M10 14.5L8 17M9 11.5L5 10.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
              <path
                d="M9 2.5L12.0165 4.62241L15 2.5M2 12.7998L5.19655 10.4388L3.55548 6.72045M19.4703 18.8531L15.6158 18.1555L14.2655 22M20.0298 6.19586L18.8035 9.38978L22 11.7507M8.00992 21.4059L8.05142 17.1665L4.00331 17.21"
                stroke-linejoin="round"
              ></path>
            </svg>
          </div>
          <span class="sport-text" data-cms-key="sports" data-cms-page="wap_home">Sports </span>
        </a>
      </li>
      <li class="m-sports-choose-item m-snap-nav-item">
        <a @click.prevent="$router.push({ name: 'live' })">
          <div class="sport-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              color="#4a4a4a"
              fill="none"
              stroke="#4a4a4a"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M17 21C18.8692 21 19.8038 21 20.5 20.5981C20.9561 20.3348 21.3348 19.9561 21.5981 19.5C22 18.8038 22 17.8692 22 16C22 14.1308 22 13.1962 21.5981 12.5C21.3348 12.0439 20.9561 11.6652 20.5 11.4019C19.8038 11 18.8692 11 17 11H7C5.13077 11 4.19615 11 3.5 11.4019C3.04394 11.6652 2.66523 12.0439 2.40192 12.5C2 13.1962 2 14.1308 2 16C2 17.8692 2 18.8038 2.40192 19.5C2.66523 19.9561 3.04394 20.3348 3.5 20.5981C4.19615 21 5.13077 21 7 21H17Z"
              ></path>
              <path d="M16 6C15.0227 4.77354 13.5929 4 12 4C10.4071 4 8.97726 4.77354 8 6"></path>
              <path d="M14 8C13.5114 7.38677 12.7965 7 12 7C11.2035 7 10.4886 7.38677 10 8"></path>
              <path
                d="M5 14V18H6.5M19 18H17V16M17 16V14H19M17 16H18.5M9 14V18M11.5 14L13 18L14.5 14"
              ></path>
            </svg>
          </div>
          <span class="sport-text" data-cms-key="sports" data-cms-page="wap_home">Live </span>
        </a>
      </li>
      <li class="m-sports-choose-item m-snap-nav-item">
        <a
          href="#"
          style="padding-top: 6px"
          :aria-busy="isAviatorLoading"
          @click.prevent="playAviator"
          ><div class="sport-con">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTY8ynsa8sCGZBFO0kXlBsiR1RKR-f7VVwfI39t0Ol1snwY7KStpbdPycKA&s=10"
              loading="eager"
              style="height: 52px"
            />
          </div>
          <!-- <span class="sport-text" data-cms-key="live" data-cms-page="wap_home" style="color: ">Aviator</span> -->
        </a>
      </li>
      <!-- <li class="m-sports-choose-item m-snap-nav-item">
        <a href="#" @click.prevent="openVirtual"
          ><div class="sport-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              color="#4a4a4a"
              fill="none"
              stroke="#4a4a4a"
              stroke-width="1.5"
              stroke-linecap="round"
            >
              <path
                d="M17 9H7C5.13077 9 4.19615 9 3.5 9.44212C3.04394 9.73175 2.66523 10.1483 2.40192 10.65C2 11.4158 2 12.4438 2 14.5C2 16.5562 2 17.5842 2.40192 18.35C2.66523 18.8517 3.04394 19.2682 3.5 19.5579C4.19615 20 5.13077 20 7 20C7.61332 20 7.91998 20 8.21032 19.9529C8.98496 19.8272 9.70902 19.4541 10.2927 18.88C10.5115 18.6648 10.7078 18.4057 11.1005 17.8874L11.4346 17.4463C11.6334 17.1839 11.7328 17.0527 11.8543 17.0014C11.9552 16.9587 12.0659 16.9532 12.1699 16.9856C12.2951 17.0246 12.4049 17.1454 12.6245 17.3869L13.5858 18.4444C13.8243 18.7067 13.9435 18.8379 14.0676 18.9537C14.7056 19.5498 15.4976 19.9106 16.3319 19.9855C16.4941 20 16.6627 20 17 20C18.8692 20 19.8038 20 20.5 19.5579C20.9561 19.2682 21.3348 18.8517 21.5981 18.35C22 17.5842 22 16.5562 22 14.5C22 12.4438 22 11.4158 21.5981 10.65C21.3348 10.1483 20.9561 9.73175 20.5 9.44212C19.8038 9 18.8692 9 17 9Z"
              ></path>
              <path d="M16 13H18"></path>
              <path
                d="M22 15V12.4522C22 11.4723 22 10.9823 21.9227 10.5086C21.8844 10.2743 21.8322 10.0438 21.7664 9.81888C21.6333 9.36411 21.427 8.94392 21.0145 8.1036C20.1876 6.41927 19.7742 5.5771 19.1715 5.01138C18.8756 4.73365 18.5493 4.50788 18.2022 4.34065C17.4952 4 16.6916 4 15.0845 4H8.91548C7.30836 4 6.5048 4 5.79779 4.34065C5.45069 4.50788 5.12444 4.73365 4.82853 5.01138C4.22579 5.5771 3.81236 6.41927 2.9855 8.1036C2.57298 8.94394 2.36671 9.3641 2.23364 9.81888C2.16781 10.0438 2.11557 10.2743 2.07733 10.5086C2 10.9823 2 11.4723 2 12.4522V15"
              ></path>
            </svg>
          </div>
          <span class="sport-text" data-cms-key="live" data-cms-page="wap_home">Virtuals</span>
        </a>
      </li> -->

      <li class="m-sports-choose-item m-snap-nav-item" v-if="0">
        <a href="#" @click.prevent="goToLiveScore"
          ><div class="sport-icon">
            <img
              src="@/assets/images/score.png"
              style="padding-bottom: 5px; height: 25px"
              loading="eager"
            />
          </div>
          <span class="sport-text" data-cms-key="live" data-cms-page="wap_home">Livescore</span>
        </a>
      </li>
      <li class="m-sports-choose-item m-snap-nav-item">
        <a href="#" @click.prevent="goToStatistics"
          ><div class="sport-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              color="#4a4a4a"
              fill="none"
              stroke="#4a4a4a"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M20.4999 16.5V8.5C20.4999 6.14298 20.4999 4.96447 19.7676 4.23223C19.0354 3.5 17.8569 3.5 15.4999 3.5H8.49988C6.14286 3.5 4.96434 3.5 4.23211 4.23223C3.49988 4.96447 3.49988 6.14298 3.49988 8.5V16.5"
              ></path>
              <path
                d="M21.9841 20.5H2.01567C1.63273 20.5 1.38367 20.1088 1.55493 19.7764L3.49988 16.5H20.4999L22.4448 19.7764C22.6161 20.1088 22.367 20.5 21.9841 20.5Z"
              ></path>
              <path d="M7.49988 10H9.49988L10.9999 12.5L12.9999 7.5L14.4999 10H16.4999"></path>
            </svg>
          </div>
          <span class="sport-text" data-cms-key="live" data-cms-page="wap_home">Statistics</span>
        </a>
      </li>
      <li class="m-sports-choose-item m-snap-nav-item">
        <a href="/Promotions"
          ><div class="sport-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              color="#4a4a4a"
              fill="none"
              stroke="#4a4a4a"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path
                d="M14.9263 2.91103L8.27352 6.10452C7.76151 6.35029 7.21443 6.41187 6.65675 6.28693C6.29177 6.20517 6.10926 6.16429 5.9623 6.14751C4.13743 5.93912 3 7.38342 3 9.04427V9.95573C3 11.6166 4.13743 13.0609 5.9623 12.8525C6.10926 12.8357 6.29178 12.7948 6.65675 12.7131C7.21443 12.5881 7.76151 12.6497 8.27352 12.8955L14.9263 16.089C16.4534 16.8221 17.217 17.1886 18.0684 16.9029C18.9197 16.6172 19.2119 16.0041 19.7964 14.778C21.4012 11.4112 21.4012 7.58885 19.7964 4.22196C19.2119 2.99586 18.9197 2.38281 18.0684 2.0971C17.217 1.8114 16.4534 2.17794 14.9263 2.91103Z"
              ></path>
              <path
                d="M11.4581 20.7709L9.96674 22C6.60515 19.3339 7.01583 18.0625 7.01583 13H8.14966C8.60978 15.8609 9.69512 17.216 11.1927 18.197C12.1152 18.8012 12.3054 20.0725 11.4581 20.7709Z"
              ></path>
              <path d="M7.5 12.5V6.5"></path>
            </svg>
          </div>
          <span class="sport-text" data-cms-key="live" data-cms-page="wap_home">Promos</span>
        </a>
      </li>
    </ul>
    <i class="controls left-controls"></i>
    <i class="controls right-controls"></i>
  </div>
</template>
<script setup>
import { useUtilsStore, useUsersStore } from '@/stores'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { slugify, getGoldenRaceLobbyUrl, getQtechLaunchUrl } from '@/helpers'
import MD5 from 'crypto-js/md5'
import emitter from '@/plugins/emitter'
import Cookies from 'js-cookie'

// const { sports, sport_id } = useUtilsStore()
const utilsStore = useUtilsStore()
const router = useRouter()
const usersStore = useUsersStore()
// const token = ref('111111')
// const group = ref(import.meta.env.VITE_APP_KEY)
// const mode = ref(0)

const getImageSrc = (sportId) => {
  const imageUrl = new URL(`../../assets/images/sports/${sportId}.png`, import.meta.url)
  return imageUrl
}

const token = computed(() => {
  return usersStore.currentUser ? usersStore.details.authCode : '111111'
})

const mode = computed(() => {
  return usersStore.currentUser ? 1 : 0
})

const group = computed(() => {
  return usersStore.currentUser ? usersStore.details.group : import.meta.env.VITE_APP_KEY
})

const sportsList = computed(() => {
  return utilsStore.sportsMenu
})

const activeSportID = computed(() => {
  return utilsStore.sportID
})

const isAviatorLoading = ref(false)

const getActiveSport = computed(() => {
  return sportsList.value.find((x) => x.sport_id == activeSportID.value)
})

function setActiveSport(id) {
  utilsStore.sportID = id
  router.push({
    name: 'sports',
    query: { sport: slugify(getActiveSport.value.sport_name) }
  })
}

const hashStr = computed(() => {
  return MD5(
    `${token.value}10100${import.meta.env.VITE_SITE_URL}${mode.value}${
      group.value
    }mobile${import.meta.env.VITE_XPRESS_PRIVATE_KEY}`
  ).toString()
})

const generatedURL = computed(() => {
  return `${import.meta.env.VITE_XPRESS_LAUNCH_URL}?token=${
    token.value
  }&game=10100&backurl=${import.meta.env.VITE_SITE_URL}&mode=${
    mode.value
  }&group=${group.value}&clientPlatform=mobile&h=${hashStr.value}`
})

const goToLiveScore = () => {
  return window.open(`https://ls.sir.sportradar.com/bematrics`, 'stats', 'width=1078,height=768')
}

const goToStatistics = () => {
  return window.open(`https://s5.sir.sportradar.com/bematrics`, 'stats', 'width=1078,height=768')
}

async function openVirtual() {
  const bearerToken = Cookies.get('SBE-TOKEN') || undefined
  const res = await getGoldenRaceLobbyUrl(
    {
      client_id: import.meta.env.VITE_CLIENT_ID,
      provider_id: '3',
      mode: '1',
      language: 'en',
      group: 'master',
      game: '10100',
      category_id: '3',
      currency: 'NGN'
    },
    bearerToken
  )
  window.location.href = res.launchUrl
}

async function playAviator() {
  if (isAviatorLoading.value) return

  isAviatorLoading.value = true

  try {
    const bearerToken = Cookies.get('SBE-TOKEN')
    if (!bearerToken) {
      return router.push({ name: 'sign-in' })
    }

    if (!usersStore.currentUser) {
      await usersStore.loadCurrentUser().catch(() => null)
    }

    const user = usersStore.currentUser
    if (!user?.id) {
      return router.push({ name: 'sign-in' })
    }

    const { id } = user
    const res = await getQtechLaunchUrl(
      'SPB-aviator',
      {
        playerId: String(id),
        currency: 'NGN',
        country: 'NG',
        lang: 'en_US',
        device: 'desktop',
        walletSessionId: bearerToken,
        lobbyUrl: `https://clientapi-prod.sportsbookengine.com/providers/qtech/accounts/${id}/session?gameId=SPB-aviator`,
        mode: 'real'
      },
      bearerToken
    )
    const launchUrl = res?.launchUrl || res?.url || res?.data?.launchUrl || res?.data?.url

    if (!launchUrl) {
      throw new Error('Aviator launch URL was not returned')
    }

    return window.location.assign(launchUrl)
  } catch (error) {
    console.error('Unable to launch Aviator:', error)
    emitter.emit('showErrorMessage', 'Unable to open Aviator right now. Please try again.')
  } finally {
    isAviatorLoading.value = false
  }
}

function playSmatVirtual() {
  if (usersStore.currentUser) {
    return router.push({
      name: 'game-play',
      params: { game_name: slugify('SmatVirtual'), game_id: 'smat_virtual' }
    })
  } else {
    return router.push('/sign-in')
  }
}

onMounted(() => {
  // if (usersStore.details) {
  //   token.value = usersStore.details.authCode
  //   mode.value = 1
  //   group.value = usersStore.details.group
  // }
})
</script>
<style scoped>
.aviator-loading-overlay {
  align-items: center;
  background: rgba(20, 25, 34, 0.58);
  display: flex;
  inset: 0;
  justify-content: center;
  position: fixed;
  z-index: 3000;
}

.aviator-loading-spinner {
  animation: aviator-spinner 0.8s linear infinite;
  border: 3px solid rgba(255, 255, 255, 0.32);
  border-radius: 50%;
  border-top-color: #fff;
  height: 2.25rem;
  width: 2.25rem;
}

@keyframes aviator-spinner {
  to {
    transform: rotate(360deg);
  }
}

.x-main-mid .m-bscast > div {
  height: auto;
}

.home .m-sports-choose-item a,
.home .m-sports-choose-item a:hover,
.home .m-sports-choose-item a:active,
.home .m-sports-choose-item a:visited {
  background: none;
}
.home .m-popular-item a,
.home .m-popular-item a:hover,
.home .m-popular-item a:active,
.home .m-popular-item a:visited {
  background: none;
}
.home .m-sports-choose-item a,
.home .m-popular-item a,
.home .m-sports-choose-item a:hover,
.home .m-popular-item a:hover,
.home .m-sports-choose-item a:active,
.home .m-popular-item a:active,
.home .m-sports-choose-item a:visited,
.home .m-popular-item a:visited {
  color: #353a45;
  /* color: var(--c-sports-banner-text); */
  display: block;
  outline: none;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  text-decoration: none;
}
.home .m-sports-choose {
  min-height: 5rem;
  background-color: var(--background-type1-primary);
}
.home .m-sports-choose .m-sports-choose-item {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #353a45;
  /* color: var(--c-sports-banner-text); */
  display: block;
  -webkit-box-flex: 0 !important;
  -webkit-flex: 0 0 auto !important;
  -ms-flex: 0 0 auto !important;
  flex: 0 0 auto !important;
  padding: 0;
  position: relative;
  text-align: center;
  width: calc(100% / 6);
}
.home .m-sports-choose .m-sports-choose-item > a {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: block;
  align-items: center;
  min-height: 5rem;
  padding: 0.83333333rem 0 0.33333333rem;
  width: 100%;
}
.home .m-sports-choose .m-sports-choose-item .m-live-icon::before {
  content: '\e62b';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.home .m-sports-choose .m-sports-choose-item .sport-icon {
  height: 1.66666667rem;
  line-height: 1.66666667rem;
  margin: 0 auto;
  text-align: center;
  width: 1.66666667rem;
  margin-bottom: 5px;
}
.home .m-sports-choose .m-sports-choose-item .sport-icon img {
  vertical-align: top;
  /* filter: invert(1) */
}
.home .m-sports-choose .m-sports-choose-item .sport-icon:before {
  color: #353a45;
  display: inline-block;
  font-size: 1.66666667rem;
  font-weight: 500;
  height: 1.66666667rem;
  width: 1.66666667rem;
}
.home .m-sports-choose .m-sports-choose-item .sport-text {
  display: block;
  line-height: 1;
  margin: 0 auto;
  white-space: normal;
}
.home .m-popular {
  min-height: 4rem;
  background-image: -webkit-gradient(linear, left top, left bottom, from(#ffffff), to(#f2f3f5));
  background-image: -webkit-linear-gradient(top, #ffffff, #f2f3f5);
  background-image: linear-gradient(to bottom, #ffffff, #f2f3f5);
  background-image: -webkit-gradient(
    linear,
    left top,
    left bottom,
    from(var(--c-popular-bg-linear-color-one)),
    to(var(--c-popular-bg-linear-color-two))
  );
  background-image: -webkit-linear-gradient(
    top,
    var(--c-popular-bg-linear-color-one),
    var(--c-popular-bg-linear-color-two)
  );
  background-image: linear-gradient(
    to bottom,
    var(--c-popular-bg-linear-color-one),
    var(--c-popular-bg-linear-color-two)
  );
}
.home .m-popular .m-snap-nav {
  padding-bottom: 0.33333333rem;
}
.home .m-second-banner {
  display: block;
}
.home .m-second-banner img {
  display: block;
  max-height: 64px;
  width: 100%;
}

.home .m-sports .m-title,
.home .m-live .m-title {
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1.75rem;
  margin: 0 0.83333333rem;
}
.home .featured-match-placeholder {
  min-height: 14.58333333rem;
  position: relative;
  width: 100%;
}
</style>
