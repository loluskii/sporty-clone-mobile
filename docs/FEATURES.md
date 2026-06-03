# Sporty Clone Mobile Features PRD

This document describes the app features from a product and design perspective. It is intended for designers, product managers, and collaborators who need to understand what the app does, how users move through it, and what states each feature should support.

## Product Summary

Sporty Clone Mobile is a mobile-first betting app for sports betting, live betting, casino games, wallet actions, bet history, and promotional content.

The app should feel fast, clear, and confidence-building. Users should always understand:

- What they selected.
- What they can win.
- Whether odds changed.
- Whether a market is available.
- Whether a feature like 1UP, 2UP, Early Goals, Cut 1, or Flex is active.
- What happens when they place, book, simulate, or reload a bet.

## Primary Users

- **Casual sports bettors** who want quick access to popular matches and simple accumulator bets.
- **Experienced bettors** who use advanced betslip features like System, Cut 1, Flex, and derived markets.
- **Live bettors** who need fast odds updates and clear suspended/unavailable states.
- **Casino players** who browse providers, categories, jackpots, and bonus games.
- **Returning users** who reload bet codes, rebet previous tickets, or check bet history.

## Main App Areas

## 1. Home

The home screen is the app’s main discovery area.

Users should be able to:

- See promotional banners.
- Browse popular sports.
- See highlighted matches.
- See live match previews.
- Jump into sports, casino, promotions, and featured games.
- Open a betslip quickly when selections exist.

Key UX expectations:

- The first screen should prioritize betting opportunities and clear navigation.
- Cards should be scannable on mobile.
- Horizontal carousels should communicate that more items are available.
- If content is loading, show skeleton/loading states rather than empty blocks.

## 2. Sports Betting

Sports betting includes prematch lists, fixture detail pages, live betting, and search.

### Sports Navigation

Users can browse sports by:

- Popular sports on the home screen.
- Sports A-Z.
- Country/category.
- Tournament.
- Today’s fixtures.
- Search.

Design needs:

- Clear active tab/market state.
- Easy back navigation.
- Compact fixture cards that still show enough context: teams, time, market, odds, and status.

### Prematch Fixtures

Prematch fixture lists show upcoming events and market odds.

Users should be able to:

- Switch markets.
- Select odds.
- Open a fixture for more markets.
- See when markets are locked, suspended, or unavailable.
- Use derived market modes where supported.

Important states:

- Normal odds.
- Selected odds.
- Locked odds.
- Suspended/unavailable odds.
- Market loading.
- Empty fixtures.

### Fixture Detail

Fixture detail pages show all available markets for one event.

Users should be able to:

- Browse grouped markets.
- Select an outcome.
- See selected states accurately.
- See market availability clearly.
- Return to fixture lists without losing betslip selections.

## 3. Live Betting

Live betting shows events currently in progress.

Users should be able to:

- Browse live fixtures.
- See live score/time context.
- Select live odds.
- Open live fixture detail.
- Understand odds changes quickly.

Design needs:

- Live selections should carry a clear **Live** badge in the betslip.
- Suspended or unavailable markets should be visibly different from active markets.
- Odds changes should be noticeable but not disruptive.
- Bet-stop states should be clear and non-clickable.

## 4. Betslip

The betslip is the most important conversion surface.

Users should be able to:

- Review selected bets.
- Remove one selection.
- Clear all selections after confirmation.
- Enter stake.
- See total odds.
- See taxes, bonus, and potential win.
- Place a bet.
- Book a bet.
- Simulate a bet where available.
- Accept odds changes.
- Switch supported selections between special modes.

### Betslip Selection Row

Each selection row should show:

- Match name.
- Selected outcome.
- Market name.
- Odds.
- Remove button.
- Status badge where needed.
- Feature controls where supported.

Selection row states:

- Normal.
- Selected and active.
- Odds increased.
- Odds decreased.
- Suspended.
- Unavailable.
- Live.
- Feature-supported.
- Feature-unsupported.

### Clearing Betslip

When the user taps clear/remove all:

- Show a confirmation dialog.
- Confirm action clears all selections.
- Cancel keeps the betslip unchanged.

The dialog should appear above the betslip and use the primary action styling for destructive confirmation.

### Odds Changes

When odds change:

- The changed odds should update in the betslip.
- An up/down visual indicator should show direction.
- The user may need to accept changes before placing.
- Potential win should update from the latest odds.

The app should not wait for “Accept changes” before refreshing displayed winnings.

## 5. Betslip Features

The app supports multiple optional betslip features. These features must be visually clear and should not feel hidden.

### Insure Feature Area

