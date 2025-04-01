<template lang="">
  <div data-op="label-event-live" class="m-event-live x-live-row">
    <div class="m-event-meta">
      <span class="m-event-time">{{ gameData.eventTime }}</span>
      <span class="match-status">{{
        gameData.matchStatus == '1st half'
          ? 'H1'
          : gameData.matchStatus == '2nd half'
          ? 'H2'
          : gameData.matchStatus
      }}</span>
      <!-- <span class="m-league-name">{{ gameData.categoryName }} - {{ gameData.tournament }}</span> -->
      <div class="live-marker" data-cms-key="live">Live</div>
    </div>
    <div class="x-table-row x-live-table">
      <div
        @click="
          $router.push({
            name: 'live-fixtures-detail',
            params: {
              sport: slugify(gameData.sportName),
              tournament_name: slugify(gameData.tournament),
              event_name: slugify(gameData.name),
              event_id: gameData.matchID
            }
          })
        "
        class="x-table-cell m-info-cell"
      >
        <div class="team">{{ gameData.homeTeam }}</div>
        <div class="team">{{ gameData.awayTeam }}</div>
      </div>
      <div class="x-table-cell score">
        <div class="set-score">{{ scores.homeScore }}</div>
        <div class="set-score">{{ scores.awayScore }}</div>
      </div>

      <div class="x-table-cell m-market-cell">
        <div class="m-market m-event-market-default">
          <template v-if="outcomes && outcomes.length">
            <div
              v-if="activeMarket.specifier !== ''"
              @click="toggleList"
              class="m-outcome m-event-outcome-default specifiers-select"
            >
              <div tabindex="0" class="grid-specifier-select">
                <div class="grid-specifier-select-label">{{ activeSpecifier }}</div>
                <div class="grid-specifier-select-icon">
                  <em class="icon">^</em>
                </div>
              </div>
            </div>
            <div
              class="af-select-list m-event-specifiers-order"
              v-if="specifierOpen"
              :class="'af-select-list-' + gameData.matchID"
              style="width: 71px; opacity: 1; position: absolute; top: 37px; left: 0"
            >
              <span
                class="af-select-item"
                @click="setActiveSpecifier(item)"
                v-for="(item, i) in getSpecifiers"
                :key="i"
                >{{ item.value }}</span
              >
            </div>
            <LiveOdds
              v-for="(odd, index) in uniqueOutcomes(outcomes)"
              @click="addToBetslip(gameData, odd)"
              :selectionClass="
                isSelected(
                  createID(
                    gameData.gameID,
                    gameData.matchID,
                    odd.outcomeName,
                    odd.oddID,
                    gameData.name
                  ),
                  couponStore.coupon
                )
                  ? 'm-outcome--checked'
                  : ''
              "
              :key="index"
              :odds="odd"
            ></LiveOdds>
          </template>
          <EmptyOdds v-for="(odd, index) in activeMarket.outcomes" :key="index" v-else></EmptyOdds>
        </div>
      </div>
    </div>
    <div class="m-event-footer">
      <div class="m-market-size">+{{ gameData.activeMarkets }}&gt;</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import LiveOdds from './LiveOdds.vue'
import EmptyOdds from '@/components/EmptyOdds.vue'
import { sortArr, createID, isSelected, slugify } from '@/helpers'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '../../helpers'
import { useMqttService } from '@/composables/useMqtt'

// Import MQTT service
const { subscribe } = useMqttService()

const couponStore = useCouponStore()

const props = defineProps({
  gameData: Object,
  activeMarket: Object
})

const scores = ref({
  homeScore: props.gameData?.homeScore || 0,
  awayScore: props.gameData?.awayScore || 0
})
const outcomes = ref([])

// Keep track of updated outcomes
const updatedOutcomes = ref({})

const activeSpecifier = ref()
const specifierOpen = ref(false)

const updatePending = ref(false)

