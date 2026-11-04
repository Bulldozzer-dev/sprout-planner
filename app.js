"use strict";
const $ = (id) => document.getElementById(id);
let last = null,
  completed = new Set(),
  saved = [];
function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
function message(t) {
  $("message").textContent = t;
}
const today = new Date();
today.setDate(today.getDate() - ((today.getDay() + 6) % 7));
$("week-start").value =
  today.getFullYear() +
  "-" +
  String(today.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(today.getDate()).padStart(2, "0");
function input() {
  return {
    version: 2,
    name: $("plan-name").value,
    week: $("week-start").value,
    available: $("available").value,
    classes: $("classes").value,
    tasks: $("tasks").value,
    completed: [...completed],
  };
}
function download(content, type, name) {
  const u = URL.createObjectURL(new Blob([content], { type })),
    a = el("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
function render() {
  $("results").replaceChildren();
  $("stats").replaceChildren();
  $("result-title").textContent = $("plan-name").value;
  const stats = el("div", undefined, "stats");
  for (const [v, l] of [
    [last.planned.length, "Sessions planned"],
    [last.planned.reduce((s, t) => s + t.duration, 0), "Minutes planned"],
    [completed.size, "Sessions completed"],
  ]) {
    const s = el("div", undefined, "stat");
    s.append(el("strong", v), el("span", l));
    stats.append(s);
  }
  $("stats").append(stats);
  const week = el("div", undefined, "week");
  for (const day of Planner.days) {
    const sessions = last.planned.filter((t) => t.day === day);
    if (!sessions.length) continue;
    const col = el("section", undefined, "day");
    col.append(el("h3", day));
    for (const t of sessions) {
      const card = el(
          "div",
          undefined,
          "session" + (completed.has(t.order) ? " done" : ""),
        ),
        label = el("label"),
        check = el("input");
      check.type = "checkbox";
      check.checked = completed.has(t.order);
      check.setAttribute("aria-label", "Mark " + t.name + " complete");
      check.addEventListener("change", () => {
        check.checked ? completed.add(t.order) : completed.delete(t.order);
        render();
        message("Completion updated. Save on this device to keep it.");
      });
      label.append(check, el("span", t.name));
      card.append(
        el(
          "small",
          Planner.clock(t.start) +
            "–" +
            Planner.clock(t.end) +
            " · priority " +
            t.priority,
        ),
        label,
      );
      col.append(card);
    }
    week.append(col);
  }
  $("results").append(week);
  if (!last.planned.length)
    $("results").append(
      el("p", "No sessions fit. Review time and deadlines.", "empty"),
    );
  if (last.unscheduled.length) {
    $("results").append(el("h3", "Still needs time"));
    for (const t of last.unscheduled)
      $("results").append(
        el(
          "p",
          t.name +
            " · " +
            t.duration +
            " minutes" +
            (t.deadline ? " · due " + t.deadline : "") +
            ". No remaining continuous window fits before the deadline.",
        ),
      );
  }
  $("calendar").disabled = !last.planned.length;
  $("print").disabled = false;
}
function build() {
  const p = PlanStore.validate(input());
  last = Planner.schedule(
    Planner.windows(p.available),
    Planner.windows(p.classes),
    Planner.tasks(p.tasks),
  );
  render();
  message(
    last.planned.length +
      " scheduled · " +
      last.unscheduled.length +
      " still need time.",
  );
}
function invalidate() {
  last = null;
  completed.clear();
  $("calendar").disabled = true;
  $("print").disabled = true;
  $("stats").replaceChildren();
  $("results").textContent =
    "Inputs changed. Build the week again before saving or exporting.";
  message("Inputs changed. Rebuild the plan.");
}
for (const id of ["plan-name", "week-start", "available", "classes", "tasks"])
  $(id).addEventListener("input", invalidate);
$("planner").addEventListener("submit", (e) => {
  e.preventDefault();
  try {
    completed.clear();
    build();
  } catch (e) {
    message(e.message);
  }
});
function refreshSaved() {
  saved = PlanStore.read(localStorage);
  $("saved").replaceChildren();
  const first = el("option", "Choose a saved plan");
  first.value = "";
  $("saved").append(first);
  saved.forEach((p, i) => {
    const o = el("option", p.week + " / " + p.name);
    o.value = i;
    $("saved").append(o);
  });
}
function load(p) {
  p = PlanStore.validate(p);
  for (const [id, k] of [
    ["plan-name", "name"],
    ["week-start", "week"],
    ["available", "available"],
    ["classes", "classes"],
    ["tasks", "tasks"],
  ])
    $(id).value = p[k];
  completed = new Set(p.completed);
  build();
}
$("save").addEventListener("click", () => {
  try {
    if (!last) throw Error("Build the plan before saving.");
    PlanStore.save(localStorage, input());
    refreshSaved();
    message("Saved on this device. Download a backup for recovery.");
  } catch (e) {
    message("Could not save: " + e.message + " Download a backup instead.");
  }
});
$("load").addEventListener("click", () => {
  try {
    if ($("saved").value === "") throw Error("Choose a saved plan.");
    load(saved[Number($("saved").value)]);
    message("Saved plan loaded.");
  } catch (e) {
    message(e.message);
  }
});
$("backup").addEventListener("click", () => {
  try {
    if (!last) throw Error("Build the plan before downloading a backup.");
    download(
      JSON.stringify(PlanStore.validate(input()), null, 2),
      "application/json",
      "sprout-plan.json",
    );
    message("Backup downloaded.");
  } catch (e) {
    message(e.message);
  }
});
$("restore").addEventListener("change", async (e) => {
  try {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 100000) throw Error("Backup is too large.");
    load(PlanStore.restore(await f.text()));
    message("Backup loaded for review. Save on this device to keep it.");
  } catch (e) {
    message("Could not restore: " + e.message);
  } finally {
    e.target.value = "";
  }
});
$("calendar").addEventListener("click", () => {
  try {
    if (!last) return;
    download(
      Planner.calendar(last, $("week-start").value, $("plan-name").value),
      "text/calendar;charset=utf-8",
      "sprout-week.ics",
    );
    message(
      "Calendar exported in local time. Reimporting may create duplicates in some apps.",
    );
  } catch (e) {
    message(e.message);
  }
});
$("print").addEventListener("click", () => window.print());
try {
  refreshSaved();
} catch (e) {
  message(
    "Device storage unavailable: " +
      e.message +
      " You can still build and download a plan.",
  );
}
