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
      <span class="m-league-name">{{ gameData.categoryName }} - {{ gameData.tournament }}</span>
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
        <div class="set-score">{{ gameData.homeScore }}</div>
        <div class="set-score">{{ gameData.awayScore }}</div>
      </div>

      <div class="x-table-cell m-market-cell">
        <div class="m-market m-event-market-default" style="position: relative">
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
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import LiveOdds from './LiveOdds.vue'
import EmptyOdds from '@/components/EmptyOdds.vue'
import { sortArr, createID, isSelected, slugify } from '@/helpers'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '../../helpers'
import { useMqttService } from '@/composables/useMqtt'

const couponStore = useCouponStore()

// Extract the subscribe function at the top level
const { subscribe } = useMqttService()

const props = defineProps({
  gameData: Object,
  activeMarket: Object
})

const activeSpecifier = ref()
const specifierOpen = ref(false)

const scores = ref({
  homeScore: props.gameData?.homeScore || 0,
  awayScore: props.gameData?.awayScore || 0
})

const outcomes = ref([])

// Keep track of updated odds
const updatedOutcomes = ref({})

// Keep track of the last update timestamp for each match
const lastUpdateTimestamp = ref({})

const getOdds = () => {
  if (props.activeMarket && props.gameData.activeMarkets > 0) {
    if (props.gameData.outcomes) {
      // Find and return the odds based on marketID and outcomeID
      const odds = props.gameData.outcomes
      let filtered = odds.filter((item) => item.marketID == props.activeMarket.marketID)
      let uniqueFiltered = uniqueOutcomes(filtered)
      
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
      
      if (props.activeMarket.specifier && props.activeMarket.specifier !== '') {
        let defaultSpecifier = uniqueFiltered[0]?.specifier
        if (defaultSpecifier) {
          uniqueFiltered = uniqueFiltered.filter((item) => item.specifier === defaultSpecifier)
          activeSpecifier.value = defaultSpecifier.split('=')[1]
        }
      }
      if (uniqueFiltered.length) {
        // console.log(_.sortBy(uniqueFiltered, 'outcomeID'))
        outcomes.value = sortArr(uniqueFiltered, 'outcomeID')
      } else {
        outcomes.value = []
      }
    }
  }
}

const getSpecifiers = computed(() => {
  if (props.activeMarket && props.activeMarket.specifier && props.activeMarket.specifier !== '') {
    const result = []

    const outcomes = props.gameData.outcomes
    if (outcomes.length > 0) {
      const filtered = outcomes.filter(
        (item) => item.marketID === parseInt(props.activeMarket.marketID)
      )

      let uniqueFiltered = uniqueOutcomes(filtered)

      uniqueFiltered.forEach((outcome) => {
        let specifier = outcome.specifier
        let found = result.find((item) => item.specifier === specifier)
        if (!found)
          // check if specifier has been listed
          result.push({ specifier, value: specifier.split('=')[1] }) //push value to array
      })
    }
    return result.sort((a, b) => a.value - b.value)
  } else {
    return []
  }
})

// set active specifier value
const setActiveSpecifier = (spec) => {
  if (props.gameData.outcomes) {
    // console.log(spec)
    const odds = props.gameData.outcomes
    let filtered = odds.filter((item) => item.marketID === parseInt(props.activeMarket.marketID))
    if (filtered) {
      let uniqueFiltered = uniqueOutcomes(filtered)
      uniqueFiltered = uniqueFiltered.filter((item) => item.specifier === spec.specifier)
      
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
      
      outcomes.value = uniqueFiltered
      activeSpecifier.value = spec.value
      toggleList()
    }
  }
}

const toggleList = () => {
  specifierOpen.value = !specifierOpen.value
}

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

