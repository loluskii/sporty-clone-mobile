# AGENTS.md

Guidance for AI agents working in this repository.

## Project Overview

**sporty-clone-mobile** is a Vue 3 sports betting mobile web app — a "SportyBet" clone targeting the Nigerian market (currency NGN, timezone Africa/Lagos). It supports pre-match betting, live betting, casino games, and lotto, with real-time odds via MQTT.

## Stack

- **Framework**: Vue 3.3 (Options + Composition API)
- **Build tool**: Vite
- **Language**: JavaScript (no TypeScript)
- **Package manager**: npm
- **State**: Pinia v2 with `pinia-plugin-persistedstate` (localStorage)
- **Routing**: Vue Router v4 (lazy-loaded routes with preloading)
- **Data fetching**: Vue Query + native `fetch` wrapped with AES-CBC encryption
- **Realtime**: MQTT over WebSocket (wss://emqx.prod.sportsbookengine.com) via `useMqtt` composable
- **Casino**: Xpress Gaming integration
- **Service Worker**: Registered for offline support

## Directory Layout

```
src/
├── views/           # Page-level components (Home, Sport, Live, Casino, Auth, Account, …)
├── components/      # Feature-grouped reusable components
│   ├── Betslip/         # Bet placement workflow (~20 components)
│   ├── Bets/            # Bet history & display
│   ├── Casino/          # Casino games UI
│   ├── Live/            # Live betting UI
│   ├── Prematch/        # Pre-match betting UI
│   ├── Loaders/         # Loading skeletons
│   ├── Withdrawal/      # Withdrawal flow
│   └── Search/          # Search UI
├── stores/          # Pinia stores
│   ├── coupon.store.js  # Betslip selections, bonuses, bet placement
│   ├── user.store.js    # User profile
│   ├── auth.store.js    # Authentication
│   └── utils.store.js   # UI state & market selection
├── router/          # Vue Router configuration
├── helpers/         # Business logic (bet calculations, encryption, queries.js)
├── composables/     # Vue 3 composables (e.g., useMqtt)
└── assets/          # Fonts, images, CSS
```

## Betslip (Active Development Area)

`src/components/Betslip/` holds the bet placement workflow. Key files:

- [BetListStake.vue](src/components/Betslip/BetListStake.vue) — Stake input with virtual keyboard, balance validation, "Insure" toggle, deposit link
- [Betlist.vue](src/components/Betslip/Betlist.vue) — Main betslip container
- [BetListEvent.vue](src/components/Betslip/BetListEvent.vue) — Individual bet event display
- [BetSlipHeader.vue](src/components/Betslip/BetSlipHeader.vue), [BetslipTabs.vue](src/components/Betslip/BetslipTabs.vue), [BetslipModeToggle.vue](src/components/Betslip/BetslipModeToggle.vue) — UI chrome
- [Simulation.vue](src/components/Betslip/Simulation.vue) — Animated bet preview (9s match progression, 250ms updates)
- [SystemBet.vue](src/components/Betslip/SystemBet.vue), [SuccessBet.vue](src/components/Betslip/SuccessBet.vue) — Bet confirmation states
- [BetslipBonusBar.vue](src/components/Betslip/BetslipBonusBar.vue), [BonusBar.vue](src/components/Betslip/BonusBar.vue) — Acca / bonus promotions
- [StakeInput.vue](src/components/Betslip/StakeInput.vue), [BetlistStakeKeyboard.vue](src/components/Betslip/BetlistStakeKeyboard.vue) — Numeric input
- [BetlistBookingCode.vue](src/components/Betslip/BetlistBookingCode.vue), [BookBetModal.vue](src/components/Betslip/BookBetModal.vue) — Bet reference codes
- [BetSettings.vue](src/components/Betslip/BetSettings.vue) — Advanced bet options (acca bonus, flex, cut-one)

Recent commit history shows ongoing redesign: betslip preview refinement, cut-one flow, features-config-driven controls, replacement of `bookBet2` with `placeBet2`.

## API & Data Layer

- **Wrapper**: [src/helpers/fetch-wrapper.js](src/helpers/fetch-wrapper.js) — AES-CBC with SHA256-derived keys
- **Queries**: [src/helpers/queries.js](src/helpers/queries.js) — `fetchGlobalVars`, `fetchBanners`, etc.
- **Env-driven base URLs**:
  - `VITE_NEW_BASE_API` — https://stag.sportsbookengine.com/api/v2
  - `VITE_NEW_FIXTURES_API` — fixture data
  - `VITE_BASE_URL` — legacy endpoints
- **Feature flags via env**: acca bonus, flex, cut-one, fast-add stake amounts, bet limits (min 100, max 41.6M NGN)

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server with `--host` (network accessible) |
| `npm run build` | Generate version info + Vite production build |
| `npm run test:unit` | Run Vitest |
| `npm run lint` | ESLint with auto-fix |
| `npm run format` | Prettier |
| `npm run analyze` | Bundle analyzer |

## Conventions & Gotchas

- **Encryption is mandatory** on API requests — go through `fetch-wrapper.js`, don't call `fetch` directly for backend calls.
- **Stores persist to localStorage** via `pinia-plugin-persistedstate` — be deliberate about what you add to state (it survives reloads).
- **Routes are lazy-loaded** and selectively preloaded; new pages should follow the same pattern in [src/router/](src/router/).
- **Locale assumptions**: amounts are NGN, times in Africa/Lagos. Don't hard-code other locales.
- **MQTT topics** drive live odds — touching live-betting code without understanding the MQTT subscription lifecycle will cause stale-odds bugs.
- **Betslip state lives in `coupon.store.js`** — UI components should mutate via store actions, not local state.

## Branch & Workflow Notes

- Default working branch observed: `gcp-staging`. PRs typically target `main`.
- Betslip is under active redesign — check recent commits before refactoring shared betslip components.
