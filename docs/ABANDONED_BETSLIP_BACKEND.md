# Abandoned Betslip Backend Requirements

## Context

The frontend has implemented abandoned betslip tracking as a best-effort fallback.

Current frontend behavior:

- Tracks betslip activity from selected legs.
- Starts/restarts a 1-hour timer when selections change.
- Stores the current abandoned betslip session in `localStorage`.
- If the tab stays open for 1 hour with no selection activity, it reports the betslip as abandoned.
- If the user closes the browser, the timer stops, but the stored snapshot remains.
- On the next app visit, if the stored session is older than 1 hour, the frontend reports it immediately.

This works as a frontend fallback, but it is not fully reliable because browser JavaScript cannot run after the user closes the browser, loses network, or never returns.

To make abandoned betslip tracking complete, the backend should own the abandonment decision.

## Current Frontend Report Endpoint

The frontend currently reports abandoned slips to:

```http
POST /api/v2/crm/betslip/abandoned?clientId=4&client_id=4
```

Example payload:

```json
{
  "userId": "12345",
  "username": "08012345678",
  "totalLegs": 6,
  "potentialPayout": 75000,
  "sessionId": "session-abc-123",
  "eventId": "abandon-event-001",
  "betslipSnapshot": {
    "betslipType": "Multiple",
    "betType": "Multiple",
    "stake": 100,
    "totalStake": 100,
    "totalOdds": 12.5,
    "potentialPayout": 1250,
    "useBonus": false,
    "useCashback": false,
    "useCutOne": false,
    "useFlex": false,
    "flexAmount": 2,
    "useEarlyGoal": false,
    "selections": [
      {
        "fixtureId": "66456904",
        "matchId": 66456904,
        "eventId": 1770,
        "sportId": 1,
        "producerId": 0,
        "marketId": 1,
        "marketName": "1X2",
        "outcomeId": "1",
        "outcomeName": "Home",
        "specifier": "",
        "odds": 1.85,
        "eventName": "Team A vs Team B",
        "startTime": "2026-07-02T15:00:00Z",
        "type": "prematch"
      }
    ]
  }
}
```

## Recommended Backend Design

### 1. Add Betslip Activity Upsert Endpoint

The frontend should send betslip activity to the backend whenever the user changes the selected legs.

Recommended endpoint:

```http
POST /api/v2/crm/betslip/activity?clientId=4
```

Recommended payload:

```json
{
  "userId": "12345",
  "username": "08012345678",
  "sessionId": "session-abc-123",
  "totalLegs": 6,
  "potentialPayout": 75000,
  "betslipSnapshot": {},
  "lastActivityAt": "2026-07-02T12:00:00Z"
}
```

Behavior:

- Create a new betslip session if `sessionId` does not exist.
- Update the existing betslip session if `sessionId` already exists.
- Store the latest `betslipSnapshot`, `totalLegs`, `potentialPayout`, and `lastActivityAt`.
- Keep the session status as `active`.

### 2. Persist Betslip Sessions

Suggested table fields:

| Field | Purpose |
| --- | --- |
| `id` | Internal primary key |
| `client_id` | Sportsbook client id |
| `user_id` | User id |
| `username` | Username or phone number |
| `session_id` | Frontend-generated betslip session id |
| `event_id` | Stable CRM/idempotency event id |
| `total_legs` | Number of selections |
| `potential_payout` | Potential payout at last activity |
| `betslip_snapshot` | JSON snapshot of selections and betslip details |
| `status` | `active`, `abandoned`, `placed`, `cleared`, `expired` |
| `last_activity_at` | Last meaningful user activity on betslip |
| `abandoned_at` | When backend marked session abandoned |
| `created_at` | Created timestamp |
| `updated_at` | Updated timestamp |

Recommended unique key:

```text
client_id + session_id
```

### 3. Add Scheduled Abandonment Job

Run a scheduled job every few minutes.

Find sessions where:

```text
status = active
last_activity_at <= now - 1 hour
```

For each matching session:

- Mark status as `abandoned`.
- Set `abandoned_at`.
- Send CRM abandoned betslip event.
- Use an idempotency key to avoid duplicate CRM events.

Recommended idempotency key:

```text
abandoned-betslip:{clientId}:{sessionId}
```

### 4. Add Betslip Session Close Endpoint

The frontend should notify the backend when a betslip is no longer abandonable.

Recommended endpoint:

```http
POST /api/v2/crm/betslip/session/close?clientId=4
```

Payload for placed bet:

```json
{
  "sessionId": "session-abc-123",
  "status": "placed"
}
```

Payload for cleared betslip:

```json
{
  "sessionId": "session-abc-123",
  "status": "cleared"
}
```

Behavior:

- Mark the session as `placed` or `cleared`.
- Do not send abandoned CRM messages for closed sessions.

### 5. Handle Retries and Idempotency

Backend should treat abandoned CRM events as idempotent.

If the scheduled job retries, the same `clientId + sessionId` should not create duplicate CRM messages.

Recommended rules:

- Only `active` sessions can become `abandoned`.
- `placed`, `cleared`, and `abandoned` sessions should not be abandoned again.
- CRM event dispatch should use the stable idempotency key.

### 6. Cleanup Old Sessions

Add a cleanup policy for old sessions.

Recommended:

- Keep `active` sessions only for a limited window, such as 7 days.
- Keep `abandoned`, `placed`, and `cleared` sessions according to reporting/audit requirements.
- Mark very old active sessions as `expired` if they should no longer trigger CRM.

## Why Backend Ownership Is Needed

Frontend-only tracking cannot guarantee abandonment reporting because:

- Browser timers stop when the tab/browser closes.
- The user may never return.
- Network may be unavailable at the exact timer moment.
- Mobile browsers may throttle or kill background tabs.
- The frontend cannot reliably run scheduled jobs.

Backend tracking solves this because:

- The backend persists the latest betslip activity.
- The backend scheduler can detect inactivity independently.
- Abandonment can be processed even if the user never returns.
- CRM events can be retried safely.

## Frontend Integration After Backend Update

Once the backend activity endpoint is available, the frontend should be adjusted to:

- Send/upsert betslip activity when selected legs change.
- Continue storing local fallback if desired.
- Notify backend when the betslip is placed.
- Notify backend when the betslip is cleared.
- Stop deciding abandonment purely on the frontend.

The current frontend abandoned report endpoint can remain as fallback until backend-owned abandonment is fully live.