The Insure area groups supported betslip enhancements such as:

- 1UP.
- 2UP.
- Early Goals.
- Cut 1.
- Flex.

Design goal:

- Keep these controls compact.
- Make active/inactive states obvious.
- Avoid long helper text unless the user asks for more information.
- Disabled controls should look disabled and should not invite interaction.

## 6. 1UP and 2UP

1UP and 2UP are early-payout football markets for `1X2` selections.

User-facing meaning:

- **1UP** means the selected team is treated as a winning selection once it leads by **one goal** at any point in the match.
- **2UP** means the selected team is treated as a winning selection once it leads by **two goals** at any point in the match.
- Once the early-payout condition is triggered, that selection should be considered won even if the match later becomes a draw or the selected team loses.
- If the selected team never reaches the required lead, the selection settles by the normal full-time 1X2 result.

Examples:

- If the user selects Team A on **1UP** and Team A goes 1-0 ahead, the selection wins early.
- If the user selects Team A on **2UP** and Team A goes 2-0, 3-1, or 4-2 ahead, the selection wins early.
- In a multiple bet, the 1UP/2UP leg can be marked as won early while the remaining selections continue to run.

User-facing behavior:

- If a selected 1X2 market supports 1UP/2UP, the selection row shows 1UP and 2UP controls.
- The user can switch that one selection between base, 1UP, and 2UP.
- The user can also bulk apply/remove 1UP or 2UP from the Insure area.
- Unsupported selections remain in the betslip, but should communicate that the feature is not supported only when relevant.

Rules:

- 1UP/2UP only apply to football.
- 1UP/2UP only apply to 1X2 markets.
- Draw outcomes are not valid for 1UP/2UP and should be locked.
- If the user turns off the feature, eligible selections return to their base market.

Design states:

- Base active.
- 1UP active.
- 2UP active.
- Unsupported.
- Disabled/loading.

## 7. Early Goals

Early Goals is a special football market for Over/Under selections.

User-facing meaning:

- Early Goals is an Over/Under variant where the goals must happen within the `minsnr` minutes window defined by the market.
- In this app, Early Goals works as a derived version of the normal Over/Under market.
- The user is still choosing an Over total, but with the Early Goals condition attached.
- If the selected Early Goals total is reached within `minsnr` minutes, the selection wins.
- If the total is not reached within `minsnr` minutes, the Early Goals selection loses even if the full match later goes over that total.

Examples:

- If the market specifier is `minsnr=50|total=1.5`, **Early Goals Over 1.5** means at least 2 goals must be scored within the first 50 minutes.
- If the market specifier is `minsnr=50|total=2.5`, **Early Goals Over 2.5** means at least 3 goals must be scored within the first 50 minutes.
- If the market specifier is `minsnr=50|total=3.5`, **Early Goals Over 3.5** means at least 4 goals must be scored within the first 50 minutes.
- Normal Under outcomes do not apply to Early Goals in the current product.

User-facing behavior:

- If an Over/Under selection supports Early Goals, the selection row can show an Early Goals control.
- The user can switch one eligible O/U selection between base and Early Goals.
- The Insure Early Goals checkbox can apply/remove Early Goals across all eligible O/U selections in the betslip.
- If the betslip already contains an Early Goals selection, the Insure Early Goals checkbox should appear active.

Rules:

- Early Goals only applies to football.
- Early Goals only applies to Over/Under.
- Early Goals applies only to Over outcomes.
- Supported totals are 1.5, 2.5, and 3.5.
- Under outcomes should be locked when Early Goals is active.
- Turning Early Goals off should return eligible O/U selections to their base market.

Design states:

- Base O/U.
- Early Goals active.
- Unsupported O/U.
- Locked under outcomes.
- Disabled/loading.

## 8. Acca Bonus

Acca Bonus boosts possible winnings for qualifying accumulator bets.

User-facing behavior:

- The bonus should appear only when the bet qualifies.
- The displayed bonus should be based on the active stake and selected odds.
- If the bet no longer qualifies, the bonus should disappear rather than show misleading zero values.

Rules:

- Bonus depends on number of qualifying legs.
- Each qualifying leg must meet the minimum odds.
- Total odds must meet the minimum total odds.
- Bonus can be capped.
- Bonus should not show when incompatible features like Cut 1 or Flex are active.

Design needs:

- Clear bonus amount.
- Clear relationship between bonus and potential win.
- Avoid showing a bonus progress bar if it is not accurate.

## 9. Cut 1

Cut 1 is an accumulator safety feature.

User-facing explanation:

