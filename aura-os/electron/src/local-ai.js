// On-device inference through @zeroth-ai/sdk-node (llama.cpp). After the first
// model download nothing here touches the network. The SDK is ESM, so it is
// loaded with a dynamic import() from this CommonJS main process.
let enginePromise = null;
let loadedModel = "";

function modelChoice() {
  const id = (process.env.DRER_LOCAL_MODEL || "auto").trim();
  return { model: id, prefer: "speed" };
}

// The SDK accepts a small JSON-Schema subset; drop the keys it does not know.
function simplify(schema) {
  if (!schema || typeof schema !== "object") return schema;
  const out = { type: schema.type };
  if (schema.enum) out.enum = schema.enum;
  if (schema.required?.length) out.required = schema.required;
  if (schema.properties) {
    out.properties = {};
    for (const [k, v] of Object.entries(schema.properties))
      out.properties[k] = simplify(v);
  }
  return out;
}

// Tools only RECORD the model's choice. Nothing runs here: the caller feeds the
// recorded call through validateTool() exactly like a Groq tool call.
function buildTools(tools, record) {
  const map = {};
  for (const t of tools) {
    const { name, description, parameters } = t.function;
    map[name] = {
      description,
      parameters: simplify(parameters),
      run(args) {
        record({ name, args });
        return { ok: true };
      },
    };
  }
  return map;
}

function loadEngine({ onProgress } = {}) {
  if (!enginePromise) {
    enginePromise = import("@zeroth-ai/sdk-node")
      .then(({ zeroth }) => zeroth.load({ ...modelChoice(), onProgress }))
      .then((ai) => {
        loadedModel = ai.model?.id || ai.model?.name || "local";
        return ai;
      })
      .catch((e) => {
        enginePromise = null; // let the next request retry
        throw e;
      });
  }
  return enginePromise;
}

async function queryLocal({
  question,
  system,
  tools,
  forcedTool,
  signal,
  onProgress,
}) {
  const ai = await loadEngine({ onProgress });
  if (signal?.aborted) throw new Error("Request cancelled.");
  let call = null;
  ai.tools(
    buildTools(
      forcedTool ? tools.filter((t) => t.function.name === forcedTool) : tools,
      (c) => {
        call ??= c;
      },
    ),
  );
  const text = await ai.complete(
    [
      { role: "system", content: system },
      { role: "user", content: question },
    ],
    { maxTokens: 1500, signal },
  );
  if (call)
    return {
      toolCall: {
        function: { name: call.name, arguments: JSON.stringify(call.args) },
      },
      model: loadedModel,
      tokens: 0,
    };
  return { text, model: loadedModel, tokens: 0 };
}

async function unloadLocal() {
  const p = enginePromise;
  enginePromise = null;
  if (p) await (await p.catch(() => null))?.unload();
}

module.exports = { queryLocal, unloadLocal, buildTools, simplify };
