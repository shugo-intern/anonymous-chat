const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();

// CORSの設定を詳細に行う
app.use(cors({
  origin: '*', // 本番環境では適切なオリジンに制限すべき
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// 基本的なヘルスチェックエンドポイント
app.get('/', (req, res) => {
  res.send('WebSocket Server is running!');
});

const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

// WebSocketサーバーの設定を改善
const wss = new WebSocket.Server({ 
  server,
  // 60秒ごとにピンを送信（接続維持用）
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // 閾値以下のデータは圧縮しない
    threshold: 1024,
    // クライアント毎の圧縮を無効化
    clientNoContextTakeover: true,
    // サーバー毎の圧縮を無効化
    serverNoContextTakeover: true,
    // サーバーは常にデフレートを要求
    serverMaxWindowBits: 10,
    // クライアントのデフレートウィンドウビットの最大値
    clientMaxWindowBits: 10,
    // メッセージのデフレートを無効化
    concurrencyLimit: 10,
  }
});

// ハートビート機能の実装（接続維持用）
function heartbeat() {
  this.isAlive = true;
}

wss.on("connection", (ws) => {
  console.log("新しい WebSocket 接続");
  ws.isAlive = true;
  ws.on('pong', heartbeat);

  // 接続時にウェルカムメッセージを送信
  ws.send(JSON.stringify({
    user: "システム",
    text: "チャットに接続しました。メッセージを送信してください。"
  }));

  ws.on("message", (message) => {
    try {
      console.log("受信したメッセージ:", message.toString());
      
      // すべてのクライアントにメッセージを送信
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message.toString());
        }
      });
    } catch (error) {
      console.error("メッセージ処理中にエラー:", error);
    }
  });

  ws.on("close", () => {
    console.log("WebSocket 接続が閉じられました");
  });

  ws.on("error", (error) => {
    console.error("WebSocket エラー:", error);
  });
});

// 30秒ごとに接続チェックを実行
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    
    ws.isAlive = false;
    ws.ping(() => {});
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

server.listen(PORT, () => {
  console.log(`✅ WebSocket サーバーがポート ${PORT} で起動`);
});