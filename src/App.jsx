import { useState, useEffect, useRef } from "react";

const SERVER_URL = "wss://anonymous-chat-production-5937.up.railway.app"; // WebSocketサーバーのURL

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const socketRef = useRef(null); // WebSocket インスタンスを保持

  useEffect(() => {
    const connectWebSocket = () => {
      socketRef.current = new WebSocket(SERVER_URL);

      socketRef.current.onopen = () => {
        console.log("WebSocket 接続成功");
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
          setMessages((prev) => [...prev, newMessage]);
        } catch (error) {
          console.error("メッセージの解析に失敗しました:", error);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error("WebSocket エラー:", error);
      };

      socketRef.current.onclose = () => {
        console.warn("WebSocket が閉じられました。5秒後に再接続します...");
        setTimeout(() => {
          connectWebSocket(); // 5秒後に再接続
        }, 5000);
      };
    };

    connectWebSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const sendMessage = () => {
    if (!input) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const newMessage = { text: input, user: "匿名" };
      socketRef.current.send(JSON.stringify(newMessage));
      setInput("");
    } else {
      console.warn("WebSocket が閉じられているため、メッセージを送信できません");
    }
  };

  return (
    <div>
      <h1>匿名チャット</h1>
      <div>
        {messages.map((msg, index) => (
          <p key={index}>
            <strong>{msg.user}:</strong> {msg.text}
          </p>
        ))}
      </div>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={sendMessage}>送信</button>
    </div>
  );
}

export default App;
