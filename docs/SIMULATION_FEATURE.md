# Simulation Feature

This document describes the betslip simulation feature as it exists in the app today.

## What Simulation Is

Simulation is a betslip mode that lets the user place a bet as a simulated run instead of a normal real-money bet.

The user can switch between:

- `REAL`
- `SIM`

When `SIM` is active, the betslip behaves differently at placement time and after placement:

- the bet is submitted in simulation mode
- the app opens a match-by-match simulation playback
- the user watches the simulated outcome play out
- the result can end in a simulated win or loss

## Where It Lives

The main simulation flow is inside the betslip experience:

- `BetslipModeToggle` switches between `REAL` and `SIM`
- `Betlist` starts simulation after a successful placement in SIM mode
- `Simulation` renders the playback experience
- `SimulationEvent` renders each selection in the simulation
- `SimulationPitch` renders the animated pitch/GIF scene
- `SimulationControls` handles exit/skip behavior

## User Flow

1. The user switches the betslip to `SIM`.
2. The user adds eligible selections.
3. The user places the bet.
4. Instead of a normal success card, the app enters simulation mode.
5. The simulation runs for a fixed timeline.
6. At the end, the app shows the final result:
   - win: a win modal appears
   - loss: the simulation finishes without a win modal
7. The user exits the simulation using the controls.

## Market Support

Simulation does not accept every market.

The app checks selections against a SIM allowlist before simulation starts.

If the betslip contains unsupported markets, the app blocks simulation and shows an error telling the user to exit SIM mode.

## Playback Behavior

The simulation uses a fixed internal timeline:

- kickoff/start sequence
- first-half goal/no-goal clips
- halftime
- second-half goal/no-goal clips
- full-time result

Each selection is rendered as a simulation row, and the first selection also drives the shared pitch view when multiple selections are present.

## Technical Flow

The SIM flow is driven by the bet placement response.

When the user places a bet in SIM mode:

1. `Betlist` calls `couponStore.placeBet(...)`.
2. The store builds the payload in the normal bet format, but sets `isBooking: 2` when `mode === 'sim'`.
3. The API responds with a standard success object.
4. If the response status is `200`, `Betlist` sets `couponStore.isSimulating = true`.
5. `simulationResults = res.data` is passed into the simulation components.
6. The simulation starts animating from time `0`.

The simulation is not a separate endpoint flow. It is a presentation layer that starts after a successful SIM placement.

### What the user sees

- a timer/progress display at the top
- each selected event as a simulation card
- a pitch animation for the current fixture
- score changes over time
- a final state when the timer ends

## Exit Behavior

The controls support two outcomes:

- `Skip to Results`
- `OK`

While the simulation is running, `Skip to Results` fast-forwards the timeline.

When the timer ends, the button changes to `OK` and closes the simulation flow.

## Win Handling

When the simulation ends:

- if the simulated bet won, the app shows the global win modal
- if the simulated bet lost, the app only ends the simulation playback

The win modal is shown once per simulation run.

### Example Placement Payload

The payload sent by the betslip is built from the current coupon state. In SIM mode it looks like a normal bet placement payload with `isBooking: 2`.

```json
{
  "bets": [
    {
      "betType": "multi",
      "selections": [
        {
          "marketId": 1,
          "matchId": 66456904,
          "outcomeId": "1",
          "specifier": ""
        }
      ],
      "stake": 100,
      "totalStake": 100
    }
  ],
  "bonusId": 0,
  "isBooking": 2,
  "source": "mobile",
  "useBonus": false
}
```

### Example Placement Response

The placement endpoint returns a normal wrapper object. The simulation uses `res.data` from that response.

