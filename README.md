# Sportybet Mobile Template

A mobile application for sports betting with real-time odds and simulation features.

## Features

### Real-time Betting Features

#### 1. Live Odds Updates
- Real-time odds changes for live matches
- Visual indicators for odds movements
- Automatic updates through MQTT
- Bet stop notifications

#### 2. Bet Simulation
The simulation feature provides a visual representation of match outcomes for placed bets, allowing users to see how their bets would play out in real-time.

##### Components

1. **Simulation.vue**
   - Main simulation component that orchestrates the entire simulation process
   - Manages the simulation timer and state
   - Coordinates between header, events, and controls
   - Handles simulation data processing and display

2. **SimulationHeader.vue**
   - Displays simulation progress and results
   - Shows timer during simulation
   - Displays win/loss message with amount after simulation
   - Includes celebration animation for winning bets

3. **SimulationEvent.vue**
   - Represents individual bet events in the simulation
   - Shows match details including:
     - Team names
     - Live score updates
     - Final score and half-time score
     - Bet details (market and odds)
   - Displays win/loss status icons

4. **SimulationControls.vue**
   - Provides user interaction controls
   - "Skip to Results" button during simulation
   - "OK" button to close after results

##### Technical Details

- **Simulation Duration**: 9 seconds
- **Update Interval**: 250ms
- **Initial Delay**: 1000ms
- **Data Processing**:
  - Parses simulation results from JSON
  - Processes goal events and scores
  - Calculates current scores based on simulation time
  - Handles win/loss status for each bet

##### State Management

- Uses Vue's reactive system for state management
- Tracks simulation progress with `currentTime`
- Manages simulation state with `timerStarted` and `timerEnded`
- Processes simulation data through computed properties

##### Styling

- Responsive design with mobile-first approach
- Uses CSS variables for theming
- Consistent typography with Roboto font family
- Visual feedback for win/loss states
- Celebration animation for winning bets

##### Usage Example

```vue
<template>
  <Simulation
    :simulation-results="simulationResults"
    @exit="handleSimulationExit"
  />
</template>

<script setup>
import Simulation from '@/components/Betslip/Simulation.vue';

const handleSimulationExit = () => {
  // Handle simulation exit
};
</script>
```

##### Props

- `simulationResults` (Object, required)
  - Contains simulation data including events, scores, and status

##### Events

- `exit`
  - Emitted when user wants to exit the simulation
  - Can be used to close the simulation modal or return to previous screen

#### 3. Bet Slip Management
- Add/remove bets from slip
- Calculate potential winnings
- Validate bet combinations
- Handle bet limits and restrictions

#### 4. Match Details
- Live match statistics
- Team information
- Market availability
- Historical data

### Technical Stack

- Vue 3
- Vuex/Pinia for state management
- MQTT for real-time updates
- Roboto font family
- CSS Variables for theming

## Getting Started

1. Clone the repository
2. Install dependencies
3. Run the development server
4. Navigate to the betting section
5. Place a bet to see the simulation in action

## Contributing

Feel free to submit issues and enhancement requests.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
