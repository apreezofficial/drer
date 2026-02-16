const { test } = require("node:test");
const assert = require("node:assert/strict");
const { queryAI } = require("../src/ai");
test("missing key fails without making a network request", async () => {
  await assert.rejects(() => queryAI({ question: "hello" }), /Settings/);
});
test("AI response parsing and image payload use the configured provider contract", async (t) => {
  const original = global.fetch;
  t.after(() => (global.fetch = original));
  let body;
  global.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [{ message: { content: "A real provider response" } }],
        usage: { total_tokens: 42 },
      }),
    };
  };
  const result = await queryAI({
    key: "test-fixture-key",
    question: "read this",
    image: "data:image/png;base64,fixture",
  });
  assert.equal(result.tokens, 42);
  assert.equal(body.messages[1].content[1].type, "image_url");
  assert.match(body.messages[0].content, /never claim/i);
});
test("provider errors redact keys instead of exposing them in the UI", async (t) => {
  const original = global.fetch;
  t.after(() => (global.fetch = original));
  global.fetch = async () => ({
    ok: false,
    status: 400,
    json: async () => ({
      error: { message: "bad token gsk_privateFixture12345" },
    }),
  });
  await assert.rejects(
    () => queryAI({ key: "test-key", question: "hello" }),
    (e) =>
      e.message.includes("[redacted]") && !e.message.includes("privateFixture"),
  );
});

test("model tool arguments are translated into a validated real action", async (t) => {
  const original = global.fetch;
  t.after(() => (global.fetch = original));
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      choices: [
        {
          message: {
            tool_calls: [
              {
                function: {
                  name: "set_timer",
                  arguments: JSON.stringify({ seconds: 15, title: "Stretch" }),
                },
              },
            ],
          },
        },
      ],
    }),
  });
  const result = await queryAI({
    key: "test-key",
    question: "Start a fifteen-second countdown",
  });
  assert.equal(result.action.kind, "reminder");
  assert.equal(result.action.category, "timer");
  assert.equal(result.action.title, "Stretch");
});
test("unrecognized tool calls and unsafe arguments are rejected", () => {
  const { validateTool } = require("../src/ai");
  assert.throws(() =>
    validateTool({ function: { name: "execute_shell", arguments: "{}" } }),
  );
  assert.throws(() =>
    validateTool({
      function: { name: "set_timer", arguments: '{"seconds":0,"title":"Bad"}' },
    }),
  );
  assert.throws(() =>
    validateTool({
      function: {
        name: "open_application",
        arguments: '{"application":"Calculator; rm -rf"}',
      },
    }),
  );
});

test("clear relative reminder requests select the timer tool", async (t) => {
  const original = global.fetch;
  t.after(() => (global.fetch = original));
  let body;
  global.fetch = async (_url, options) => {
    body = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              tool_calls: [
                {
                  function: {
                    name: "set_timer",
                    arguments: '{"seconds":15,"title":"Stretch"}',
                  },
                },
              ],
            },
          },
        ],
      }),
    };
  };
  await queryAI({
    key: "test-fixture",
    question: "Could you remind me fifteen seconds from now to stretch?",
  });
  assert.equal(body.tool_choice.function.name, "set_timer");
});
