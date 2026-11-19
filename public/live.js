// The browser's side of the live line, for both pages. Ready to use: you don't need to change this file.
// It opens a WebSocket to the server that sent the page (wss:// when the page came over https://), shows every
// score and viewers message, shows an error message in the status line, and sends a goal when a button is clicked.
const protocol = location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${protocol}://${location.host}`);

const status = document.querySelector("#status");

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "score") {
    document.querySelector("#hawks").textContent = message.hawks;
    document.querySelector("#foxes").textContent = message.foxes;
  } else if (message.type === "viewers") {
    document.querySelector("#viewers").textContent = `Watching now: ${message.count}`;
  } else if (message.type === "error") {
    status.textContent = message.message;
  }
});

socket.addEventListener("close", () => {
  status.textContent = "The scoreboard's line closed. Refresh the page to connect again.";
});

for (const button of document.querySelectorAll("button[data-team]")) {
  button.addEventListener("click", () => {
    status.textContent = "";
    socket.send(JSON.stringify({ type: "goal", team: button.dataset.team }));
  });
}
