import { useState, useEffect, useRef } from "react";

// 本番環境では正しいWebSocketエンドポイントを使用
const SERVER_URL = import.meta.env.VITE_WEBSOCKET_URL || "wss://localhost:8080/ws";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connectWebSocket = () => {
      // 既存の接続を閉じる
      if (socketRef.current) {
        socketRef.current.close();
      }
      
      // WebSocket URLを構築
      const wsUrl = SERVER_URL.endsWith('/ws') ? SERVER_URL : `${SERVER_URL}/ws`;
      console.log(`WebSocket に接続しています: ${wsUrl}`);
      
      try {
        socketRef.current = new WebSocket(wsUrl);
        
        socketRef.current.onopen = () => {
          console.log("WebSocket 接続成功");
          setConnected(true);
          reconnectAttempts = 0; // 接続成功したらカウントをリセット
          
          // 接続通知メッセージを表示
          setMessages(prev => [...prev, {
            user: "システム",
            text: "チャットに接続しました"
          }]);
        };
        
        socketRef.current.onmessage = async (event) => {
          try {
            let newMessage;
            if (event.data instanceof Blob) {
              const text = await event.data.text();
              newMessage = JSON.parse(text);
            } else {
              newMessage = JSON.parse(event.data);
            }
            console.log("受信したメッセージ:", newMessage);
            setMessages((prev) => [...prev, newMessage]);
          } catch (error) {
            console.error("メッセージの解析に失敗しました:", error);
          }
        };
        
        socketRef.current.onerror = (error) => {
          console.error("WebSocket エラー:", error);
          setConnected(false);
        };
        
        socketRef.current.onclose = (event) => {
          console.warn(`WebSocket が閉じられました。コード: ${event.code}, 理由: ${event.reason}`);
          setConnected(false);
          
          // 再接続の処理
          if (reconnectAttempts < maxReconnectAttempts) {
            const timeout = Math.min(1000 * (2 ** reconnectAttempts), 30000);
            reconnectAttempts++;
            
            console.log(`${timeout/1000}秒後に再接続します (${reconnectAttempts}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              connectWebSocket();
            }, timeout);
          } else {
            setMessages(prev => [...prev, {
              user: "システム",
              text: "サーバーへの接続に失敗しました。ページを更新してください。"
            }]);
          }
        };
      } catch (error) {
        console.error("WebSocket 接続の初期化に失敗:", error);
      }
    };
    
    connectWebSocket();
    
    // クリーンアップ関数
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);
  
  const sendMessage = () => {
    if (!input.trim()) return;
    
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const newMessage = { text: input, user: "匿名" };
      console.log("送信するメッセージ:", newMessage);
      socketRef.current.send(JSON.stringify(newMessage));
      setInput("");
    } else {
      console.warn("WebSocket が接続されていません。メッセージを送信できません");
      setMessages(prev => [...prev, {
        user: "システム",
        text: "サーバーに接続されていないため、メッセージを送信できません。"
      }]);
    }
  };
  
  // Enterキーでメッセージ送信
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "20px" }}>
      <h1>匿名チャット</h1>
      <div style={{ 
        marginBottom: "10px", 
        padding: "5px", 
        backgroundColor: connected ? "#e8f5e9" : "#ffebee",
        borderRadius: "4px"
      }}>
        接続状態: {connected ? "接続中" : "切断"}
      </div>
      
      <div style={{ 
        height: "400px", 
        overflowY: "auto", 
        border: "1px solid #ddd", 
        padding: "10px",
        marginBottom: "10px",
        borderRadius: "4px"
      }}>
        {messages.map((msg, index) => (
          <p key={index} style={{ 
            margin: "5px 0",
            padding: "8px",
            backgroundColor: msg.user === "システム" ? "#f5f5f5" : "#e3f2fd",
            borderRadius: "4px"
          }}>
            <strong>{msg.user}:</strong> {msg.text}
          </p>
        ))}
      </div>
      
      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={!connected}
          placeholder={connected ? "メッセージを入力..." : "接続中..."}
          style={{ 
            flexGrow: 1, 
            padding: "8px",
            marginRight: "8px",
            borderRadius: "4px",
            border: "1px solid #ddd"
          }}
        />
        <button 
          onClick={sendMessage} 
          disabled={!connected}
          style={{
            padding: "8px 16px",
            backgroundColor: connected ? "#2196f3" : "#bdbdbd",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: connected ? "pointer" : "not-allowed"
          }}
        >
          送信
        </button>
      </div>
    </div>
  );
}

export default App;