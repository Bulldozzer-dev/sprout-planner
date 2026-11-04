# Development walkthrough

A local-first study planner that protects lectures, schedules whole revision sessions before optional deadlines and keeps named plans with completion tracking.

## Run
Open `index.html` in a current browser, or serve the folder with `python -m http.server 8080` and open http://localhost:8080. Use the same browser and origin to access saved plans. No dependency installation or API key is required.

## Two-minute demonstration
1. Choose a Monday, keep the sample inputs and select **Build my week**. Three sessions fit; the eight-hour assignment does not.
2. Mark **Revise NLP** complete and select **Save on this device**.
3. Reload, choose the saved plan and load it. The completed session is preserved.
4. Export a calendar and inspect its session dates. Export a JSON backup for recovery.
5. Set all availability to Tuesday and make a task due Monday. It must remain unscheduled.

## Tests
Run `npm test` (or `node test.js` and `node test_v2.js`). The 20 tests include generated scheduling invariants, deadlines, duplicate saved-plan updates, corrupt backups, storage failure propagation, calendar escaping and UTF-8 line folding. Browser checks also exercised build, completion, saving, reload/load and calendar download.

## Design decisions
- Merge availability, subtract classes, then place tasks by priority, deadline and input order. This makes the decision traceable; it does not optimize total scheduled time.
- Store validated versioned inputs and completed task indices, then recompute the schedule on load. Editing inputs invalidates the result, so stale plans cannot be exported.
- Save up to 20 named plans, keyed by name and week. A matching name/week replaces that plan. Saving is explicit; unsaved completion changes are not automatically durable.
- Downloaded backups validate all inputs and completion indices before replacing the visible plan. Corrupt local data is not silently overwritten.
- Calendar export uses floating local times and folds UTF-8 lines at 75 octets. A stable per-plan/week/task UID supports repeat exports, but some calendar importers may duplicate events. No actual import into a calendar account was tested.

## Boundaries
No accounts, cloud synchronization, deadline dates beyond the chosen week, automatic breaks, notifications or AI scheduling. The greedy scheduler may leave a task out even if a different arrangement would fit it. Device storage can be cleared or blocked; use downloaded backups. No real-user adoption or usability study is claimed.

## Source map
`core.js`: parsing, constraints, scheduler, calendar serialization. `persistence.js`: validation, backups, storage. `app.js`: user interface. `test*.js`: repeatable checks. `docs/`: actual interface captures when available.

Created with AI coding assistance for Simon Wagathiru. See DEVELOPMENT_GUIDE.md for technical walkthrough and tradeoffs.

## Interview preparation

Explain one invariant enforced by the code, show its test, and demonstrate its failure case. Describe the boundary between the UI and core logic. Be able to modify the code without relying on the generated explanation. Do not claim independent development or production usage.
