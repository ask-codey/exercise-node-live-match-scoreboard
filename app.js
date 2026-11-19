// The scoreboard's web pages, served by Express from the public folder:
//   http://localhost:3100/                   the viewer page: the live score and how many people are watching
//   http://localhost:3100/scorekeeper.html   the scorekeeper's page: the same score, and a button for each team's goals
// Ready to use: you don't need to change this file.
import path from "node:path";
import express from "express";

export const app = express();

app.use(express.static(path.join(import.meta.dirname, "public")));
