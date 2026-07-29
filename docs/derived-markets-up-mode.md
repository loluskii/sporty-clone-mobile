# Derived Markets (1UP/2UP) UI and Filtering

This document explains how derived markets (1UP/2UP today, and future derived-market families like Early Goals) are surfaced across the app, how fixtures are filtered, how the selected market is rewritten, and how to extend the system safely.

## Purpose

Derived markets are special market variants that should **not** appear as normal market tabs, but are still selectable via a **toggle row** under the base market (e.g., 1X2). When a derived mode is active:

- The market tabs still show the **base markets only** (clean list).
- Fixtures are **filtered** to only those that support that derived mode.
- The active market is **rewritten** to the derived market ID for rendering outcomes.

This is needed for 1UP/2UP and any future derived-market families (e.g., Early Goals O/U 1.5, 2.5).

## Core Concepts

### 1) Derived Market Config

Derived modes are defined by a **config map** that ties a base market ID to one or more derived market IDs.

```js
// src/composables/useUpMode.js
export const DEFAULT_DERIVED_MARKET_CONFIG = {
  1: {
    baseLabel: '1X2 Base',
    modes: [
      { key: '2up', id: 60200, label: '2UP' },
      { key: '1up', id: 60100, label: '1UP' }
    ]
  }
}
```

You can extend this config for additional derived-market families. Example:

```js
const derivedMarketConfig = {
  ...DEFAULT_DERIVED_MARKET_CONFIG,
  18: {
    baseLabel: 'O/U Base',
    modes: [
      { key: 'eg15', id: 70150, label: 'Early 1.5' },
      { key: 'eg25', id: 70250, label: 'Early 2.5' }
    ]
  }
}
```

### 2) Fixture Support (derived_market_id / derived_market_ids)

Fixtures declare whether they support derived markets using:

- `derived_market_id` or
- `derived_market_ids` (array)

Example:

```json
{
  "matchID": 61624402,
  "derived_market_id": [60200, 60100]
}
```

When a derived mode is active, only fixtures containing the corresponding derived market ID are shown.

### 3) Effective Market

The UI **keeps the base market selected** for tabs, but **renders outcomes** using an **effectiveMarket** that is rewritten to the derived market ID.

Example:

```js
// If base market is 1x2 (id=1) and upMode is "2up"
effectiveMarket = {
  ...baseMarket,
  marketID: 60200,
  marketName: "1x2 - 2UP",
  outcomes: baseMarket.outcomes
}
```

This allows the same outcome rendering components to work without special cases.

## The Composable: useUpMode

File: `src/composables/useUpMode.js`

This composable centralizes all derived‑market behavior and exposes:

**Inputs**
- `fixtures`: a ref (array or grouped object)
- `activeMarket`: a ref (current selected market object)
- `marketsGroup`: a ref (all markets list)
- `enabledSportId`: (default 1) so derived markets can be limited to football
- `derivedMarketConfig`: config map (defaults to 1UP/2UP)

**Outputs**
- `upMode`: current derived selection (`'none' | <mode key>`)
- `setUpMode(mode)`: toggle mode on/off
- `resetUpMode()`: resets to `'none'`
- `showUpToggle`: whether the toggle row should appear
- `modeOptions`: list of available modes for the active market
- `baseLabel`: label for the base button (e.g. `1X2 Base`)
- `effectiveMarket`: market object with derived market ID applied
- `filteredFixtures`: fixtures filtered by derived mode
- `sanitizeMarkets(markets)`: removes derived markets from tabs

**Behavior Rules**
- Only shows the toggle row when:
  - Active market is in the derived config, AND
  - At least one fixture supports the derived IDs for that market
- Auto‑resets derived mode when user switches to a market not in the derived config.
- Keeps base market selected when derived mode is toggled on (for stable tabs).

## Integration Points

### Highlights

**Container:** `src/components/Home/HighlightsContainer.vue`

Responsibilities:
- Fetch fixtures/markets.
- Use `useUpMode()` and pass its outputs into the view component.
- Reset mode when switching tabs or sports.

**View:** `src/components/Home/Highlights.vue`

Responsibilities:
- Render the toggle row based on props (`showUpToggle`, `modeOptions`, `baseLabel`).
- Render fixtures using `effectiveMarket`.
- Emit `set-up-mode` events back to container.

### FixtureView

File: `src/views/Sport/FixtureView.vue`

Responsibilities:
- Use `useUpMode()` for derived mode.
- Show toggle row in the market header (only when applicable).
- Use `filteredFixtures` and `effectiveMarket`.

### LiveContainer / LiveView

Files:
- `src/components/Home/LiveContainer.vue`
- `src/views/LiveView.vue`

Responsibilities:
- Use `useUpMode()` for derived mode.
- Filter fixtures before grouping/limiting.
- Keep base market tabs clean using `sanitizeMarkets`.

## How it Works (Flow Summary)

1. **Fixtures + Markets Loaded**
2. `useUpMode`:
   - checks if the current market has derived modes
   - checks if fixtures support derived IDs
3. If eligible, UI shows the toggle row.
4. User toggles derived mode:
   - `upMode` is set
   - `filteredFixtures` shows only fixtures supporting that derived ID
   - `effectiveMarket` rewrites market ID and label
5. Rendering components show outcomes using `effectiveMarket`.

## Extending to New Derived Markets

To add a new derived family:

1. **Add config** for the base market ID and derived IDs.
2. **Pass the config** into `useUpMode`.
3. Ensure the backend returns `derived_market_id(s)` for those fixtures.

This is intentionally config‑driven so UI does not need new special‑case logic.

## FAQ

### What happens if the derived market is in the markets list?
We **strip derived markets** from the tabs using `sanitizeMarkets`, so they never show as regular tabs. The only entry point is the toggle row.

### Can two derived modes be active at once?
No. Derived modes are exclusive by design. `setUpMode` toggles a single mode on/off.

### What if the base market changes?
`useUpMode` resets to `'none'` automatically when the user selects a market that isn’t in the config.

## Future: Betslip Integration

This UI layer already provides the necessary signals for betslip:

- `effectiveMarket.marketID` tells you which market ID should be sent.
- `upMode` tells you which derived family is active.
- `filteredFixtures` ensures only valid fixtures are shown when derived mode is on.

When we add betslip support:

1. Detect whether a selection is from a derived market (by market ID).
2. Ensure the payload uses the derived market ID and outcome ID.
3. If a user adds a derived selection, we can reflect that in the betslip UI (e.g., badge or label).

## Files Touched

- `src/composables/useUpMode.js`
- `src/components/Home/HighlightsContainer.vue`
- `src/components/Home/Highlights.vue`
- `src/views/Sport/FixtureView.vue`
- `src/components/Home/LiveContainer.vue`
- `src/views/LiveView.vue`

## Notes

- The current default config only includes 1UP/2UP on 1X2.
- If you add more derived families, update the config and pass it into `useUpMode`.
- Keep the market tabs clean by always using `sanitizeMarkets`.
