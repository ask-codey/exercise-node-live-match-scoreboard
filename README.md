# Exercise: Live Match Scoreboard

Exercise code for the lesson **Exercise: Live Match Scoreboard** in the Node.js in Depth course on [ask-codey.com](https://www.ask-codey.com).

Hilltop Intramurals plays its soccer games on Field 1, and fans who can't be there want to follow the score from their phones. The pages are ready: a viewer's page that shows the score, and a scorekeeper's page with a button for each team's goals. You'll write the live line behind them in `scoreboard.js`, with the `ws` package: every goal reaches every open page at once, a fan who connects late sees the score straight away, a message the scoreboard can't use gets an error back, and everyone sees how many people are watching. Tests connect real WebSocket clients to check every message.

## What's here

- `scoreboard.js`: `attachScoreboard(server)`, which starts a `WebSocketServer` on the server it's given. For now it tells every client that connects that it isn't built yet. The comment at the top lists every message it should send, and when. For you to finish.
- `app.js`: the Express app that serves the pages in `public/`. Ready to use.
- `server.js`: starts the pages and the live line together at `http://localhost:3100`, on one server and one port. Ready to use.
- `public/`: the viewer's page (`index.html`), the scorekeeper's page (`scorekeeper.html`), their browser code (`live.js`) and styles (`scoreboard.css`). Ready to use.
- `scoreboard.test.js`: tests that start a fresh scoreboard, connect WebSocket clients to it, and check the messages each one gets. You don't need to change this file.
- `package.json` and `package-lock.json`: the project's settings, its scripts (`start`, `dev` and `test`) and its two packages at exact versions, Express 5.3.0 and ws 8.23.0. Ready to use.

## Before you start

You need Node.js 24 or later (`node --version` shows yours). In VS Code's terminal, in this folder, install the packages:

```bash
npm install
```

It makes a `node_modules` folder. That folder is in `.gitignore`, so Git leaves it out: `npm install` makes it again on any computer.

## Run it

```bash
npm start
```

The terminal says `The Hilltop scoreboard is live at http://localhost:3100` and keeps running. Open `http://localhost:3100` in your browser for the viewer's page, and `http://localhost:3100/scorekeeper.html` in a second tab, or a second window side by side. Click a goal button on the scorekeeper's page, and the score changes on both. Open a third tab and the count of people watching goes up; close it and the count goes down. Stop the server with **Ctrl+C**.

`npm run dev` starts it with `node --watch`, so it restarts each time you save `scoreboard.js`. A restart closes every page's line, so refresh the pages after one.

## Check your work

```bash
npm test
```

No server needs to be running: each test starts its own scoreboard on a port the computer picks, and closes it afterwards. At first every test fails, each one after waiting a second for a message that never comes: that is expected. Each message you send turns its tests green. A failing test's message says who should have got what, and lists the messages they did get, for example *Maya, on connecting, should get a score message, but none came within 1 second. What came: {"type":"error","message":"Not built yet."}.*

## The rules

- Use the `ws` package's `WebSocketServer`, on the server `attachScoreboard` is given. No other packages.
- Every message you send is JSON text with a `type`, exactly as the comment at the top of `scoreboard.js` shows.
- Keep the score inside `attachScoreboard`, so every call, and every test, starts at 0 to 0.
- A message the scoreboard can't use gets an error back to the client that sent it, and only to that client. It never changes the score, and it never stops the server.
- Don't change `app.js`, `server.js`, the files in `public/` or the tests.

## Tips

- Start with the moment a client connects: send it the score, then send everyone the count. Tests 1 to 3 turn green.
- `wss.clients` holds every connected client. Loop through it to send everyone the same message, and send only to clients whose `readyState` is `WebSocket.OPEN`.
- A message arrives as a Buffer: `data.toString()` gives its text, and `JSON.parse` throws when the text isn't JSON, so catch that.
- Check the type first, then the team. `score.eagles += 1` wouldn't stop the server, but it would quietly turn the score into nonsense.
- When a client closes, ws has already taken it out of `wss.clients`, so `wss.clients.size` is already the new count.
- In a real app, only a signed-in scorekeeper could send goals, the way *Requiring a Signed-In User* protects a route. Here, every connection may.

## Hand it in

When it works, push your solution to a public repo of your own on GitHub, then paste that repo's address into **Submit your exercise** on the lesson page at [ask-codey.com](https://www.ask-codey.com). That's what completes the lesson. The lesson page shows the Git commands, step by step.
