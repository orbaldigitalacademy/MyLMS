import React, { useEffect, useState, useRef } from "react";

const ChatBox = ({ room }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${room}`);

    ws.current.onmessage = (event) => {
      setMessages(prev => [...prev, event.data]);
    };

    return () => ws.current.close();
  }, [room]);

  const sendMessage = () => {
    if (!input.trim()) return;

    ws.current.send(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[500px]">

      <div className="flex-1 overflow-y-auto border p-2 mb-2">
        {messages.map((msg, i) => (
          <p key={i} className="text-sm">{msg}</p>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-3 rounded"
        >
          Send
        </button>
      </div>

    </div>
  );
};

export default ChatBox;