- Cut 1 protects an accumulator from exactly one losing selection.
- If all selections win, the user gets the normal accumulator payout.
- If exactly one selection loses, the user can still receive a reduced payout.
- If two or more selections lose, the bet loses.
- The reduced payout is priced with a penalty margin, so it will be lower than a normal all-win accumulator.

Examples:

- In a 6-selection Cut 1 bet, if all 6 selections win, the user receives the normal accumulator payout.
- If 5 selections win and 1 selection loses, the user can still receive a Cut 1 payout.
- If 4 selections win and 2 selections lose, the bet loses.

Eligibility:

- User selected Cut 1.
- Feature is active.
- Bet is a multiple.
- Bet has enough selections.
- Every leg meets the minimum odds.
- Flex is not active.
- Bonus/free-bet funds are not used.

Design behavior:

- Cut 1 should be visible but disabled when the bet does not qualify.
- When selected, bonus display should be removed if bonus is incompatible.
- Potential win may show a small loading spinner while preview values update.
- Avoid showing multiple rapidly changing payout values if possible.

## 10. Flex

Flex is an n-of-k bet.

User-facing explanation:

- Flex lets the user decide the minimum number of selections that must win.
- The user chooses how many selections must win.
- Example: 3 of 5 means the bet wins if at least 3 selections win.
- The user does not need every selection to win, but the payout is recalculated using Flex odds instead of normal accumulator odds.
- The more selections the user requires to win, the closer the bet behaves to a normal accumulator.
- The fewer selections the user requires to win, the safer the bet feels, but the payout is lower.

Examples:

- **3 of 5 Flex** wins if any 3, 4, or 5 selections win.
- **4 of 6 Flex** wins if any 4, 5, or 6 selections win.
- If fewer than the chosen minimum wins, the bet loses.

User controls:

- Flex checkbox.
- Minimum number of selections to win.
- Potential payout based on Flex odds.

Eligibility:

- Feature is active.
- Bet has enough selections.
- Minimum wins is valid for the number of selections.
- Cut 1 is not active.
- Bonus/free-bet funds are not used.

Design behavior:

- The number selector should clearly say it controls the minimum selections to win.
- The selector minimum should allow valid values only.
- Bonus display should be removed when Flex is active.
- Potential win should show loading while preview values update.

## 11. System Bets and Bankers

System bets let users bet on combinations of selected outcomes.

User-facing behavior:

- System tab becomes useful when enough selections exist.
- Users can choose combination sizes.
- Users can mark selections as bankers.

Banker explanation:

- A banker must win for any system line containing it to win.
- Bankers are included in every relevant combination.

Design behavior:

- Banker control should be visible only when system betting is active.
- Banker badges should be compact and clear.
- Banker mode should not appear for split bets.

## 12. Bet Placement

Users can place bets from the betslip.

Before placement, the app should validate:

- User is logged in.
- Stake is valid.
- Balance is sufficient.
- Markets are active.
- Odds changes are accepted if required.
- Bet type is valid.
- Feature-specific rules are satisfied.

After placement:

- Success state shows ticket details.
- Simulation mode shows simulation results.
- Failure state shows a clear error dialog.

## 13. Bet Booking and Load Bet

### Book Bet

Users can save/book a bet without placing it immediately.

After booking:

- Show booking code.
- Allow user to copy/share the code.

### Load Bet

Users can enter a code to rebuild a betslip.

Expected behavior:

- Load valid selections into the betslip.
- Skip unavailable selections where necessary.
- Restore supported special modes where possible.
- Show clear feedback if a code is invalid or expired.

## 14. Rebet

Users can rebet from bet detail.

Expected behavior:

- If the current betslip is empty, rebuild the previous selections directly.
- If the current betslip has selections, ask whether to replace them.
- If the user is in simulation mode, explain that rebetting can switch back to real mode.
- Restore derived selections like 1UP, 2UP, and Early Goals where possible.

## 15. Bet History

Users can view previous and active bets.

Main views:

- All bets.
- Settled bets.
- Unsettled/open bets.
- Bet detail.

Bet detail should show:

- Ticket status.
- Stake.
- Odds.
- Potential/actual win.
- Selections.
- Cashout option where available.
- Rebet option.

## 16. Cashout

Cashout lets users settle eligible open bets early.

Expected flow:

- User opens an eligible bet.
- App shows cashout value.
- User confirms.
- App submits cashout.
- Success/failure feedback is shown.

Design states:

- Cashout available.
- Cashout unavailable.
- Cashout loading.
- Cashout success.
- Cashout failed.

## 17. Casino

Casino allows users to browse and launch games.

Users can:

