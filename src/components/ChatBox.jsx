// src/components/ChatBox.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatBox.css";
import cityCodes from "../cityCodes.json";

function ChatBox() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm Wander Buddy. Ask me about travel or weather 🌍" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  // Normalize user input to match cityCodes keys
  const normalizeCity = (city) => {
    return city
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    let botReply = "Sorry, I didn’t understand that.";
    const lowerInput = input.toLowerCase();

    // --- Weather Query ---
    if (lowerInput.includes("weather")) {
      try {
        const match = lowerInput.match(/weather in (.+)/);
        const cityRaw = match?.[1]?.trim();
        if (cityRaw) {
          const cityKey = normalizeCity(cityRaw);
          const res = await axios.get(`/api/weather/${encodeURIComponent(cityKey)}`);
          botReply = `The weather in ${res.data.name} is ${res.data.main.temp}°C, ${res.data.weather[0].description}.`;
        } else {
          botReply = "Please specify a city (e.g., 'weather in Paris').";
        }
      } catch (err) {
        console.error("Weather error:", err.response?.data || err.message);
        botReply = "I couldn’t fetch the weather. Try another city!";
      }
    }

    // --- Travel Query ---
    else if (lowerInput.includes("travel from")) {
      try {
        const match = lowerInput.match(/travel from (.+)/);
        const userCityRaw = match?.[1]?.trim();
        if (!userCityRaw) {
          botReply = "Please specify a city (e.g., 'travel from London').";
        } else {
          const userCityKey = normalizeCity(userCityRaw);
          const cityCode = cityCodes[userCityKey];

          if (!cityCode) {
            botReply = `Sorry, I don’t have travel info for ${userCityRaw}.`;
          } else {
            const travelRes = await axios.get(`/api/travel/${encodeURIComponent(userCityKey)}`);
            if (travelRes.data?.data?.length) {
              botReply = `Top destinations from ${userCityRaw}: ${travelRes.data.data
                .map((d) => d.destination)
                .join(", ")}`;
            } else {
              botReply = `No travel info found for ${userCityRaw}.`;
            }
          }
        }
      } catch (err) {
        console.error("Travel error:", err.response?.data || err.message);
        botReply = "Error fetching travel info. Try another city.";
      }
    }

    setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    setInput("");
  };

  return (
    <div className="chatbox">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="input-box">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me something..."
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatBox;
