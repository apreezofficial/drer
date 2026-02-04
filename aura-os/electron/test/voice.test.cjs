const { test } = require("node:test");
const assert = require("node:assert/strict");
const { WakeRouter, voiceSettings } = require("../src/voice");
const { parseRequest } = require("../src/actions");
const { resolveApplication } = require("../src/app-match");
test("reported misspelled request resolves the actual installed Asphalt app", () => {
  const intent = parseRequest("can yo opne asphat 8 for me");
  assert.equal(intent.kind, "open_application");
  assert.equal(
    resolveApplication(intent.application, [
      { name: "Asphalt 8+" },
      { name: "Mail" },
    ]),
    "Asphalt 8+",
  );
});
test("app matching rejects different game versions, unknown names, and ambiguity", () => {
  assert.throws(() =>
    resolveApplication("asphalt 9", [{ name: "Asphalt 8+" }]),
  );
  assert.throws(() =>
    resolveApplication("nothing like this", [{ name: "Mail" }]),
  );
  assert.throws(() =>
    resolveApplication("chrome", [
      { name: "Google Chrome" },
      { name: "Google Chrome Canary" },
    ]),
  );
});
test("wake name gates background speech and supports a one-shot command", () => {
  const router = new WakeRouter("Buddy");
  assert.equal(router.accept("open Mail"), null);
  assert.deepEqual(router.accept("Hey Buddy, open Mail."), {
    command: "open Mail",
  });
  assert.equal(router.accept("open Spotify"), null);
});
test("separate wake and command have a bounded follow-up window", () => {
  let now = 100;
  const router = new WakeRouter("Buddy", () => now);
  assert.deepEqual(router.accept("Hey Buddy"), { wake: true });
  assert.deepEqual(router.accept("open Mail"), { command: "open Mail" });
  router.accept("Hey Buddy");
  now += 13000;
  assert.equal(router.accept("open Spotify"), null);
  router.setName("Nova");
  assert.equal(router.accept("Hey Buddy open Mail"), null);
  assert.deepEqual(router.accept("Hey Nova open Mail"), {
    command: "open Mail",
  });
});
test("wake name settings reject regex or command syntax", () => {
  assert.throws(() => voiceSettings({ wakeName: ".*" }));
  assert.deepEqual(voiceSettings({ wakeName: "Buddy", spokenReplies: false }), {
    wakeName: "Buddy",
    spokenReplies: false,
    voice: "",
  });
});
