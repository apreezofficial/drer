const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

function cleanText(value, max = 4000) {
  if (typeof value !== "string" || !value.trim() || value.length > max)
    throw new Error("Please provide a valid request.");
  return value.trim();
}
function filename(value) {
  const name = cleanText(value, 120)
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} _-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 65);
  if (!name || name === "." || name === "..")
    throw new Error("Choose a name containing letters or numbers.");
  return name;
}
function resolveClock(value, now = Date.now(), day) {
  const match = String(value)
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) throw new Error("Tell me a time such as 6:42pm or 18:42.");
  let hour = Number(match[1]);
  const minute = Number(match[2] || 0),
    period = match[3]?.toLowerCase();
  if (hour > 23 || minute > 59 || (period && (hour < 1 || hour > 12)))
    throw new Error("That alarm time is not valid.");
  if (period) hour = (hour % 12) + (period === "pm" ? 12 : 0);
  const hours =
    !period && hour >= 1 && hour <= 12 ? [hour % 12, (hour % 12) + 12] : [hour];
  const candidates = [];
  for (const h of hours) {
    for (const offset of [0, 1]) {
      if (day === "tomorrow" && offset === 0) continue;
      if (day === "today" && offset === 1) continue;
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      d.setHours(h, minute, 0, 0);
      if (d.getTime() > now) candidates.push(d);
    }
  }
  if (!candidates.length)
    throw new Error(
      "That time has passed today. Say “tomorrow” or choose a future time.",
    );
  return candidates.sort((a, b) => a - b)[0].toISOString();
}
function parseRequest(input, now = Date.now()) {
  const text = cleanText(input)
    .replace(/^(?:(?:hey|hi)[,\s]+)?(?:drer[,!:\s]+)?/i, "")
    .replace(/\balarm(?=to|at|for)/gi, "alarm ")
    .trim();
  if (
    /^(?:list|show)(?: me)?(?: my)? (?:reminders|timers|alarms)[.!]?$/i.test(
      text,
    )
  )
    return { kind: "list_reminders" };
  if (
    /^(?:cancel|stop|clear|dismiss) (?:the |my |all )?(?:timers?|alarms?|reminders?)[.!]?$/i.test(
      text,
    )
  )
    return { kind: "cancel_reminders" };
  const reminder = text.match(
    /^(?:remind me|(?:set|start|create)(?: me)? (?:a |an |the |my )?(?:timer|alarm))\s*(?:(?:in|for|of)\s*)?(\d+(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h)\b(?:\s+(?:(?:to|about|called)\s+)?(.+))?[.!]?$/i,
  );
  if (reminder) {
    const factor = /^s/i.test(reminder[2])
      ? 1000
      : /^m/i.test(reminder[2])
        ? 60000
        : 3600000;
    const delay = Number(reminder[1]) * factor;
    if (delay < 1000 || delay > 365 * 86400000)
      throw new Error("Use a time between one second and one year.");
    const category = /alarm/i.test(text)
      ? "alarm"
      : /timer/i.test(text)
        ? "timer"
        : "reminder";
    return {
      kind: "reminder",
      category,
      title:
        reminder[3]?.replace(/\s+for me[.!]?$/i, "").trim() ||
        (category === "timer"
          ? "Timer finished"
          : category === "alarm"
            ? "Alarm"
            : "Reminder"),
      dueAt: new Date(now + delay).toISOString(),
    };
  }
  const alarm = text.match(
    /^(?:(?:set|create)(?: me)? (?:an? |the |my )?(?:alarm|reminder)|wake me|remind me)\s+(?:to|at|for)?\s*(?:(today|tomorrow)\s+(?:at\s+)?)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)(?:\s+(today|tomorrow))?(?:\s+(?:to|about)\s+(.+?))?(?:\s+for me)?[.!]?$/i,
  );
  if (alarm)
    return {
      kind: "reminder",
      category: "alarm",
      title: alarm[4] || "Alarm",
      dueAt: resolveClock(alarm[2], now, alarm[1] || alarm[3]),
    };
  if (/^(?:list|show)(?: me)?(?: my)? (?:installed )?apps[.!]?$/i.test(text))
    return { kind: "list_applications" };
  const music = text.match(
    /^(play|pause|resume|stop|next|previous)(?:\s+(?:some|my|the))?\s+(?:spotify(?:\s+music)?|music(?:\s+on\s+spotify)?|song|track)(?:\s+for me)?(?:\s+please)?[.!]?$/i,
  );
  if (music)
    return {
      kind: "spotify_control",
      command: /^(?:play|resume)$/i.test(music[1])
        ? "play"
        : /^(?:pause|stop)$/i.test(music[1])
          ? "pause"
          : music[1].toLowerCase(),
    };
  const application = text.match(
    /^(?:open|launch|start)\s+(?:the\s+)?(.+?)(?:\s+(?:app|application|for me))?[.!]?$/i,
  );
  if (
    application &&
    !/\b(timer|alarm|countdown|reminder)\b/i.test(application[1])
  )
    return {
      kind: "open_application",
      application: cleanText(application[1], 100),
    };
  const note = text.match(
    /^(?:save|write|create)(?: me)? (?:a )?note(?: called)?\s+["“]?([^:”“"]+)["”]?\s*:\s*([\s\S]+)$/i,
  );
  if (note)
    return {
      kind: "note",
      name: filename(note[1]),
      content: cleanText(note[2]),
    };
  if (
    /^(?:build|create|make)(?: me)? (?:a )?habit tracker(?: app)?[.!]?$/i.test(
      text,
    )
  )
    return { kind: "habit_tracker", name: "habit-tracker" };
  const search = text.match(
    /^(?:search (?:the )?web(?: for)?|research|browse for)\s+(.+)$/i,
  );
  if (search) return { kind: "web_search", query: cleanText(search[1], 500) };
  const meeting = text.match(
    /^(?:schedule|draft|create)(?: a)? (?:meeting|event)(?: called)?\s+["“]?(.+?)["”]?\s+tomorrow at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\s+for\s+(\d+)\s+minutes)?[.!]?$/i,
  );
  if (meeting) {
    let hour = Number(meeting[2]);
    const minute = Number(meeting[3] || 0);
    const period = meeting[4]?.toLowerCase();
    if (period) {
      if (hour < 1 || hour > 12)
        throw new Error("Use an hour from 1 to 12 with am or pm.");
      hour = (hour % 12) + (period === "pm" ? 12 : 0);
    }
    if (hour > 23 || minute > 59) throw new Error("Use a valid meeting time.");
    const start = new Date(now);
    start.setDate(start.getDate() + 1);
    start.setHours(hour, minute, 0, 0);
    const duration = Number(meeting[5] || 30);
    if (duration < 1 || duration > 1440)
      throw new Error("Use a meeting duration between 1 and 1440 minutes.");
    return {
      kind: "calendar_draft",
      title: cleanText(meeting[1], 200),
      startAt: start.toISOString(),
      endAt: new Date(start.getTime() + duration * 60000).toISOString(),
    };
  }
  return null;
}
function escapeICS(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
function icsDate(value) {
  return new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}
function calendarFile(action, now = new Date()) {
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//DRER//Desktop//EN",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@drer.local`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(action.startAt)}`,
    `DTEND:${icsDate(action.endAt)}`,
    `SUMMARY:${escapeICS(action.title)}`,
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
const habitTracker = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Daily momentum — DRER starter</title><style>*{box-sizing:border-box}body{margin:0;background:#edf0e9;color:#26392e;font-family:system-ui;padding:70px 24px}.card{max-width:700px;margin:auto;background:#fafbf7;border:1px solid #c9d3c5;border-radius:20px;padding:40px}small{letter-spacing:2px;color:#72816f}h1{font-weight:500;font-size:42px;letter-spacing:-2px;margin:14px 0}p{color:#70806c}label{display:flex;align-items:center;gap:14px;padding:22px 0;border-top:1px solid #d7dfd2;font-size:18px}input{width:23px;height:23px;accent-color:#6a856b}.progress{margin:24px 0;background:#dce5d7;height:7px;border-radius:20px;overflow:hidden}.bar{height:100%;width:0;background:#6f8f6e;transition:width .2s}footer{font-size:11px;color:#8a9785;margin-top:25px}button{background:#2d4534;color:white;border:0;padding:10px 15px;border-radius:7px;margin-top:15px;cursor:pointer}</style></head><body><main class="card"><small>YOUR DAILY MOMENTUM</small><h1>A little better, every day.</h1><p id="summary">Your habits are saved in this browser.</p><div class="progress"><div class="bar" id="bar"></div></div><div id="habits"></div><button id="reset">Start a fresh day</button><footer>Working local starter generated by DRER. No AI or server required.</footer></main><script>const habits=['Read for 20 minutes','Go for a walk','Build something small'];let checked=[];try{checked=JSON.parse(localStorage.getItem('drer-habits')||'[]')}catch{}if(!Array.isArray(checked))checked=[];const root=document.getElementById('habits');function update(){try{localStorage.setItem('drer-habits',JSON.stringify(checked))}catch{}document.getElementById('bar').style.width=(checked.length/habits.length*100)+'%';document.getElementById('summary').textContent=checked.length+' of '+habits.length+' habits complete. Saved locally.'}habits.forEach((name,i)=>{const label=document.createElement('label');const input=document.createElement('input');input.type='checkbox';input.checked=checked.includes(i);input.addEventListener('change',()=>{checked=input.checked?[...new Set([...checked,i])]:checked.filter(x=>x!==i);update()});label.append(input,document.createTextNode(name));root.append(label)});document.getElementById('reset').onclick=()=>{checked=[];root.querySelectorAll('input').forEach(x=>x.checked=false);update()};update();</script></body></html>`;
class ActionStore {
  constructor(
    directory,
    { clock = () => Date.now(), onReminder = () => {}, workspace } = {},
  ) {
    this.directory = directory;
    this.workspace = workspace || path.join(directory, "workspace");
    this.clock = clock;
    this.onReminder = onReminder;
    this.state = { reminders: [], activity: [] };
    this.pending = new Map();
    this.ready = false;
  }
  async init() {
    await fs.mkdir(this.directory, { recursive: true, mode: 0o700 });
    try {
      const data = JSON.parse(
        await fs.readFile(path.join(this.directory, "state.json"), "utf8"),
      );
      if (Array.isArray(data.reminders) && Array.isArray(data.activity))
        this.state = data;
    } catch (e) {
      if (e.code !== "ENOENT")
        throw new Error(
          "DRER state could not be read. Your existing data has not been overwritten.",
        );
    }
    this.ready = true;
    return this;
  }
  async persist() {
    const operation = (this.writes || Promise.resolve())
      .catch(() => {})
      .then(async () => {
        const file = path.join(this.directory, "state.json");
        const temp = file + ".tmp";
        await fs.writeFile(temp, JSON.stringify(this.state, null, 2), {
          mode: 0o600,
        });
        await fs.rename(temp, file);
      });
    this.writes = operation;
    return operation;
  }
  summary() {
    return {
      reminders: this.state.reminders.slice(-30),
      activity: this.state.activity.slice(-30).reverse(),
    };
  }
  async tick() {
    const due = this.state.reminders.filter(
      (x) =>
        x.status === "scheduled" && new Date(x.dueAt).getTime() <= this.clock(),
    );
    if (!due.length) return;
    for (const item of due) {
      item.status = item.native ? "due-in-apple-reminders" : "delivered";
      if (!item.native) item.deliveredAt = new Date(this.clock()).toISOString();
    }
    await this.persist();
    for (const item of due) if (!item.native) this.onReminder(item);
  }
  plan(action) {
    const id = crypto.randomUUID();
    this.pending.set(id, { action, expires: this.clock() + 600000 });
    return { id, ...action };
  }
  take(id) {
    const item = this.pending.get(id);
    this.pending.delete(id);
    if (!item || item.expires < this.clock())
      throw new Error(
        "This action expired or was already handled. Make the request again.",
      );
    return item.action;
  }
  cancel(id) {
    this.pending.delete(id);
  }
  async execute(action) {
    let result;
    if (action.kind === "reminder") {
      const reminder = {
        id: crypto.randomUUID(),
        category: action.category || "reminder",
        title: action.title,
        dueAt: action.dueAt,
        status: "scheduled",
      };
      this.state.reminders.push(reminder);
      result = {
        text: `${action.category === "timer" ? "Timer started" : action.category === "alarm" ? "Alarm set" : "Reminder scheduled"}: ${action.title}\n${new Date(action.dueAt).toLocaleString()} · DRER stays running to ring it.`,
        kind: "reminder",
        reminder,
      };
    } else if (action.kind === "cancel_reminders") {
      let count = 0;
      for (const reminder of this.state.reminders) {
        if (reminder.status === "scheduled") {
          reminder.status = "cancelled";
          count++;
        }
      }
      result = {
        kind: "cancel_reminders",
        text: `Cancelled ${count} active timer${count === 1 ? "" : "s"} / reminder${count === 1 ? "" : "s"}.`,
      };
    } else if (
      action.kind === "note" ||
      action.kind === "habit_tracker" ||
      action.kind === "calendar_draft"
    ) {
      const folder = this.workspace;
      await fs.mkdir(folder, { recursive: true, mode: 0o700 });
      const stamp =
        new Date(this.clock())
          .toISOString()
          .replace(/[^0-9]/g, "")
          .slice(0, 17) +
        "-" +
        crypto.randomBytes(2).toString("hex");
      const file =
        action.kind === "note"
          ? `${filename(action.name)}-${stamp}.md`
          : action.kind === "habit_tracker"
            ? `${stamp}-habit-tracker/index.html`
            : `${filename(action.title)}-${stamp}.ics`;
      const target = path.resolve(folder, file);
      if (!target.startsWith(folder + path.sep))
        throw new Error("Invalid workspace path.");
      await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
      const content =
        action.kind === "note"
          ? action.content
          : action.kind === "habit_tracker"
            ? habitTracker
            : calendarFile(action, new Date(this.clock()));
      await fs.writeFile(target, content, { flag: "wx", mode: 0o600 });
      result = {
        kind: action.kind,
        path: target,
        text:
          action.kind === "note"
            ? `Note saved: ${path.basename(target)}`
            : action.kind === "habit_tracker"
              ? "Working habit tracker created. Open the preview and try a habit. This is a local starter template."
              : "Calendar draft saved as an .ics file. Import it into Calendar to add the event.",
      };
    } else throw new Error("This action cannot be executed locally.");
    this.state.activity.push({
      id: crypto.randomUUID(),
      kind: action.kind,
      text: result.text,
      path: result.path,
      at: new Date(this.clock()).toISOString(),
    });
    this.state.activity = this.state.activity.slice(-100);
    await this.persist();
    return result;
  }
}
module.exports = {
  parseRequest,
  ActionStore,
  calendarFile,
  filename,
  cleanText,
  resolveClock,
};
