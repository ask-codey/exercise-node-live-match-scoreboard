// The scoreboard's live line: a ws WebSocketServer on the same server as the pages. For you to finish.
//
// Today's match is the Hawks against the Foxes, and it starts at 0 to 0. Every message, both ways, is JSON text
// with a type. attachScoreboard(server) is called once, by server.js (and by each test, with a fresh server), so
// the score starts at 0 to 0 each time.
//
// When a client connects:
//   to that client:          { "type": "score", "hawks": 0, "foxes": 0 }   the score right now, at once
//   to every open client:    { "type": "viewers", "count": 1 }             how many are connected, the newcomer included
//
// When a client sends:
//   { "type": "goal", "team": "hawks" }   to every open client: { "type": "score", "hawks": 1, "foxes": 0 }
//   { "type": "goal", "team": "foxes" }   the same, with one more goal for the foxes
//   { "type": "goal", "team": "eagles" }  to the sender only: { "type": "error", "message": "There's no team eagles." }
//                                         (any team that isn't hawks or foxes, named as it was sent; the score stays)
//   { "type": "cheer" }                   to the sender only: { "type": "error", "message": "Unknown message type: cheer." }
//                                         (any other type, named as it was sent)
//   Go Hawks!                             to the sender only: { "type": "error", "message": "Messages must be JSON." }
//                                         (anything that isn't JSON)
//
// When a client leaves:
//   to every client still open:  { "type": "viewers", "count": 1 }   the new count, without the one who left
//
// For now, every client that connects gets one message, { "type": "error", "message": "Not built yet." }, and
// nothing else happens.
import { WebSocketServer, WebSocket } from "ws";

export function attachScoreboard(server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (socket) => {
    socket.send(JSON.stringify({ type: "error", message: "Not built yet." }));
  });

  return wss;
}
