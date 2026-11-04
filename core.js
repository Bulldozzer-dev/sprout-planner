(function (root) {
  "use strict";
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  function time(s) {
    if (!/^\d{2}:\d{2}$/.test(s)) throw Error("Use times such as 09:00.");
    const [h, m] = s.split(":").map(Number);
    if (h > 23 || m > 59) throw Error("Time is outside the day.");
    return h * 60 + m;
  }
  function clock(n) {
    return (
      String(Math.floor(n / 60)).padStart(2, "0") +
      ":" +
      String(n % 60).padStart(2, "0")
    );
  }
  function windows(text) {
    return text
      .split("\n")
      .filter((x) => x.trim())
      .map((line, i) => {
        const p = line.trim().split(/\s+/);
        if (p.length !== 3 || !days.includes(p[0]))
          throw Error("Window line " + (i + 1) + ": use Mon 09:00 17:00.");
        const start = time(p[1]),
          end = time(p[2]);
        if (start >= end) throw Error("Window end must be after its start.");
        return { day: p[0], start, end };
      });
  }
  function tasks(text) {
    return text
      .split("\n")
      .filter((x) => x.trim())
      .map((line, i) => {
        const p = line.split("|").map((x) => x.trim());
        if (
          (p.length !== 3 && p.length !== 4) ||
          !p[0] ||
          !/^\d+$/.test(p[1]) ||
          !["1", "2", "3"].includes(p[2])
        )
          throw Error(
            "Task line " + (i + 1) + ": use Task name | minutes | priority (1â€“3).",
          );
        const duration = Number(p[1]);
        if (duration < 1 || duration > 1440)
          throw Error("Task duration must be 1â€“1440 minutes.");
        if (p[0].length > 160)
          throw Error("Task names must be at most 160 characters.");
        const deadline = p[3] || null;
        if (deadline && !days.includes(deadline))
          throw Error("Deadline must be a day such as Tue.");
        return { name: p[0], duration, priority: Number(p[2]), order: i, deadline };
      });
  }
  function merge(list) {
    const out = [];
    for (const w of [...list].sort(
      (a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.start - b.start,
    )) {
      const last = out[out.length - 1];
      if (last && last.day === w.day && w.start <= last.end)
        last.end = Math.max(last.end, w.end);
      else out.push({ ...w });
    }
    return out;
  }
  function schedule(availability, classes, work) {
    validateInputs(availability, classes, work);
    let free = merge(availability);
    for (const block of classes) {
      free = free.flatMap((w) => {
        if (w.day !== block.day || block.end <= w.start || block.start >= w.end)
          return [w];
        const parts = [];
        if (block.start > w.start) parts.push({ ...w, end: block.start });
        if (block.end < w.end) parts.push({ ...w, start: block.end });
        return parts;
      });
    }
    const planned = [],
      unscheduled = [];
    for (const task of [...work].sort(
      (a, b) =>
        a.priority - b.priority ||
        (a.deadline ? days.indexOf(a.deadline) : 7) -
          (b.deadline ? days.indexOf(b.deadline) : 7) ||
        a.order - b.order,
    )) {
      const slot = free.find(
        (w) =>
          w.end - w.start >= task.duration &&
          (!task.deadline || days.indexOf(w.day) <= days.indexOf(task.deadline)),
      );
      if (!slot) {
        unscheduled.push({ ...task });
        continue;
      }
      planned.push({
        ...task,
        day: slot.day,
        start: slot.start,
        end: slot.start + task.duration,
      });
      slot.start += task.duration;
    }
    planned.sort(
      (a, b) => days.indexOf(a.day) - days.indexOf(b.day) || a.start - b.start,
    );
    return { planned, unscheduled };
  }
  function validateInputs(availability, classes, work) {
    for (const list of [availability, classes]) {
      if (!Array.isArray(list) || list.length > 500)
        throw Error("Use up to 500 windows.");
      for (const w of list)
        if (
          !w ||
          !days.includes(w.day) ||
          !Number.isInteger(w.start) ||
          !Number.isInteger(w.end) ||
          w.start < 0 ||
          w.end > 1440 ||
          w.start >= w.end
        )
          throw Error("Invalid time window.");
    }
    if (!Array.isArray(work) || !work.length || work.length > 200)
      throw Error("Use 1â€“200 tasks.");
    for (const t of work)
      if (
        !t ||
        typeof t.name !== "string" ||
        !t.name.trim() ||
        t.name.length > 160 ||
        !Number.isInteger(t.duration) ||
        t.duration < 1 ||
        t.duration > 1440 ||
        ![1, 2, 3].includes(t.priority) ||
        !Number.isInteger(t.order) ||
        t.order < 0 ||
        (t.deadline && !days.includes(t.deadline))
      )
        throw Error("Invalid task.");
    if (new Set(work.map((t) => t.order)).size !== work.length)
      throw Error("Task order must be unique.");
  }
  function monday(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw Error("Choose a Monday for the week start.");
    const date = new Date(value + "T00:00:00Z");
    if (
      !Number.isFinite(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value ||
      date.getUTCDay() !== 1
    )
      throw Error("Week start must be a valid Monday.");
    return date;
  }
  function calendar(result, week, name = "Sprout plan") {
    const start = monday(week);
    const escape = (s) =>
      String(s)
        .replace(/\\/g, "\\\\")
        .replace(/\n/g, "\\n")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/\r/g, "");
    const stamp = (day, minute) => {
      const d = new Date(start);
      d.setUTCDate(d.getUTCDate() + days.indexOf(day));
      d.setUTCMinutes(minute);
      return d.toISOString().replace(/[-:]/g, "").slice(0, 15);
    };
    let planHash = 2166136261;
    for (const ch of name)
      planHash = Math.imul(planHash ^ ch.codePointAt(0), 16777619) >>> 0;
    const stampNow = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Simon Wagathiru//Sprout//EN",
      "CALSCALE:GREGORIAN",
    ];
    for (const t of result.planned) {
      lines.push(
        "BEGIN:VEVENT",
        "UID:sprout-" + planHash + "-" + week + "-" + t.order + "@planner.local",
        "DTSTAMP:" + stampNow,
        "DTSTART:" + stamp(t.day, t.start),
        "DTEND:" + stamp(t.day, t.end),
        "SUMMARY:" + escape(t.name),
        "DESCRIPTION:" + escape(name + "; priority " + t.priority),
        "END:VEVENT",
      );
    }
    lines.push("END:VCALENDAR");
    // RFC 5545 folds physical lines at 75 UTF-8 octets, including continuation spaces.
    return (
      lines
        .map((line) => {
          const out = [];
          let part = "",
            size = 0;
          for (const ch of line) {
            const bytes = new TextEncoder().encode(ch).length;
            if (size + bytes > 75) {
              out.push(part);
              part = " ";
              size = 1;
            }
            part += ch;
            size += bytes;
          }
          out.push(part);
          return out.join("\r\n");
        })
        .join("\r\n") + "\r\n"
    );
  }
  const api = {
    days,
    time,
    clock,
    windows,
    tasks,
    schedule,
    validateInputs,
    monday,
    calendar,
  };
  if (typeof module !== "undefined") module.exports = api;
  else root.Planner = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
