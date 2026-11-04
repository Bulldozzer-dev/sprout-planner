# Sprout Week Planner

A browser-based prototype of the scheduling part of my Sprout university project. It protects classes, merges availability, allocates whole study sessions by priority and lists tasks that cannot fit. It does not implement the full proposal or an AI assistant.

## Run
Open `index.html` in a modern browser. No installation or API key is needed. For a local web server, run `python -m http.server 8000` in this folder and visit http://localhost:8000.

## Test
With Node.js installed, run `npm test` (or `node test.js`). There are no dependencies to install. Automated checks cover algorithm behavior, validation and edge cases. The GitHub Actions workflow runs the same tests on pushes and pull requests.

## Structure
- `core.js`: pure algorithm, usable from browser and Node
- `app.js`: form handling and safe DOM rendering via textContent
- `index.html` / `style.css`: accessible, responsive interface
- `test.js`: deterministic unit and invariant checks

## Privacy
No network requests, accounts, analytics or server. Data stays in memory in the current page; reloading clears it. Example content is synthetic.

## Scope and tradeoffs
The scheduler uses earliest-fit placement in priority order. It is deterministic but not globally optimal. Tasks cannot be split. There is no deadline model, break policy, date/timezone handling or persistence. The next improvement would be explicit deadlines and a comparison with alternative scheduling heuristics.

## Development note
Created with AI coding assistance for Simon Wagathiru's portfolio. This is a prototype, not evidence of production deployment or user adoption. Local automated test results are recorded in the accompanying project delivery; browser interaction still needs a visual review. Review and understand the implementation before presenting it in an interview.