- Browse games.
- Search games.
- Browse by provider.
- Browse by category.
- View jackpots.
- View bonus games.
- Launch a game.

Design needs:

- Game cards should show image, title, and enough spacing for touch.
- Provider/category pages should make the current filter clear.
- Game launch should have clear loading and error states.
- If login is required, route the user to login and return them after success.

GoldenRace behavior:

- GoldenRace games use a special lobby flow.
- Users should not see this technical difference; they should simply launch into gameplay.

## 18. Wallet

Wallet features include deposits, withdrawals, pending withdrawals, and transactions.

### Deposit

User flow:

- Select payment method.
- Enter amount.
- Continue to payment.
- Verify payment result.

Design states:

- Payment methods loading.
- Amount invalid.
- Deposit initiated.
- Verification pending.
- Success/failure.

### Withdrawal

User flow:

- Select or enter bank account.
- Verify account.
- Enter amount.
- Submit withdrawal.
- See success or pending state.

Design states:

- Banks loading.
- Account verification loading.
- Invalid account.
- Insufficient balance.
- Withdrawal submitted.
- Withdrawal failed.

### Pending Withdrawals

Users can see pending withdrawal requests and cancel them where allowed.

### Transactions

Users can view transaction history and transaction details.

## 19. Bonuses

The account bonus area should help users understand available and active bonuses.

Expected behavior:

- Show available bonuses.
- Show active bonus state.
- Explain bonus balance where applicable.
- For casino bonuses, show a clear dialog when an active casino bonus affects gameplay.

## 20. Promotions and CMS Pages

Promotions and CMS pages provide content-driven screens.

Users should be able to:

- Browse active promotions.
- Open informational pages.
- Return to betting flows easily.

Design needs:

- Content should be readable on mobile.
- Promotion cards should have clear CTA areas.
- Empty/error states should be graceful.

## 21. Dialogs and Feedback

Dialogs are used for confirmations, errors, and important mode changes.

Common dialogs:

- Error dialog.
- Clear betslip confirmation.
- Replace betslip confirmation.
- Simulation mode/rebet warning.
- Casino bonus dialog.
- Cashout confirmation.

Design guidelines:

- Use one clear primary action.
- Use secondary action for cancel/OK where appropriate.
- Dialogs must appear above the betslip.
- Error messages should be human-readable and action-oriented.

## 22. Important UX Rules

- Do not show controls that do nothing.
- Disabled controls must look disabled.
- If a feature is active, it must be visibly active in both row-level and betslip-level controls.
- If a market is unsupported, explain only when the user is trying to use that feature.
- Prefer market IDs over market names for feature logic, but expose user-friendly labels in the UI.
- Avoid showing duplicate labels such as `Early Goals - Early Goals`.
- When loading affects payout, use a small spinner near the changing value.
- Never leave the user unsure whether a bet was placed, booked, simulated, or rejected.

## 23. Key User Journeys

### Place a Simple Bet

1. User opens home or sports page.
2. User selects an odd.
3. Betslip opens or updates count.
4. User enters stake.
5. User reviews potential win.
6. User places bet.
7. User sees success or error.

### Place a Bet With Early Goals

1. User opens Over/Under market.
2. User switches to Early Goals where supported.
3. User selects an eligible Over outcome.
4. Betslip shows Early Goals active for that selection.
5. User can turn Early Goals off from row or Insure area.
6. Selection returns to base Over/Under.

### Place a Bet With 1UP or 2UP

1. User opens 1X2 market.
2. User switches to 1UP or 2UP where supported.
3. User selects home or away outcome.
4. Betslip shows selected mode.
5. User can switch mode or return to base.

### Use Cut 1

1. User adds enough qualifying selections.
2. User selects Cut 1.
3. Potential win refreshes.
4. Bonus is hidden if incompatible.
5. User places bet with Cut 1 enabled.

### Use Flex

1. User adds enough selections.
2. User selects Flex.
3. User chooses minimum selections to win.
4. Potential win refreshes.
5. User places Flex bet.

### Rebet

1. User opens bet detail.
2. User taps rebet.
3. If betslip has selections, app asks to replace.
4. App rebuilds selections.
5. User reviews and places again.

### Launch Casino Game

1. User opens casino/games.
2. User selects a game.
3. If not logged in, user signs in.
4. App launches gameplay.
5. User returns through casino navigation.

## 24. Open Design Considerations

- Final visual treatment for the Insure feature row.
- Best compact explanation pattern for Cut 1 and Flex.
- Empty states for fixture lists and casino groups.
- Better differentiation between locked, suspended, and unavailable odds.
- Whether the betslip should auto-open after first selection or only update the count.
