const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 8080;  // Railway のポート設定に合わせる

const server = http.createServer(app);  // HTTP サーバーを作成
const wss = new WebSocket.Server({ server });  // WebSocket サーバーを作成

wss.on("connection", (ws) => {
  console.log("新しい WebSocket 接続");

  ws.on("message", (message) => {
    console.log("受信したメッセージ:", message.toString());

    // すべてのクライアントにメッセージを送信
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message.toString());
      }
    });
  });

  ws.on("close", () => {
    console.log("WebSocket 接続が閉じられました");
  });

  ws.on("error", (error) => {
    console.error("WebSocket エラー:", error);
  });
});

server.listen(PORT, () => {
  console.log(`✅ WebSocket サーバーがポート ${PORT} で起動`);
});
