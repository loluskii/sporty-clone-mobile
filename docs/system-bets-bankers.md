# System Bets and Bankers

This document explains how system bets and bankers work in the app, and how the line counts are derived.

## Definitions

- **Selection**: A single picked outcome.
- **System bet**: A bet that covers multiple combination sizes (singles, doubles, trebles, etc.).
- **Banker**: A selection that must be included in every system line. If any banker loses, all system lines lose.
- **Fold / Line**: A single combination of selections. A k-fold is one line containing k selections.

## Base System Bet Lines (No Bankers)

With **N selections**, the number of k-fold lines is computed by combinations:

- **C(N, k)** ("N choose k")
- Example: N = 5
  - Singles: C(5,1) = 5
  - Doubles: C(5,2) = 10
  - Trebles: C(5,3) = 10
  - 4-folds: C(5,4) = 5
  - 5-folds: C(5,5) = 1

This is implemented in `src/helpers/combination.js` via `Combination.prototype.choose(n, k)`.

## System Bet Lines With Bankers

When **B bankers** are selected, all lines must include those bankers.
This means the combinations are formed only from the remaining **(N - B)** selections.

For a k-fold, the number of lines becomes:

- **C(N - B, k - B)**, because all B bankers are forced into each line.

### Example: N = 5 selections, B = 1 banker

Remaining non-bankers = 4

- Singles (1-fold): C(4,0) = 1 (the banker alone)
- Doubles (2-fold): C(4,1) = 4
- Trebles (3-fold): C(4,2) = 6
- 4-folds: C(4,3) = 4
- 5-folds: C(4,4) = 1

### Example: N = 5 selections, B = 2 bankers

Remaining non-bankers = 3

- Singles (1-fold): not possible (k < B)
- Doubles (2-fold): C(3,0) = 1 (bankers only)
- Trebles (3-fold): C(3,1) = 3
- 4-folds: C(3,2) = 3
- 5-folds: C(3,3) = 1

### Example: N = 5 selections, B = 3 bankers

Remaining non-bankers = 2

- Trebles (3-fold): C(2,0) = 1
- 4-folds: C(2,1) = 2
- 5-folds: C(2,2) = 1

## Banker Rules Used in This Project

- Bankers are available **only for System bets**.
- Multiple bankers are allowed.
- Bankers are **not allowed** when the betslip contains multiple selections from the same match (split bet). In that case, banker mode must be disabled.

## Implementation Notes

- Combination math is provided in `src/helpers/combination.js`.
- The banker UI toggle is shown in the betslip only for System bets.
- Each selection shows a **B** badge when banker mode is enabled.

## Quick Formula Reference

- **No bankers**: lines for k-fold = C(N, k)
- **With bankers**: lines for k-fold = C(N - B, k - B)
- If k < B, that fold size is not available.
