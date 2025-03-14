const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();

// CORSの設定を詳細に指定
app.use(cors({
  origin: "*", // 本番環境では特定のドメインを指定することを推奨
  methods: ["GET", "POST"],
  credentials: true
}));

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// WebSocketサーバーの設定を最適化
const wss = new WebSocket.Server({ 
  server,
  path: "/ws", // WebSocketのパスを明示的に指定
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

// 接続中のクライアントを管理
const clients = new Set();

wss.on("connection", (ws, req) => {
  console.log(`新しいWebSocket接続: ${req.socket.remoteAddress}`);
  clients.add(ws);

  // 接続成功時のメッセージを送信
  ws.send(JSON.stringify({
    type: "system",
    message: "接続が確立されました"
  }));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      console.log("受信したメッセージ:", data);

      // メッセージをブロードキャスト
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    } catch (error) {
      console.error("メッセージの処理中にエラーが発生:", error);
    }
  });

  ws.on("close", () => {
    console.log(`クライアント切断: ${req.socket.remoteAddress}`);
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocketエラー:", error);
    clients.delete(ws);
  });
});

// サーバーのエラーハンドリング
server.on("error", (error) => {
  console.error("サーバーエラー:", error);
});

// サーバーの起動
server.listen(PORT, () => {
  console.log(`✅ WebSocketサーバーが起動しました - ポート: ${PORT}`);
  console.log(`✅ サーバーURL: ${process.env.RAILWAY_PUBLIC_DOMAIN || "localhost"}`);
});