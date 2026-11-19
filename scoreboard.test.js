// Tests for scoreboard.js. Run them with: npm test (run npm install once first).
// Each test starts a fresh scoreboard (0 to 0) on a port the computer picks, connects real WebSocket clients to it
// with the ws package, sends messages and checks the JSON messages each client gets. After each test, every client
// and the server are closed. No server needs to be running first, and port 3100 isn't used.
// You don't need to change this file.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { once } from "node:events";
import { WebSocket } from "ws";
import { attachScoreboard } from "./scoreboard.js";

let server;
let clients;

// A fresh server for every test, so every test starts at 0 to 0 with nobody connected.
beforeEach(async () => {
  server = http.createServer();
  attachScoreboard(server);
  server.listen(0); // 0 asks the computer for any free port
  await once(server, "listening");
  clients = [];
});

// Closes every client the test opened, then the server.
afterEach(async () => {
  for (const client of clients) {
    if (client.readyState !== WebSocket.CLOSED) {
      client.close();
      await once(client, "close");
    }
  }
  server.close();
});

// Opens a WebSocket client and keeps every message it gets, from the very first, in its inbox.
async function openClient() {
  const client = new WebSocket(`ws://localhost:${server.address().port}`);
  client.inbox = [];
  client.on("message", (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch {
      message = { notJson: data.toString() };
    }
    client.inbox.push(message);
    client.emit("inbox");
  });
  clients.push(client);
  await once(client, "open");
  return client;
}

// What a client has been sent so far, for a failing test's message.
function shown(client) {
  return client.inbox.length === 0 ? "nothing" : client.inbox.map((m) => JSON.stringify(m)).join(", ");
}

// The client's next message of this type (the earliest one the test hasn't taken yet), waiting up to 1 second.
async function next(client, type, what) {
  const deadline = Date.now() + 1000;
  for (;;) {
    const index = client.inbox.findIndex((m) => m.type === type);
    if (index !== -1) {
      return client.inbox.splice(index, 1)[0];
    }
    const left = deadline - Date.now();
    if (left <= 0) {
      assert.fail(`${what} should get a ${type} message, but none came within 1 second. What came: ${shown(client)}.`);
    }
    await new Promise((resolve) => {
      const timer = setTimeout(done, left);
      client.once("inbox", done);
      function done() {
        clearTimeout(timer);
        client.off("inbox", done);
        resolve();
      }
    });
  }
}

// Checks that no message of this type comes within a fifth of a second.
async function nothingNew(client, type, what) {
  await new Promise((resolve) => setTimeout(resolve, 200));
  const extra = client.inbox.filter((m) => m.type === type);
  assert.equal(extra.length, 0, `${what} shouldn't get a ${type} message, but it got: ${JSON.stringify(extra[0])}.`);
}

// Opens a client and takes the score it gets as soon as it connects.
async function connect(what) {
  const client = await openClient();
  await next(client, "score", `${what}, on connecting,`);
  return client;
}

function send(client, message) {
  client.send(typeof message === "string" ? message : JSON.stringify(message));
}

test("1) A viewer who connects gets the score at once: hawks 0, foxes 0", async () => {
  const maya = await openClient();

  const first = await next(maya, "score", "A viewer who connects");
  assert.deepEqual(first, { type: "score", hawks: 0, foxes: 0 });
});

test("2) The first viewer to connect gets viewers count 1", async () => {
  const maya = await connect("Maya");

  assert.deepEqual(await next(maya, "viewers", "Maya"), { type: "viewers", count: 1 });
});

test("3) A second viewer makes the count 2, for both viewers", async () => {
  const maya = await connect("Maya");
  await next(maya, "viewers", "Maya"); // count 1, when Maya connected
  const theo = await connect("Theo");

  assert.deepEqual(await next(maya, "viewers", "Maya, when Theo connects,"), { type: "viewers", count: 2 });
  assert.deepEqual(await next(theo, "viewers", "Theo"), { type: "viewers", count: 2 });
});

test("4) A goal for the hawks sends hawks 1, foxes 0 to every viewer, the scorer included", async () => {
  const maya = await connect("Maya");
  const theo = await connect("Theo");

  send(maya, { type: "goal", team: "hawks" });

  const expected = { type: "score", hawks: 1, foxes: 0 };
  assert.deepEqual(await next(maya, "score", "Maya, who sent the goal,"), expected);
  assert.deepEqual(await next(theo, "score", "Theo"), expected);
});

test("5) Goals keep counting: foxes, foxes, then hawks gives hawks 1, foxes 2", async () => {
  const maya = await connect("Maya");

  send(maya, { type: "goal", team: "foxes" });
  assert.deepEqual(await next(maya, "score", "After the first goal, Maya"), { type: "score", hawks: 0, foxes: 1 });
  send(maya, { type: "goal", team: "foxes" });
  assert.deepEqual(await next(maya, "score", "After the second goal, Maya"), { type: "score", hawks: 0, foxes: 2 });
  send(maya, { type: "goal", team: "hawks" });
  assert.deepEqual(await next(maya, "score", "After the third goal, Maya"), { type: "score", hawks: 1, foxes: 2 });
});

test("6) A viewer who connects after a hawks goal gets hawks 1, foxes 0 at once", async () => {
  const maya = await connect("Maya");
  send(maya, { type: "goal", team: "hawks" });
  await next(maya, "score", "Maya, after her goal,");

  const priya = await openClient();

  assert.deepEqual(await next(priya, "score", "Priya, who connects late,"), { type: "score", hawks: 1, foxes: 0 });
});

test("7) A goal for the eagles gets the error There's no team eagles. and the score stays hawks 0, foxes 0", async () => {
  const maya = await connect("Maya");
  const theo = await connect("Theo");

  send(maya, { type: "goal", team: "eagles" });

  assert.deepEqual(await next(maya, "error", "Maya, who sent the goal for the eagles,"),
    { type: "error", message: "There's no team eagles." });
  await nothingNew(theo, "score", "Theo, after a goal for a team that isn't playing,");
  await nothingNew(theo, "error", "Theo (the error goes only to the sender)");
  const priya = await openClient();
  assert.deepEqual(await next(priya, "score", "Priya, who connects afterwards,"), { type: "score", hawks: 0, foxes: 0 });
});

test("8) A message of an unknown type, cheer, gets the error Unknown message type: cheer.", async () => {
  const maya = await connect("Maya");

  send(maya, { type: "cheer" });

  assert.deepEqual(await next(maya, "error", "Maya, who sent a cheer,"),
    { type: "error", message: "Unknown message type: cheer." });
});

test("9) A message that isn't JSON, Go Hawks!, gets the error Messages must be JSON.", async () => {
  const maya = await connect("Maya");

  send(maya, "Go Hawks!");

  assert.deepEqual(await next(maya, "error", "Maya, who sent Go Hawks!,"),
    { type: "error", message: "Messages must be JSON." });
});

test("10) When a viewer leaves, the other gets viewers count 1, and a goal still reaches her: hawks 1, foxes 0", async () => {
  const maya = await connect("Maya");
  const theo = await connect("Theo");
  await next(maya, "viewers", "Maya"); // count 1, when Maya connected
  await next(maya, "viewers", "Maya"); // count 2, when Theo connected

  theo.close();
  await once(theo, "close");

  assert.deepEqual(await next(maya, "viewers", "Maya, after Theo leaves,"), { type: "viewers", count: 1 });
  send(maya, { type: "goal", team: "hawks" });
  assert.deepEqual(await next(maya, "score", "Maya, after Theo has left,"), { type: "score", hawks: 1, foxes: 0 });
});
