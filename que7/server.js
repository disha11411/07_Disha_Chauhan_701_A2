const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the current folder (`question7`)
app.use(express.static(__dirname));
// app.use(express.static("question7"));

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("chat message", (msg) => {
    console.log("User:", msg);

    // Simple bot logic
    let reply = `You said: "${msg}".`;
    if (msg.toLowerCase().includes("hello")) {
      reply = "Hello! How can I help you?";
    } else if (msg.toLowerCase().includes("bye")) {
      reply = "Goodbye!";
    }

    socket.emit("bot reply", reply);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