const getOdds = () => {
  if (props.activeMarket && props.gameData.activeMarkets > 0) {
    if (props.gameData.outcomes) {
      // Find and return the odds based on marketID and outcomeID
      const odds = props.gameData.outcomes
      let filtered = odds.filter((item) => item.marketID == props.activeMarket.marketID)
      let uniqueFiltered = uniqueOutcomes(filtered)
      
      if (props.activeMarket.specifier && props.activeMarket.specifier !== '') {
        let defaultSpecifier = uniqueFiltered[0]?.specifier
        if (defaultSpecifier) {
          uniqueFiltered = uniqueFiltered.filter((item) => item.specifier === defaultSpecifier)
          activeSpecifier.value = defaultSpecifier.split('=')[1]
        }
      }
      
      // Apply any updates we've received from MQTT
      uniqueFiltered = uniqueFiltered.map(outcome => {
        const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier}`
        if (updatedOutcomes.value[key]) {
          return {
            ...outcome,
            odds: updatedOutcomes.value[key].odds,
            active: updatedOutcomes.value[key].active
          }
        }
        return outcome
      })
      
      if (uniqueFiltered.length) {
        outcomes.value = sortArr(uniqueFiltered, 'outcomeID')
      } else {
        outcomes.value = []
      }
    }
  }
}

const uniqueOutcomes = (outcomes) => {
  let x = outcomes.filter(
    (outcome, index, self) => index === self.findIndex((o) => o.outcomeID === outcome.outcomeID && o.specifier == outcome.specifier)
  )
  return x
}

watch(
  [() => props.activeMarket, () => props.gameData.outcomes],
  () => {
    getOdds()
  },
  { immediate: true }
)

function addToBetslip(event, odd) {
  if (odd.odds <= 1) return
  const id = createID(event.gameID, event.matchID, odd.outcomeName, odd.oddID, event.name)
  let marketId = parseInt(odd.marketID)
  if(couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)){
    emitter.emit('showErrorMessage', 'This market is not supported in simulation mode. Exit Simulation mode to add to betslip')
    return;
  }
  const data = {
    fixture: event,
    market_name: props.activeMarket.marketName,
    market_id: odd.marketID,
    ele_id: id,
    outcome: odd,
    odds: odd.odds,
    odd_id: odd.oddID,
    odd_name: odd.outcomeName,
    type: 'live',
    event_id: event.gameID,
    specifier: props.activeMarket.specifier
  }

  const existsInBetslip = isSelected(id, couponStore.coupon)
  return existsInBetslip ? couponStore.removeSelection(id) : couponStore.addToCoupon(data)
}

// Function to check betslip when we get new data from props
function checkBetslipOnRefresh() {
  console.log(`⚙️ Component: Checking betslip on refresh for match ID ${props.gameData.matchID}`)
  
  // Find if any selection in the betslip matches this event
  const selections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(props.gameData.matchID)
  )
  
  if (selections.length > 0) {
    console.log(`⚙️ Component: Found ${selections.length} selections in betslip for match ID ${props.gameData.matchID}`)
    
    // Process each matching selection
    selections.forEach(selection => {
      // Find the updated odds for this selection
      const marketId = parseInt(selection.marketId)
      const outcomeId = selection.outcomeId || selection.oddId
      const specifier = selection.specifier || ''
      
      // Find the outcome in the gameData
      if (props.gameData.outcomes) {
        const outcome = props.gameData.outcomes.find(
          (o) => o.marketID === marketId && 
                String(o.outcomeID) === String(outcomeId) && 
                o.specifier === specifier
        )
        
        if (outcome && outcome.odds !== selection.odds) {
          console.log(`⚙️ Component: Updating odds on refresh from ${selection.odds} to ${outcome.odds}`)
          
          // Update the selection with the new odds
          selection.odds = outcome.odds
          selection.changed = true
          
          // Force a reactivity update by updating winnings
          couponStore.updateWinnings({
            stake: couponStore.coupon.totalStake,
            id: "all",
          })
          
          // Reset the changed flag after 5 seconds
          setTimeout(() => {
            selection.changed = false
            
            // Force a reactivity update by updating winnings
            couponStore.updateWinnings({
              stake: couponStore.coupon.totalStake,
              id: "all",
            })
          }, 5000)
        }
      } else {
        // If no gameData outcomes, suspend the selection
        console.log(`⚙️ Component: No outcomes found for selection, suspending it`)
        selection.suspended = true
        selection.unavailable = true
        
        // Force a reactivity update
        couponStore.updateWinnings({
          stake: couponStore.coupon.totalStake,
          id: "all",
        })
      }
    })
  }
}

// Function to handle odds changes
function handleOddsChange(data) {
  if (!data || !data.markets) return;
  
  // First, verify this update is for the correct match
  const matchId = props.gameData.matchID;
  const dataMatchId = data.event_id || data.match_id;
  
  // If the data doesn't match our event, ignore it
  if (dataMatchId && String(dataMatchId) !== String(matchId)) {
    return;
  }
  
  // Use requestAnimationFrame for better performance
  if (!updatePending.value) {
    updatePending.value = true;
    
    requestAnimationFrame(() => {
      // Update our tracking object with the new odds
      const markets = data.markets || [];
      
      if (markets.length > 0) {
        // Create a new object for updatedOutcomes to avoid mutation during render
        const updatedOutcomesCopy = {...updatedOutcomes.value};
        
        // Update tracking object
        markets.forEach(market => {
          if (market.outcomes) {
            market.outcomes.forEach(outcome => {
              const key = `${market.id}-${outcome.id}-${market.specifiers || ''}`;
              updatedOutcomesCopy[key] = {
                odds: outcome.odds,
                active: outcome.active ? 1 : 0,
                timestamp: Date.now()
              };
            });
          }
        });
        
        // Update the ref after all changes are prepared
        updatedOutcomes.value = updatedOutcomesCopy;
        
        // Update displayed outcomes if needed
        if (outcomes.value.length > 0) {
          outcomes.value = outcomes.value.map(outcome => {
            const market = markets.find(
              m => m.id === outcome.marketID && (m.specifiers || '') === (outcome.specifier || '')
            );
            
            if (market && market.outcomes) {
              const newOutcome = market.outcomes.find(
                o => String(o.id) === String(outcome.outcomeID)
              );
              
              if (newOutcome) {
                return {
                  ...outcome,
                  odds: newOutcome.odds,
                  active: newOutcome.active ? 1 : 0
                };
              }
            }
            
            return outcome;
          });
        }
        
        // After updating component state, synchronize with betslip
        synchronizeBetslipWithComponent();
      }
      
      updatePending.value = false;
    });
  }
}

// Function to handle bet stop
function handleBetStop(data) {
  // First, verify this update is for the correct match
  const matchId = props.gameData.matchID;
  const dataMatchId = data.event_id || data.match_id;
  
  // If the data doesn't match our event, ignore it
  if (dataMatchId && String(dataMatchId) !== String(matchId)) {
    console.log(`📊 MQTT: Ignoring bet stop for match ID ${dataMatchId}, our match ID is ${matchId}`);
    return;
  }
  
  console.log(`⚠️ BET STOP: Processing bet stop for match ID ${matchId}`);
  
  // Immediately suspend all outcomes in the component
  outcomes.value = outcomes.value.map(outcome => ({
    ...outcome,
    odds: 0,
    active: 0
  }));
  
  // Update betslip selections for this match
  const selections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(matchId)
  );
  
  if (selections.length > 0) {
    console.log(`⚠️ BET STOP: Suspending ${selections.length} selections in betslip for match ID ${matchId}`);
    
    // Process each matching selection
    selections.forEach(selection => {
      // Suspend the selection
      selection.suspended = true;
      selection.unavailable = true;
      selection.odds = 0;
    });
    
    // Force a reactivity update
    couponStore.updateWinnings({
      stake: couponStore.coupon.totalStake,
      id: "all",
    });
  }
}

// Function to synchronize betslip with component state
function synchronizeBetslipWithComponent() {
  const matchId = props.gameData.matchID;
  const selections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(matchId)
  );  
  // Track if we made any changes
  let updatedAnySelection = false;
  
  if(selections.length > 0){
    console.log(`🔄 Synchronizing betslip with component for match ${props.gameData.matchID}`);
    // For each selection in the betslip
    selections.forEach(selection => {
      // Find the corresponding outcome in our component
      const marketId = parseInt(selection.marketId);
      const outcomeId = selection.outcomeId || selection.oddId;
      const specifier = selection.specifier || '';
      
      // First check our current outcomes array
      let matchingOutcome = outcomes.value.find(
        o => o.marketID === marketId && 
            String(o.outcomeID) === String(outcomeId) && 
            (o.specifier || '') === specifier
      );
      
      // If not found in current outcomes, check all outcomes in gameData
      if (!matchingOutcome && props.gameData.outcomes) {
        matchingOutcome = props.gameData.outcomes.find(
          o => o.marketID === marketId && 
              String(o.outcomeID) === String(outcomeId) && 
              (o.specifier || '') === specifier
        );
      }
      
      // If we found a matching outcome, update the betslip
      if (matchingOutcome) {
        // Check if outcome is active
        if (matchingOutcome.active === 0) {
          if (!selection.suspended || !selection.unavailable) {
            console.log(`🔄 Suspending selection in betslip for match ${matchId}`);
            selection.suspended = true;
            selection.unavailable = true;
            updatedAnySelection = true;
          }
        } else {
          // If outcome is active but selection is suspended, reactivate it
          if (selection.suspended || selection.unavailable) {
            console.log(`🔄 Reactivating selection in betslip for match ${matchId}`);
            selection.suspended = false;
            selection.unavailable = false;
            updatedAnySelection = true;
          }
          
          // Update odds if they've changed
          if (matchingOutcome.odds !== selection.odds) {
            console.log(`🔄 Updating odds in betslip from ${selection.odds} to ${matchingOutcome.odds}`);
            selection.odds = matchingOutcome.odds;
            selection.changed = true;
            updatedAnySelection = true;
            
            // Reset the changed flag after 5 seconds
            setTimeout(() => {
              selection.changed = false;
              couponStore.updateWinnings({
                stake: couponStore.coupon.totalStake,
                id: "all",
              });
            }, 5000);
          }
        }
      } else {
        // If we can't find the outcome, suspend the selection
        if (!selection.suspended || !selection.unavailable) {
          console.log(`🔄 Outcome not found, suspending selection in betslip for match ${matchId}`);
          selection.suspended = true;
          selection.unavailable = true;
          updatedAnySelection = true;
        }
      }
    });
    
    // Update betslip if needed
    if (updatedAnySelection) {
      couponStore.updateWinnings({
        stake: couponStore.coupon.totalStake,
        id: "all",
      });
    }
  }
}

onMounted(() => {
  console.log(`🏗️ Component: Setting up MQTT subscriptions for match ID: ${props.gameData.matchID}`);
  
  // Initialize scores from props
  scores.value = {
    homeScore: props.gameData.homeScore,
    awayScore: props.gameData.awayScore
  }

  outcomes.value = props.gameData.outcomes || []
  getOdds()
  
  // Subscribe to live odds changes for this specific match
  const matchId = props.gameData.matchID;
  
  if (matchId) {
    // Create a unique component ID to help with debugging
    const componentId = `live-fixture-${matchId}-${Date.now()}`;
    
    // Subscribe to bet stop first (higher priority)
    const betStopTopic = `feeds/live/bet_stop/${matchId}`;
    const unsubscribeBetStop = subscribe(betStopTopic, (data) => {
      console.log(`⚠️ BET STOP: Received message on topic ${betStopTopic} for component ${componentId}`);
      handleBetStop(data);
    });
    
    // Then subscribe to odds changes
    const oddsChangeTopic = `feeds/live/odds_change/${matchId}`;
    const unsubscribeOddsChange = subscribe(oddsChangeTopic, (data) => {
      console.log(`📊 MQTT: Received message on topic ${oddsChangeTopic} for component ${componentId}`);
      handleOddsChange(data);
    });
    
    // Store unsubscribe functions for cleanup
    onBeforeUnmount(() => {
      console.log(`🧹 Component: Cleaning up MQTT subscriptions for match ID: ${matchId}`);
      unsubscribeBetStop();
      unsubscribeOddsChange();
    });
  }
  
  // Ensure betslip is synchronized with initial component state
  synchronizeBetslipWithComponent();
})

// Add a watch for gameData to check betslip when props change
watch(
  () => props.gameData,
  () => {
    synchronizeBetslipWithComponent();
  },
  { deep: true }
)

const getSpecifiers = computed(() => {
  if (props.gameData.outcomes) {
    const odds = props.gameData.outcomes
    let filtered = odds.filter((item) => item.marketID == props.activeMarket.marketID)
    let uniqueFiltered = uniqueOutcomes(filtered)
    let specifiers = uniqueFiltered.map((item) => {
      return {
        value: item.specifier.split('=')[1],
        specifier: item.specifier
      }
    })
    let uniqueSpecifiers = specifiers.filter(
      (item, index, self) => index === self.findIndex((t) => t.value === item.value)
    )
    return uniqueSpecifiers
  }
  return []
})

function toggleList() {
  specifierOpen.value = !specifierOpen.value
}

function setActiveSpecifier(item) {
  activeSpecifier.value = item.value
  specifierOpen.value = false
  if (props.gameData.outcomes) {
    const odds = props.gameData.outcomes
    let filtered = odds.filter((odd) => odd.marketID == props.activeMarket.marketID)
    let uniqueFiltered = uniqueOutcomes(filtered)
    uniqueFiltered = uniqueFiltered.filter((odd) => odd.specifier === item.specifier)
    outcomes.value = sortArr(uniqueFiltered, 'outcomeID')
  }
}

// Function to update betslip with new odds
function updateBetslipWithNewOdds(matchId, markets) {
  synchronizeBetslipWithComponent();
}

// Watch for changes to props.gameData.outcomes
watch(
  () => props.gameData.outcomes,
  (newOutcomes) => {
    if (newOutcomes && newOutcomes.length > 0) {
      synchronizeBetslipWithComponent();
    }
  },
  { deep: true }
)
</script>

<style scoped>
.m-table {
  display: block;
  width: 100%;
}

.m-table .m-table-row {
  display: table;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  width: 100%;
}

.m-table .m-table-cell {
  display: table-cell;
  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  min-width: 1%;
}
</style>
