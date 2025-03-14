const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log("受信したメッセージ:", message.toString());

    // すべてのクライアントに文字列として送信
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString()); // 確実に文字列として送信
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`WebSocketサーバーがポート ${PORT} で起動`);
});
