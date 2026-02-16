const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {
  parseRequest,
  ActionStore,
  calendarFile,
  filename,
} = require("../src/actions");
const now = new Date("2026-11-05T12:00:00-08:00").getTime();
test("wake phrase and reminder duration produce an exact due time", () => {
  const action = parseRequest(
    "Hey DRER, remind me in 10 seconds to stretch",
    now,
  );
  assert.equal(action.kind, "reminder");
  assert.equal(action.title, "stretch");
  assert.equal(new Date(action.dueAt).getTime(), now + 10000);
  assert.equal(
    parseRequest("set a timer for 1.5 minutes", now).dueAt,
    new Date(now + 90000).toISOString(),
  );
});
test("invalid durations and unsupported instructions do not become actions", () => {
  assert.throws(() => parseRequest("remind me in 0 seconds to go", now));
  assert.throws(() => parseRequest("remind me in 999999 hours to go", now));
  assert.equal(parseRequest("delete every file on my computer"), null);
  assert.equal(parseRequest("build an arbitrary shell script"), null);
});
test("note paths cannot traverse outside the workspace", () => {
  const action = parseRequest("save a note called ../../outside: a real note");
  assert.equal(action.kind, "note");
  assert.equal(action.name, "outside");
  assert.throws(() => filename("../../"));
});
test("meeting drafts validate hours, minutes, and duration", () => {
  const action = parseRequest(
    "Draft a meeting called Project check-in tomorrow at 10am for 30 minutes",
    now,
  );
  assert.equal(action.kind, "calendar_draft");
  assert.equal(new Date(action.endAt) - new Date(action.startAt), 1800000);
  assert.equal(new Date(action.startAt).getDate(), new Date(now).getDate() + 1);
  assert.throws(() =>
    parseRequest("schedule a meeting called Bad tomorrow at 25:00", now),
  );
  assert.throws(() =>
    parseRequest(
      "schedule a meeting called Bad tomorrow at 10am for 0 minutes",
      now,
    ),
  );
});
test("calendar data escapes injected fields and uses UTC timestamps", () => {
  const result = calendarFile(
    {
      title: "Review, plan; today\nBEGIN:VEVENT",
      startAt: new Date(now).toISOString(),
      endAt: new Date(now + 1800000).toISOString(),
    },
    new Date(now),
  );
  assert.match(result, /SUMMARY:Review\\, plan\\; today\\nBEGIN:VEVENT/);
  assert.equal((result.match(/\r\nBEGIN:VEVENT/g) || []).length, 1);
  assert.match(result, /DTSTART:\d{8}T\d{6}Z/);
});
test("confirmed reminders persist, fire once, and remain delivered after restart", async (t) => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "drer-reminder-test-"),
  );
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  let clock = now;
  const deliveries = [];
  const store = await new ActionStore(directory, {
    clock: () => clock,
    onReminder: (x) => deliveries.push(x),
  }).init();
  const plan = store.plan(
    parseRequest("remind me in 2 seconds to stretch", clock),
  );
  assert.equal(store.summary().reminders.length, 0);
  await store.execute(store.take(plan.id));
  assert.throws(() => store.take(plan.id));
  await store.tick();
  assert.equal(deliveries.length, 0);
  clock += 2000;
  await Promise.all([store.tick(), store.tick()]);
  assert.equal(deliveries.length, 1);
  const restarted = await new ActionStore(directory, {
    clock: () => clock,
    onReminder: (x) => deliveries.push(x),
  }).init();
  await restarted.tick();
  assert.equal(deliveries.length, 1);
  assert.equal(restarted.summary().reminders[0].status, "delivered");
});
test("cancelled and expired action IDs cannot execute", async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "drer-plan-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  let clock = now;
  const store = await new ActionStore(directory, { clock: () => clock }).init();
  const plan = store.plan({ kind: "note", name: "test", content: "one" });
  store.cancel(plan.id);
  assert.throws(() => store.take(plan.id));
  const expired = store.plan({ kind: "note", name: "test", content: "two" });
  clock += 600001;
  assert.throws(() => store.take(expired.id));
  assert.equal(store.summary().activity.length, 0);
});
test("notes, a functional starter, and calendar drafts are written as real files", async (t) => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "drer-workspace-test-"),
  );
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const store = await new ActionStore(directory).init();
  const note = await store.execute(
    parseRequest("save a note called Research: Keep the useful findings."),
  );
  assert.equal(
    await fs.readFile(note.path, "utf8"),
    "Keep the useful findings.",
  );
  const app = await store.execute(parseRequest("build me a habit tracker"));
  const html = await fs.readFile(app.path, "utf8");
  assert.match(html, /localStorage/);
  assert.match(html, /type='checkbox'/);
  const event = await store.execute(
    parseRequest(
      "draft a meeting called Review tomorrow at 10am for 30 minutes",
    ),
  );
  assert.match(await fs.readFile(event.path, "utf8"), /SUMMARY:Review/);
  assert.equal(store.summary().activity.length, 3);
});
test("corrupt state is reported without overwriting the original file", async (t) => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "drer-state-test-"),
  );
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  await fs.writeFile(path.join(directory, "state.json"), "not json");
  await assert.rejects(
    () => new ActionStore(directory).init(),
    /not been overwritten/,
  );
  assert.equal(
    await fs.readFile(path.join(directory, "state.json"), "utf8"),
    "not json",
  );
});

test("the exact shorthand timer and typo alarm reported by the user route locally", () => {
  const now = new Date("2026-11-05T18:40:00-08:00").getTime();
  const timer = parseRequest("set a timer for 10s", now);
  assert.equal(timer.category, "timer");
  assert.equal(new Date(timer.dueAt).getTime(), now + 10000);
  const alarm = parseRequest("hey set an alarmto 6:42 for me", now);
  assert.equal(alarm.category, "alarm");
  assert.equal(new Date(alarm.dueAt).getTime(), now + 120000);
});
test("clock alarms roll to the next matching time and reject malformed clocks", () => {
  const { resolveClock } = require("../src/actions");
  const time = new Date("2026-11-05T18:43:00-08:00").getTime();
  assert.ok(new Date(resolveClock("6:42", time)).getTime() > time);
  assert.throws(() => resolveClock("25:99", time));
  assert.throws(() => resolveClock("0pm", time));
  assert.throws(() => resolveClock("18:42", time, "today"));
});
test("cancelled timers do not deliver", async (t) => {
  const directory = await fs.mkdtemp(
    path.join(os.tmpdir(), "drer-cancel-test-"),
  );
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  let clock = now;
  let fired = false;
  const store = await new ActionStore(directory, {
    clock: () => clock,
    onReminder: () => {
      fired = true;
    },
  }).init();
  await store.execute(parseRequest("set a timer for 2s", clock));
  await store.execute({ kind: "cancel_reminders" });
  clock += 3000;
  await store.tick();
  assert.equal(fired, false);
  assert.equal(store.summary().reminders[0].status, "cancelled");
});

test("installed application and music intents do not swallow timer requests", () => {
  assert.deepEqual(parseRequest("open Google Chrome"), {
    kind: "open_application",
    application: "Google Chrome",
  });
  assert.deepEqual(parseRequest("play spotify music for me"), {
    kind: "spotify_control",
    command: "play",
  });
  assert.deepEqual(parseRequest("pause music"), {
    kind: "spotify_control",
    command: "pause",
  });
  assert.equal(parseRequest("start a fifteen-second countdown"), null);
});
