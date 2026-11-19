// Starts the scoreboard at http://localhost:3100: the pages from app.js, and the live WebSocket line from
// scoreboard.js, on one server and one port.
// Run it with: npm start (or npm run dev, which restarts it each time you save). Stop it with Ctrl+C.
// Ready to use: you don't need to change this file.
import http from "node:http";
import { app } from "./app.js";
import { attachScoreboard } from "./scoreboard.js";

const port = 3100;
const server = http.createServer(app);
attachScoreboard(server);

server.listen(port, () => {
  console.log(`The Hilltop scoreboard is live at http://localhost:${port}`);
});
