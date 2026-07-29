# Betslip EarlyWin Refactor Pass

This document explains the betslip refactor work committed in this pass.

It describes the current committed state only. It does not describe later experiments that were reverted.

## Scope

This pass changed the betslip from a mostly global `1UP/2UP` implementation to a per-selection model with a bulk helper at the stake area.

The main goals were:

- keep `1UP/2UP` state on each selection
- support mixed slips with supported and unsupported selections
- allow row-level toggling between `base`, `1up`, and `2up`
- provide a bulk umbrella control in the stake area
- preserve derived-mode state across rebuild and restore flows

## Current Behavior

- A supported selection shows row-level `1UP` and `2UP` controls by default.
- Tapping the active row mode again returns that row to `base`.
- Unsupported selections stay in the slip.
- Unsupported selections do not show row controls.
- Unsupported selections only show the `1UP / 2UP not supported` message when the umbrella control is active.
- The stake area exposes one umbrella helper under `Insure`.
- The umbrella can apply the chosen mode to supported selections and return all actionable selections to `base`.

## Selection Model

The main change is that a selection now stores both its base identity and its current derived-mode state.

Important fields introduced or normalized in the betslip payload:

- `selectionId`
  Stable identity for the underlying pick. This is based on the base market.
- `currentSelectionId`
  Identity for the currently active market state.
- `baseMarketId`
  The non-derived market id for the pick.
- `baseMarketName`
  The non-derived market label.
- `baseSpecifier`
  The base specifier used when rebuilding the active market identity.
- `earlyWinMode`
  One of `base`, `1up`, or `2up`.
- `supportedDerivedMarketIds`
  The supported derived market ids carried on the selection.
- `supportedEarlyWinModes`
  The supported derived modes carried on the selection.
- `supportsEarlyWin`
  Whether the selection supports row-level `1UP/2UP` controls.

This split between base identity and current identity is what allows a single row to switch mode in place instead of duplicating itself in the betslip.

## Shared Helper Layer

`src/helpers/early-win.js` was added as the shared source of truth for early-win mode behavior.

It centralizes:

- base market to derived market mapping
- derived mode normalization
- market id to mode lookup
- base market id extraction from derived market ids
- market label formatting such as `1X2 2UP`
- supported mode derivation from carried derived market ids
- preferred bulk-mode fallback for selections that do not support both modes

`src/helpers/index.js` now re-exports this helper layer.

## Betslip Store Changes

Most of the behavior moved into `src/stores/coupon.store.js`.

### New store state

- `isEarlyWinLoading`
  Shared loading state for row and bulk mode switching.
- `earlyWinBulkMode`
  The currently selected bulk mode, defaulting to `2up`.

### New store responsibilities

- normalize early-win state whenever a selection enters the slip
- keep base and current market identity in sync
- switch a row between `base`, `1up`, and `2up`
- rebuild totals and winnings after mode changes
- preserve derived-mode state during rebuild flows

### New store actions

- `normalizeSelectionEarlyWinState`
- `buildCurrentSelectionId`
- `applySelectionPayloadToExistingSelection`
- `updateSelectionModeState`
- `refreshCouponAfterSelectionMutation`
- `toggleCouponSelection`
- `applyEarlyWinModeToSelections`

### Why `toggleCouponSelection` matters

Before this pass, many add/remove paths treated a derived selection as unrelated to its base selection.

After this pass:

- the store first resolves the stable base identity
- clicking the exact same current market removes the row
- clicking another supported market for the same underlying pick updates the existing row instead of adding a duplicate

## Row UI Changes

`src/components/Betslip/BetListEvent.vue` now renders per-selection pills for `1UP` and `2UP`.

Behavior:

- pills appear for supported selections
- the active mode is highlighted
- a disabled mode is non-clickable
- tapping the active mode returns that row to `base`
- unsupported text appears only while the umbrella mode is active

This replaced the earlier single `2UP` checkbox row behavior.

## Stake Area Changes

`src/components/Betslip/BetListStake.vue` now exposes the umbrella helper under `Insure`.

Behavior:

- the primary row acts as the bulk apply/remove switch
- the current bulk mode is shown in the title, for example `EarlyWin - 1UP`
- a dropdown next to the main row switches the active bulk mode
- placeholders for `Cut 1` and `Flex` were added for future expansion
- unsupported selection messaging is shown under the block only when the umbrella is active

This area is a bulk helper, not the source of truth. The source of truth remains the per-selection mode on each row.

## Composable Changes

`src/composables/useBetslipUpMode.js` was rewritten around the store-backed per-selection model.

It now exposes:

- `bulkMode`
- `isLoadingUpMode`
- `hasDerivedMarkets`
- `hasUnsupportedSelections`
- `eligibleSelectionsCount`
- `unsupportedSelectionsCount`
- `isBulkEarlyWinEnabled`
- `toggleBulkUpMode`
- `setBulkUpMode`
- `setSelectionUpMode`

This composable is the bridge between the betslip UI and the store logic.

`src/composables/useUpMode.js` was also adjusted to reuse the shared early-win config instead of keeping a separate inline config copy.

## Entry Point Changes

The main market-click entry points were updated to call `couponStore.toggleCouponSelection(data)` instead of manually doing `exists ? remove : add`.

Files updated for this:

- `src/views/Sport/FixtureDetail.vue`
- `src/views/Sport/LiveFixtureDetail.vue`
- `src/components/Prematch/PrematchFixture.vue`
- `src/components/Live/LiveFixture.vue`
- `src/components/Live/LiveHighlightsFixture.vue`
- `src/components/Home/FeaturedMatchCard.vue`

This is required so row switching, add/remove behavior, and stable selection identity all go through the same logic.

## Validation and Matching Changes

Selection validation now matches by:

- `matchId`
- `marketId`
- `outcomeId`
- `specifier`

This change was applied in:

- `src/App.vue`
- `src/stores/coupon.store.js`

This avoids mismatching different markets or specifier variants that happen to share the same match and outcome ids.

## Restore and Rebuild Changes

Rebuild flows now preserve derived metadata when reconstructing the betslip.

`buildCouponPayloadFromLoadedSelection` now carries `derived_market_ids` forward so restored selections can retain their derived support metadata.

This matters for:

- rebet
- load by code
- shared selections
- other flows that rebuild selections into the coupon store

## SIM Mode

Derived market ids `60100` and `60200` were added to the SIM whitelist so the experience stays aligned between real and sim mode.

## Files Included In This Pass

- `src/App.vue`
- `src/components/Betslip/BetListEvent.vue`
- `src/components/Betslip/BetListStake.vue`
- `src/components/Home/FeaturedMatchCard.vue`
- `src/components/Live/LiveFixture.vue`
- `src/components/Live/LiveHighlightsFixture.vue`
- `src/components/Prematch/PrematchFixture.vue`
- `src/composables/useBetslipUpMode.js`
- `src/composables/useUpMode.js`
- `src/helpers/early-win.js`
- `src/helpers/index.js`
- `src/helpers/utils.js`
- `src/stores/coupon.store.js`
- `src/views/Sport/FixtureDetail.vue`
- `src/views/Sport/LiveFixtureDetail.vue`

## Explicitly Not Included

These were not included in this pass commit:

- `src/composables/useMqtt.js`
- `sportybet-betslip.js`

## Known Open Issue

The remaining unfinished area is local fixture-driven derived switching.

The intended direction is:

- if a supported fixture already carries sibling `1X2`, `1UP`, and `2UP` markets locally, row switching should use those local quotes directly
- unsupported fixtures should simply not be treated as derived-capable

That direction is not documented here as completed behavior because it was not part of the final committed state for this pass.