```json
{
  "status_code": 200,
  "status_description": "success",
  "data": {
    "bets": [
      {
        "amountWon": 500,
        "possibleWin": 500,
        "statusCode": 1
      }
    ],
    "events": [
      {
        "match_id": 66456904,
        "home_goals": 2,
        "away_goals": 1,
        "final_score": "2-1",
        "timeline": [
          { "type": "goal", "minute": 12, "team": "home" },
          { "type": "goal", "minute": 54, "team": "away" },
          { "type": "goal", "minute": 77, "team": "home" }
        ]
      }
    ],
    "selections": [
      {
        "matchId": 66456904,
        "marketId": 1,
        "outcomeId": "1",
        "won": 1
      }
    ]
  }
}
```

## Image Switching

`SimulationPitch.vue` is the part that swaps the GIFs.

The component keeps a computed `currentStage` based on `props.currentTime`.

The stage machine is:

1. `start`
2. `h1_home_clip`
3. `h1_home_banner`
4. `h1_away_clip`
5. `h1_away_banner`
6. `halftime_intro`
7. `halftime_swap`
8. `h2_home_clip`
9. `h2_home_banner`
10. `h2_away_clip`
11. `h2_away_banner`
12. `fulltime`

Each stage selects a GIF from the local map:

- `start` -> `SIM_START.gif`
- home first half win/loss -> `Home_Goal_H1.gif` or `Home_NoGoal_H1.gif`
- away first half win/loss -> `Away_Goal_H1.gif` or `Away_NoGoal_H1.gif`
- home second half win/loss -> `Home_Goal_H2.gif` or `Home_NoGoal_H2.gif`
- away second half win/loss -> `Away_Goal_H2.gif` or `Away_NoGoal_H2.gif`

The component does not hardcode animation frames. It swaps entire GIF assets when the stage changes.

### What drives the choice

For each half and team, the component checks the goal timeline:

- if the team scored in that half, it uses the `goal` GIF
- if the team did not score in that half, it uses the `noGoal` GIF

That means the visible image is a function of:

- current simulation time
- team being evaluated
- half being evaluated
- whether that team has at least one goal in that half

### Overlays

The pitch also renders overlay banners on top of the GIF:

- match start banner
- goal / no-goal result banners
- halftime banner
- full-time result banner

These overlays are staged independently from the GIF selection and are controlled by timers and stage flags.

## Supported Data

The simulation reads a server response that can contain:

- event timelines
- goal events
- final score data
- selection results
- bet summary data

For the result cards, the component also looks for selection-level result fields like:

- `gameID`
- `matchID`
- `matchId`
- `marketID`
- `outcomeID`
- `won`

The app is defensive about the response shape because the backend may return either:

- a `data` wrapper
- a direct object
- nested arrays for events or selections

## Important Notes

- SIM mode is still a betslip mode, not a separate app.
- The same betslip state is used; the difference is the placement and playback experience.
- Market support is intentionally restricted so the simulation only runs on allowed markets.
- The simulation timeline is deterministic and browser-driven.

## Design Notes

The current experience is intentionally light-weight:

- the simulation playback is centered on the current fixture(s)
- the pitch is animated with prebuilt GIFs
- result and win handling are global so they overlay the betslip cleanly

## Related Files

- [Betlist.vue](/Users/mac/Documents/GitHub/sporty-clone-mobile/src/components/Betslip/Betlist.vue)
- [Simulation.vue](/Users/mac/Documents/GitHub/sporty-clone-mobile/src/components/Betslip/Simulation.vue)
- [SimulationEvent.vue](/Users/mac/Documents/GitHub/sporty-clone-mobile/src/components/Betslip/SimulationEvent.vue)
- [SimulationPitch.vue](/Users/mac/Documents/GitHub/sporty-clone-mobile/src/components/Betslip/SimulationPitch.vue)
- [SimulationControls.vue](/Users/mac/Documents/GitHub/sporty-clone-mobile/src/components/Betslip/SimulationControls.vue)
- [BetslipModeToggle.vue](/Users/mac/Documents/GitHub/sporty-clone-mobile/src/components/Betslip/BetslipModeToggle.vue)
- [constants.js](/Users/mac/Documents/GitHub/sporty-clone-mobile/src/helpers/constants.js)
