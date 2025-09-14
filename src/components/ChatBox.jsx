import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import cityCodes from "../cityCodes.json";
import "./ChatBox.css";

function ChatBox() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm Wander Buddy. Ask me about travel or weather 🌍" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const apiKey = process.env.REACT_APP_WEATHER_API_KEY;

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);

    let botReply = "Sorry, I didn’t understand that.";

    const text = input.toLowerCase();

    // WEATHER QUERY
    if (text.includes("weather")) {
      try {
        // Extract city name after 'weather in'
        const city = input.split("weather in")[1]?.trim();
        if (city) {
          const res = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
              city
            )}&appid=${apiKey}&units=metric`
          );
          botReply = `🌤 The weather in ${res.data.name} is ${res.data.main.temp}°C, ${res.data.weather[0].description}.`;
        } else {
          botReply = "Please specify a city (e.g., 'weather in Paris').";
        }
      } catch (err) {
        botReply = "I couldn’t fetch the weather. Try another city!";
      }
    }

    // TRAVEL QUERY
    else if (text.includes("travel")) {
      // Extract city after 'from'
      let cityName = input.split("from")[1]?.trim().toLowerCase();
      if (cityName && cityCodes[cityName]) {
        const originCode = cityCodes[cityName];
        try {
          const res = await axios.get(
            `http://localhost:5000/api/travel/${originCode}`
          );

          if (Array.isArray(res.data) && res.data.length > 0) {
            const destinations = res.data
              .map((d) => d.destination)
              .filter(Boolean)
              .slice(0, 5);
            botReply = `✈ Top destinations from ${cityName} (${originCode}): ${destinations.join(", ")}`;
          } else {
            botReply = `I couldn’t find travel suggestions for ${cityName}.`;
          }
        } catch (err) {
          console.error(err);
          botReply = "Error fetching travel info. Try another city.";
        }
      } else {
        botReply = "Please provide a valid city name (e.g., 'travel from London').";
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
        <div ref={messagesEndRef}></div>
      </div>
      <div className="input-box">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me something..."
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}

export default ChatBox;
