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

// Function to handle bet stop
function handleBetStop(data) {
  console.log('⚙️ Component: Processing bet stop for', data)
  
  // Clone outcomes value
  const newOutcomes = [...outcomes.value]
  
  // Loop through current outcomes and update odds to 0
  for (let index = 0; index < newOutcomes.length; index++) {
    const outcome = { ...newOutcomes[index] }
    outcome.odds = 0
    outcome.active = 0
    
    // Update our tracking object
    const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier}`
    updatedOutcomes.value[key] = {
      odds: 0,
      active: 0
    }
    
    newOutcomes[index] = outcome
  }
  
  // Update outcomes state
  outcomes.value = newOutcomes
  
  // Update betslip selections for this match
  const matchIdFromEvent = data.match_id
  
  // Find if any selection in the betslip matches this event
  const selections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(matchIdFromEvent)
  )
  
  if (selections.length > 0) {
    console.log(`⚙️ Component: Suspending ${selections.length} selections in betslip for match ID ${matchIdFromEvent}`)
    
    // Process each matching selection
    selections.forEach(selection => {
      // Suspend the selection and set odds to 0
      selection.suspended = true
      selection.unavailable = true
      selection.odds = 0
      
      // Force a reactivity update
      couponStore.updateWinnings({
        stake: couponStore.coupon.totalStake,
        id: "all",
      })
    })
  }
}

// Function to handle odds changes
function handleOddsChange(data) {
  if (!data || !data.markets) return
  console.log(`⚙️ Component: Processing odds change for ${props.gameData.name} (Match ID: ${props.gameData.matchID})`)
  
  // Update score if available in the data
  if (data.sport_event_status) {
    const scoreData = data.sport_event_status;
    if (scoreData.home_score !== undefined && scoreData.away_score !== undefined) {
      scores.value = {
        homeScore: scoreData.home_score,
        awayScore: scoreData.away_score
      }
      console.log(`⚙️ Component: Updated score to ${scoreData.home_score}:${scoreData.away_score}`)
    }
  }
  
  // Update our tracking object with the new odds for ALL markets
  const markets = data.markets || []
  
  if (markets.length > 0) {
    // Step 1: Update our tracking object for ALL markets
    markets.forEach(market => {
      if (market.outcomes) {
        market.outcomes.forEach(outcome => {
          const key = `${market.id}-${outcome.id}-${market.specifiers}`
          updatedOutcomes.value[key] = {
            odds: outcome.odds,
            active: outcome.active ? 1 : 0
          }
        })
      }
    })
    
    // Step 2: Update our current outcomes if they match the active market
    if (props.activeMarket) {
      const activeMarketId = props.activeMarket.marketID
      const activeMarketSpecifier = props.activeMarket.specifier || ''
      
      // Find the market in the data
      const market = markets.find(
        (m) => m.id === parseInt(activeMarketId) && m.specifiers === activeMarketSpecifier
      )
      
      if (market && market.outcomes) {
        // Update our outcomes
        const newOutcomes = [...outcomes.value]
        
        for (let i = 0; i < newOutcomes.length; i++) {
          const outcome = newOutcomes[i]
          const newOutcome = market.outcomes.find(
            (o) => String(o.id) === String(outcome.outcomeID)
          )
          
          if (newOutcome) {
            newOutcomes[i] = {
              ...outcome,
              odds: newOutcome.odds,
              active: newOutcome.active ? 1 : 0
            }
          }
        }
        
        outcomes.value = newOutcomes
      }
    }
    
    // Step 3: Update any selections in the betslip
    updateBetslipIfNeeded(data)
  }
}

// Function to update betslip if this selection is in the betslip
function updateBetslipIfNeeded(data) {
  const matchIdFromEvent = data.match_id
  
  // Find if any selection in the betslip matches this event
  const selections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(matchIdFromEvent)
  )
  
  if (selections.length > 0) {
    console.log(`⚙️ Component: Found ${selections.length} selections in betslip for match ID ${matchIdFromEvent}`)
    
    // Process each matching selection
    selections.forEach(selection => {
      // Find the market in the data
      const marketId = parseInt(selection.marketId)
      const outcomeId = selection.outcomeId || selection.oddId
      const specifier = selection.specifier || ''
      
      console.log(`⚙️ Component: Looking for market ${marketId} with specifier "${specifier}" and outcome ${outcomeId}`)
      
      const market = data.markets.find(
        (m) => m.id === marketId && m.specifiers === specifier
      )
      
      if (market && market.outcomes) {
        console.log(`⚙️ Component: Found market with ${market.outcomes.length} outcomes`)
        
        // Find the outcome in the market
        const newOutcome = market.outcomes.find(
          (odd) => String(odd.id) === String(outcomeId)
        )
        
        if (newOutcome) {
          console.log(`⚙️ Component: Found outcome with odds ${newOutcome.odds} and active=${newOutcome.active}`)
          
          // Check if odds are valid (>= 1.01) and outcome is active
          if (newOutcome.odds >= 1.01 && newOutcome.active) {
            console.log(`⚙️ Component: Valid outcome - unsuspending selection`)
            
            // Update the selection with the new odds
            selection.odds = newOutcome.odds
            selection.changed = true
            
            // Unsuspend the selection since we have valid odds now
            selection.suspended = false
            selection.unavailable = false
            
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
          } else {
            console.log(`⚙️ Component: Invalid outcome - keeping selection suspended`)
            
            // If the outcome is not active or has odds < 1.01, keep it suspended and set odds to 0
            selection.suspended = true
            selection.unavailable = true
            selection.odds = 0
            
            // Force a reactivity update
            couponStore.updateWinnings({
              stake: couponStore.coupon.totalStake,
              id: "all",
            })
          }
        } else {
          console.log(`⚙️ Component: Outcome ${outcomeId} not found in market`)
        }
      } else {
        console.log(`⚙️ Component: Market ${marketId} with specifier "${specifier}" not found`)
      }
    })
  }
}

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

// Add a watch for gameData to check betslip when props change
watch(
  () => props.gameData,
  () => {
    checkBetslipOnRefresh()
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
  // Find selections in betslip for this match
  const selections = couponStore.coupon.selections.filter(
    (sel) => String(sel.matchId) === String(matchId)
  );
  
  if (selections.length > 0) {
    let updatedAnySelection = false;
    
    // Process each selection
    selections.forEach(selection => {
      const marketId = parseInt(selection.marketId);
      const outcomeId = selection.outcomeId || selection.oddId;
      const specifier = selection.specifier || '';
      
      // Find the market in the data
      const market = markets.find(
        (m) => m.id === marketId && (m.specifiers || '') === specifier
      );
      
      if (market && market.outcomes) {
        // Find the outcome
        const outcome = market.outcomes.find(
          (o) => String(o.id) === String(outcomeId)
        );
        
        if (outcome) {
          // Handle active/inactive state
          if (!outcome.active) {
            // Suspend if inactive
            selection.suspended = true;
            selection.unavailable = true;
            updatedAnySelection = true;
          } else {
            // Reactivate if previously suspended
            if (selection.suspended || selection.unavailable) {
              selection.suspended = false;
              selection.unavailable = false;
              updatedAnySelection = true;
            }
            
            // Update odds if changed
            if (outcome.odds !== selection.odds) {
              selection.odds = outcome.odds;
              selection.changed = true;
              updatedAnySelection = true;
              
              // Reset changed flag after 5 seconds
              setTimeout(() => {
                selection.changed = false;
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
    
    // Update betslip if needed
    if (updatedAnySelection) {
      couponStore.updateWinnings({
        stake: couponStore.coupon.totalStake,
        id: "all",
      });
    }
  }
}

// Watch for changes to props.gameData.outcomes
watch(
  () => props.gameData.outcomes,
  (newOutcomes) => {
    if (newOutcomes && newOutcomes.length > 0) {
      const matchId = props.gameData.matchID;
      const selections = couponStore.coupon.selections.filter(
        (sel) => String(sel.matchId) === String(matchId)
      );
      
      if (selections.length > 0) {
        let updatedAnySelection = false;
        
        selections.forEach(selection => {
          const marketId = parseInt(selection.marketId);
          const outcomeId = selection.outcomeId || selection.oddId;
          const specifier = selection.specifier || '';
          
          const outcome = newOutcomes.find(
            (o) => o.marketID === marketId && 
                  String(o.outcomeID) === String(outcomeId) && 
                  (o.specifier || '') === specifier
          );
          
          if (outcome) {
            if (outcome.active === 0) {
              selection.suspended = true;
              selection.unavailable = true;
              updatedAnySelection = true;
            } else {
              if (selection.suspended || selection.unavailable) {
                selection.suspended = false;
                selection.unavailable = false;
                updatedAnySelection = true;
              }
              
              if (outcome.odds !== selection.odds) {
                selection.odds = outcome.odds;
                selection.changed = true;
                updatedAnySelection = true;
                
                setTimeout(() => {
                  selection.changed = false;
                  couponStore.updateWinnings({
                    stake: couponStore.coupon.totalStake,
                    id: "all",
                  });
                }, 5000);
              }
            }
          }
        });
        
        if (updatedAnySelection) {
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
