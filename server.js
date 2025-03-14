const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);
const wss = new WebSocket.Server({ 
  server,
  perMessageDeflate: false // WebSocket の圧縮を無効化（互換性向上のため）
});

// 接続時のログを追加
wss.on("connection", (ws, req) => {
  console.log(`新しい WebSocket 接続: ${req.socket.remoteAddress}`);

  ws.on("message", (message) => {
    console.log("受信したメッセージ:", message.toString());

    // すべてのクライアントに文字列として送信
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
  console.log(`✅ WebSocketサーバーがポート ${PORT} で起動`);
});