// Function to handle odds changes
function handleOddsChange(data) {
  if (!data || !data.markets) return;
  
  const matchId = props.gameData.matchID;
  console.log(`📊 MQTT: Received odds change for match ID ${matchId} =>`, data);
  
  // Update our tracking object with the new odds for ALL markets
  const markets = data.markets || [];
  
  if (markets.length > 0) {
    // Step 1: Update our tracking object for ALL markets
    markets.forEach(market => {
      if (market.outcomes) {
        market.outcomes.forEach(outcome => {
          const key = `${market.id}-${outcome.id}-${market.specifiers || ''}`;
          updatedOutcomes.value[key] = {
            odds: outcome.odds,
            active: outcome.active ? 1 : 0,
            timestamp: Date.now()
          };
        });
      }
    });
    
    // Step 2: Update currently displayed outcomes if they match the updated markets
    if (outcomes.value.length > 0) {
      // Clone outcomes value
      const newOutcomes = [...outcomes.value];
      let hasChanges = false;
      
      // Update existing outcomes with new odds data
      for (let i = 0; i < newOutcomes.length; i++) {
        const outcome = { ...newOutcomes[i] };
        
        // Find market in the MQTT data
        const market = markets.find(
          (item) => item.id === outcome.marketID && (item.specifiers || '') === (outcome.specifier || '')
        );
        
        if (market && market.outcomes) {
          // Find the outcome in the market
          const newOutcome = market.outcomes.find(
            (odd) => String(odd.id) === String(outcome.outcomeID)
          );
          
          if (newOutcome) {
            // Update odds and active status
            if (outcome.odds !== newOutcome.odds || outcome.active !== (newOutcome.active ? 1 : 0)) {
              outcome.odds = newOutcome.odds;
              outcome.active = newOutcome.active ? 1 : 0;
              hasChanges = true;
            }
          }
        }
        
        newOutcomes[i] = outcome;
      }
      
      // Only update if there are actual changes
      if (hasChanges) {
        outcomes.value = newOutcomes;
      }
    }
    
    // Step 3: Update betslip if needed
    updateBetslipWithNewOdds(matchId, markets);
  }
}

// Function to update betslip with new odds
function updateBetslipWithNewOdds(matchId, markets) {
  // Find if any selection in the betslip matches this event
  const selections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(matchId)
  );
  
  if (selections.length > 0) {
    console.log(`📊 MQTT: Found ${selections.length} selections in betslip for match ID ${matchId}`);
    let updatedAnySelection = false;
    
    // Process each matching selection
    selections.forEach(selection => {
      // Find the updated odds for this selection
      const marketId = parseInt(selection.marketId);
      const outcomeId = selection.outcomeId || selection.oddId;
      const specifier = selection.specifier || '';
      
      // Find the market in the MQTT data
      const market = markets.find(
        (m) => m.id === marketId && (m.specifiers || '') === specifier
      );
      
      if (market && market.outcomes) {
        // Find the outcome in the market
        const outcome = market.outcomes.find(
          (o) => String(o.id) === String(outcomeId)
        );
        
        if (outcome) {
          if (!outcome.active) {
            // If outcome is not active, suspend the selection
            console.log(`📊 MQTT: Outcome not active, suspending selection for match ID ${matchId}`);
            selection.suspended = true;
            selection.unavailable = true;
            updatedAnySelection = true;
          } else {
            // If outcome is active, make sure it's not suspended
            if (selection.suspended || selection.unavailable) {
              console.log(`📊 MQTT: Reactivating previously suspended selection for match ID ${matchId}`);
              selection.suspended = false;
              selection.unavailable = false;
              updatedAnySelection = true;
            }
            
            // Update odds if they've changed
            if (outcome.odds !== selection.odds) {
              console.log(`📊 MQTT: Updating odds from ${selection.odds} to ${outcome.odds} for match ID ${matchId}`);
              selection.odds = outcome.odds;
              selection.changed = true;
              updatedAnySelection = true;
              
              // Reset the changed flag after 5 seconds
              setTimeout(() => {
                selection.changed = false;
                
                // Force a reactivity update
                couponStore.updateWinnings({
                  stake: couponStore.coupon.totalStake,
                  id: "all",
                });
              }, 5000);
            }
          }
        }
      }
    });
    
    // Only update winnings if we actually changed any selections
    if (updatedAnySelection) {
      // Force a reactivity update
      couponStore.updateWinnings({
        stake: couponStore.coupon.totalStake,
        id: "all",
      });
    }
  }
}

