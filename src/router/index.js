import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore, useUtilstStore } from '../stores'
import HomeView from '@/views/HomeView.vue'
import AZView from '@/views/AZView.vue'
import FixtureView from '@/views/Sport/FixtureView.vue'
import SignInView from '@/views/SignInView.vue'
import SignUpView from '@/views/SignUpView.vue'
import BetHistoryView from '@/views/Account/BetHistoryView.vue'
import OpenBetsView from '@/views/Account/OpenBetsView.vue'
import BetDetailView from '@/views/Account/BetDetailView.vue'
import MeView from '@/views/Account/MeView.vue'
import ProfileView from '@/views/Account/ProfileView.vue'
import FixtureDetail from '@/views/Sport/FixtureDetail.vue'
import LiveFixtureDetail from '@/views/Sport/LiveFixtureDetail.vue'
import TransactionView from '@/views/Account/TransactionView.vue'
import SportsView from '@/views/SportsView.vue'
import LiveView from '@/views/LiveView.vue'
import LoadBetView from '@/views/LoadBetView.vue'
import DepositView from '@/views/Account/DepositView.vue'
import VerifyPaymentView from '@/views/Account/VerifyPaymentView.vue'
import WithDrawalView from '@/views/Account/WithDrawalView.vue'
import BonusView from '@/views/Account/BonusView.vue'
import CMSPage from '@/views/CMS.vue'
// import SupportView from '@/views/Account/SupportView.vue'
import SearchView from '@/views/SearchView.vue'
import GroupView from '@/views/Games/GroupView.vue'
import Search from '../views/Games/SearchView.vue'

import GamesView from '@/views/Games/GamesView.vue'
import PlayView from '@/views/Games/PlayView.vue'


export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  linkActiveClass: 'x-active',
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        showFooter: true,
        showMobileNavigation: true,
        showBetslipCount: true
      }
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView
    },
    // Auth Routes
    {
      path: '/sign-in',
      name: 'sign-in',
      component: SignInView
    },
    {
      path: '/sign-up',
      name: 'sign-up',
      component: SignUpView
    },

    {
      path: '/Sports/AZ_Menu',
      name: 'az_menu',
      component: AZView,
      meta: {
        showMobileNavigation: true
      }
    },
    {
      path: '/Live',
      name: 'live',
      component: LiveView,
      meta: {
        showFooter: true,
        showBetslipCount: true
      }
    },
    {
      path: '/Sports/Prematch/:sport/:categories/:tournaments',
      name: 'fixtures-by-tournaments',
      component: FixtureView,
      meta: {
        showBetslipCount: true
      }
    },
    {
      path: '/Sports/Prematch/:sport',
      name: 'fixtures-by-sports',
      component: FixtureView,
      meta: {
        showBetslipCount: true
      }
    },
    {
      path: '/Sports/Prematch/:sport/Today',
      name: 'today-fixtures',
      component: FixtureView,
      meta: {
        showBetslipCount: true
      }
    },
    {
      path: '/Sports/Prematch/:sport/:category/:category_id',
      name: 'fixtures-by-category',
      component: FixtureView,
      meta: {
        showBetslipCount: true
      }
    },
    {
      path: '/Sports/Prematch/:sport/:category',
      name: 'fixtures-by-categories',
      component: FixtureView,
      meta: {
        showBetslipCount: true
      }
    },
    {
      path: '/Sports/:sport/Prematch/:tournament_name/:event_name/:event_id',
      name: 'fixtures-detail',
      component: FixtureDetail,
      meta: {
        showBetslipCount: true
      }
    },
    {
      path: '/Sports/:sport/Live/:tournament_name/:event_name/:event_id',
      name: 'live-fixtures-detail',
      component: LiveFixtureDetail,
      meta: {
        showFooter: true,
        showBetslipCount: true
      }
    },
    {
      path: '/Sports',
      name: 'sports',
      component: SportsView
    },
    // Bet History
    {
      path: '/Bets/OpenBets',
      name: 'open-bets',
      component: OpenBetsView,
      meta: {
        showMobileNavigation: true
      }
    },
    {
      path: '/Bets/BetHistory',
      name: 'bet-history',
      component: BetHistoryView,
      meta: {
        showMobileNavigation: true
      }
    },
    {
      path: '/Bets/BetHistory/:bet_id/Detail',
      name: 'bet-detail',
      component: BetDetailView,
      meta: {
        showMobileNavigation: true
      }
    },
    // User Account
    {
      path: '/Account/Me',
      name: 'account-me',
      component: MeView,
      meta: {
        showMobileNavigation: true,
        showFooter: true
      }
    },
    {
      path: '/Account/Me/Profile',
      name: 'account-profile',
      component: ProfileView,
      meta: {
        showFooter: true
      }
    },
    {
      path: '/Account/Transactions',
      name: 'account-transactions',
      component: TransactionView,
      meta: {
        showMobileNavigation: true
      }
    },
    {
      path: '/Account/Deposit',
      name: 'account-deposit',
      component: DepositView
    },
    {
      path: '/payment-verification/:method',
      name: 'verify-deposit',
      component: VerifyPaymentView
    },
    {
      path: '/Account/Withdraw',
      name: 'account-withdraw',
      component: WithDrawalView
    },
    {
      path: '/Account/Bonus',
      name: 'account-bonus',
      component: BonusView
    },
    // Casino
    {
      path: '/Games',
      name: 'casino-games',
      component: GamesView,
      meta: {
        showMobileNavigation: true
      }
    },
    {
      path: '/Games/Search',
      name: 'casino-search',
      component: Search,
      meta: {
        showMobileNavigation: true
      }
    },

    {
      path: '/Games/Providers',
      name: 'casino-providers',
      component: GroupView,
      children: [
        {
          path: '/:provider',
          name: 'games-by-provider',
          component: GroupView,
        },
      ],
      meta: {
        showMobileNavigation: false
      },
    },
    {
      path: '/Games/Category',
      name: 'casino-category',
      component: GroupView,
      children: [
        {
          path: '/:category',
          name: 'games-by-category',
          component: GroupView,
        },
      ],
      meta: {
        showMobileNavigation: true
      }
    },

    {
      path: '/Games/:game_name/:game_id/Play',
      name: 'game-play',
      component: PlayView
    },
    // Load Bet
    {
      path: '/LoadBet',
      name: 'load-bet',
      component: LoadBetView
    },
    {
      path: '/CMS/:page',
      name: 'cms-page',
      component: CMSPage
    },
    // Catch-all route to redirect to home
    {
      path: '/:pathMatch(.*)*', // Catch-all pattern
      redirect: '/'
    }
  ]
})

// Navigation guard to handle footer visibility
router.beforeEach((to, from, next) => {
  const utilStore = useUtilstStore()
  // Check if the meta field is set and decide whether to show the footer
  const showFooter = to.meta.showFooter
  const showMobileNavigation = to.meta.showMobileNavigation
  const showBetslipCount = to.meta.showBetslipCount

  utilStore.showBetslipCount = showBetslipCount ? showBetslipCount : false
  utilStore.showMobileNavigation = showMobileNavigation ? showMobileNavigation : false
  utilStore.showFooter = showFooter ? showFooter : false

  const publicPages = [
    'account-withdraw',
    'account-me',
    'account-deposit',
    'account-transactions',
    'bet-detail'
  ]
  const authRequired = publicPages.includes(to.name)
  const authStore = useAuthStore()

  if (authRequired && !authStore.isAuthenticated) {
    // authStore.returnUrl = to.fullPath;
  }
  next()
})

export default router
