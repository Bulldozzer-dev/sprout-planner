# Sprout Week Planner — scheduling constraints

### The problem and a short explanation

Students need revision time, but lectures cannot simply move to make room. A scheduler should acknowledge that some tasks cannot fit rather than generate a visually full but impossible calendar.

Practice explanation: “This is a working scheduling slice of my Sprout proposal. It starts with available windows, subtracts fixed classes, then places complete tasks in priority order. If no remaining window fits a task, the task is explicitly listed as unscheduled.”

### Files and input model

Open `sprout-planner.html`, or extract its source and open `index.html`. The domain functions are in `core.js`; form handling and JSON export are in `app.js`.

Availability and classes use one line per interval, such as `Mon 09:00 17:00`. Tasks use `Task name | minutes | priority`. Priority 1 is highest and 3 is lowest. A task's input position is stored as `order` to keep equal-priority tasks deterministic.

`time()` turns HH:MM into minutes since midnight: 09:30 becomes 570. `clock()` converts back. Integer intervals make overlap and duration arithmetic easier than working with display strings. The prototype models a repeating week, not calendar dates or timezones, and cannot represent an overnight interval in one line.

### Algorithm, step by step

1. `windows()` validates day names and time ranges. `tasks()` validates names, whole-minute durations and priorities.
2. `merge()` sorts availability by day and start time, then joins overlapping or touching intervals. This prevents double-counting available time.
3. `schedule()` subtracts every fixed class from each free interval. A class can remove an interval, shorten it or divide it into two gaps.
4. Sort tasks by priority, then input order.
5. Find the earliest free gap long enough for each complete task. Assign its start/end and advance that gap's start.
6. If no gap fits, put the task in `unscheduled`.
7. Sort scheduled results into chronological order for display.

Example: availability 09:00–13:00 minus a 10:00–12:00 class leaves 09:00–10:00 and 12:00–13:00. A 90-minute task cannot fit either gap, even though their combined free time is 120 minutes. The prototype does not split sessions.

### Tradeoffs and complexity

This is a greedy heuristic: it chooses a locally convenient placement without searching all combinations. It is simple and repeatable but not globally optimal. A long high-priority task may prevent several short tasks from fitting. The prototype optimizes neither total study minutes nor a formal utility score.

With A initial availability intervals, C class intervals, F resulting gaps and T tasks, sorting costs roughly A log A and T log T. Subtraction scans the evolving free-gap list, and task placement scans up to F gaps for each task. This is appropriate for a small student timetable; no large-scale performance benchmark was run.

### Demonstration and tests

Use the supplied example. It should schedule three tasks and leave the 480-minute assignment unscheduled. Add more availability or shorten the assignment, then regenerate. Insert overlapping availability and show that it does not create duplicate capacity. Download the generated JSON.

Run `node test.js`. All 8 tests passed locally. They cover protected classes, merged availability, priority ordering, whole-session behavior, completely occupied time, input validation, non-mutation of input data and scheduling invariants across 100 generated cases.

An invariant is a rule that must always hold. Here the tests assert that sessions stay within availability, do not cross the blocked class, do not overlap one another, retain their requested durations, and account for every task as scheduled or unscheduled.

### Interview questions and an extension

**Where is the AI?** There is no AI in this scheduler. The larger proposal includes AI study assistance, but scheduling feasibility is enforced with deterministic rules here.

**Why not always fit a task by splitting it?** Splitting is a product decision. A 90-minute practical may need uninterrupted time. This version makes the whole-session policy explicit.

**What is missing?** Deadlines, breaks, calendar dates, saving profiles, calendar synchronization, task splitting and an optimization objective.

Your extension: add a configurable minimum break between revision sessions. Decide whether breaks apply before or after classes as well. Write tests for an exactly fitting gap and a gap that becomes too short once a break is required.



Created with AI coding assistance. Local tests passed. Browser verification remains pending. Source and automated test workflow are available in this repository.