// Function to handle bet stop
function handleBetStop(data) {
  const matchId = props.gameData.matchID;
  console.log(`📊 MQTT: Received bet stop for match ID ${matchId}`);
  
  // Clone outcomes value
  const newOutcomes = [...outcomes.value];
  
  // Loop through current outcomes and update odds to 0
  for (let index = 0; index < newOutcomes.length; index++) {
    const outcome = { ...newOutcomes[index] };
    outcome.odds = 0;
    outcome.active = 0;
    
    // Update our tracking object
    const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier || ''}`;
    updatedOutcomes.value[key] = {
      odds: 0,
      active: 0,
      timestamp: Date.now()
    };
    
    newOutcomes[index] = outcome;
  }
  
  // Update outcomes state
  outcomes.value = newOutcomes;
  
  // Update betslip selections for this match
  const selections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(matchId)
  );
  
  if (selections.length > 0) {
    console.log(`📊 MQTT: Suspending ${selections.length} selections in betslip for match ID ${matchId}`);
    
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

// Watch for changes to props.gameData.outcomes
watch(
  () => props.gameData.outcomes,
  (newOutcomes) => {
    if (newOutcomes && newOutcomes.length > 0) {
      // Update our local outcomes
      outcomes.value = newOutcomes;
      
      // Check if any betslip selections need to be updated
      const matchId = props.gameData.matchID;
      const selections = couponStore.coupon.selections.filter(
        (sel) => String(sel.matchId) === String(matchId)
      );
      
      if (selections.length > 0) {
        console.log(`🔄 Props: Found ${selections.length} selections in betslip for match ID ${matchId}`);
        let updatedAnySelection = false;
        
        // Process each matching selection
        selections.forEach(selection => {
          // Find the updated odds for this selection
          const marketId = parseInt(selection.marketId);
          const outcomeId = selection.outcomeId || selection.oddId;
          const specifier = selection.specifier || '';
          
          // Find the outcome in the gameData
          const outcome = newOutcomes.find(
            (o) => o.marketID === marketId && 
                  String(o.outcomeID) === String(outcomeId) && 
                  (o.specifier || '') === specifier
          );
          
          if (outcome) {
            if (outcome.active === 0) {
              // If outcome is not active, suspend the selection
              console.log(`🔄 Props: Outcome not active, suspending selection for match ID ${matchId}`);
              selection.suspended = true;
              selection.unavailable = true;
              updatedAnySelection = true;
            } else {
              // If outcome is active, make sure it's not suspended
              if (selection.suspended || selection.unavailable) {
                console.log(`🔄 Props: Reactivating previously suspended selection for match ID ${matchId}`);
                selection.suspended = false;
                selection.unavailable = false;
                updatedAnySelection = true;
              }
              
              // Update odds if they've changed
              if (outcome.odds !== selection.odds) {
                console.log(`🔄 Props: Updating odds from ${selection.odds} to ${outcome.odds} for match ID ${matchId}`);
                selection.odds = outcome.odds;
                selection.changed = true;
                updatedAnySelection = true;
                
                // Reset the changed flag after 5 seconds
                setTimeout(() => {
                  selection.changed = false;
                  
                  // Force a reactivity update
                  couponStore.updateWinnings({
                    stake: couponStore.coupon.totalStake,
                    id: "all",
                  });
                }, 5000);
              }
            }
          }
        });
        
        // Only update winnings if we actually changed any selections
        if (updatedAnySelection) {
          // Force a reactivity update
          couponStore.updateWinnings({
            stake: couponStore.coupon.totalStake,
            id: "all",
          });
        }
      }
    }
  },
  { deep: true }
)

const uniqueOutcomes = (outcomes) => {
  let x = outcomes.filter(
    (outcome, index, self) =>
      index ===
      self.findIndex((o) => o.outcomeID == outcome.outcomeID && o.specifier == outcome.specifier)
  )
  return x
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

// Update scores when gameData changes
// watch(
//   () => [props.gameData?.homeScore, props.gameData?.awayScore],
//   ([newHomeScore, newAwayScore]) => {
//     if (newHomeScore !== undefined && newAwayScore !== undefined) {
//       scores.value = {
//         homeScore: newHomeScore,
//         awayScore: newAwayScore
//       }
//     }
//   }
// )

watch(
  [() => props.activeMarket, () => props.gameData.outcomes],
  () => {
    getOdds()
  },
  { immediate: true }
)

onMounted(() => {
  console.log('🏗️ Component: Setting up MQTT subscriptions for match ID:', props.gameData.matchID)
  
  // Initialize scores from props
  scores.value = {
    homeScore: props.gameData.homeScore,
    awayScore: props.gameData.awayScore
  }

  outcomes.value = props.gameData.outcomes || []
  getOdds()
  
  // Check betslip on initial load
  checkBetslipOnRefresh()
  
  // Subscribe to live odds changes for this specific match
  const matchId = props.gameData.matchID
  
  if (matchId) {
    // Use the correct topic paths with the proper prefix
    const unsubscribeOddsChange = subscribe(`feeds/live/odds_change/${matchId}`, (data) => {
      handleOddsChange(data)
    })
    
    const unsubscribeBetStop = subscribe(`feeds/live/bet_stop/${matchId}`, (data) => {
      handleBetStop(data)
    })
    
    // Store unsubscribe functions for cleanup
    onBeforeUnmount(() => {
      unsubscribeOddsChange()
      unsubscribeBetStop()
    })
  }
})
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
/* Live Fixture */
.m-live-table .m-live-row {
  margin: 0 0.83333333rem;
}
</style>
