// src/components/ChatBox.jsx
import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import "./ChatBox.css";
import cityCodes from "../cityCodes.json";

function ChatBox() {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I'm Wander Buddy. Ask me about travel, weather, or airline check-in 🌍✈️" },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

    const normalizeCity = (city) => {
    return city
      .toLowerCase()
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    const lowerInput = userMessage.toLowerCase();
    
    // Add user message and clear input
    setMessages((prev) => [...prev, { sender: "user", text: userMessage }]);
    setInput("");

    // --- Weather Query ---
    if (/weather in (.+)/i.test(userMessage)) {
      const match = userMessage.match(/weather in (.+)/i);
      const city = normalizeCity(match?.[1] || "");

      if (!city) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "⚠️ Please provide a valid city." },
        ]);
        return;
      }

      // ✅ Send city name (not IATA code) to server
      try {
        const res = await axios.get(`/api/weather/${encodeURIComponent(city)}`);
        
        if (res.data && res.data.name) {
          const weather = res.data;
          const weatherText = `🌤️ Weather in ${weather.name}, ${weather.sys.country}:
🌡️ Temperature: ${weather.main.temp}°C
☁️ Condition: ${weather.weather[0].main} - ${weather.weather[0].description}
💨 Wind: ${weather.wind.speed} m/s
💧 Humidity: ${weather.main.humidity}%`;
          
          setMessages((prev) => [...prev, { sender: "bot", text: weatherText }]);
        } else {
          setMessages((prev) => [...prev, { sender: "bot", text: "❌ Weather data not found for this city." }]);
        }
      } catch (err) {
        console.error("Weather error:", err.response?.data || err.message);
        setMessages((prev) => [...prev, { sender: "bot", text: "❌ Error fetching weather data. Please try another city." }]);
      }
      return;
    }

    // --- Travel Query ---
    else if (/travel from (.+)/i.test(userMessage)) {
      const match = userMessage.match(/travel from (.+)/i);
      const rawCity = normalizeCity(match?.[1] || "");

      if (!rawCity) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "⚠️ Please provide a valid city (e.g., 'travel from London')." },
        ]);
        return;
      }

      // Convert to IATA code using cityCodes.json
      const cityCode = cityCodes[rawCity.toLowerCase()];
      if (!cityCode) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `❌ Sorry, I don't have travel info for ${rawCity}.` },
        ]);
        return;
      }

      try {
        const res = await axios.get(`/api/travel/${encodeURIComponent(rawCity.toLowerCase())}`);

        if (res.data?.data?.length) {
          const destinations = res.data.data.map((d) => d.destination);
          const topDestinations = destinations.slice(0, 10).join(", ");
          const totalCount = destinations.length;
          const source = res.data.meta?.source || "API";
          
          let message = `✈️ Top destinations from ${rawCity} (${totalCount} total):\n${topDestinations}`;
          if (totalCount > 10) {
            message += `\n... and ${totalCount - 10} more destinations!`;
          }
          if (source === "static_data") {
            message += `\n\n📊 Data source: Comprehensive travel database`;
          }
          
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: message },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: `⚠️ No travel info found for ${rawCity}.` },
          ]);
        }
      } catch (err) {
        console.error("Travel error:", err.response?.data || err.message);
        if (err.response?.status === 404) {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: `❌ No flight data available for ${rawCity} in the test environment. Try: Paris, Madrid, or Amsterdam.` },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: "❌ Error fetching travel info. Try another city." },
          ]);
        }
      }
      return;
    }

    // --- Airline Check-in Query ---
    else if (lowerInput.includes("check in for")) {
      try {
        const match = lowerInput.match(/check in for (.+)/);
        const airline = match?.[1]?.trim(); // e.g. "IB", "LH", "British Airways", "Lufthansa"
        if (airline) {
          const checkinRes = await axios.get(`/api/checkin/${encodeURIComponent(airline)}`);
          if (checkinRes.data?.data?.length) {
            const links = checkinRes.data.data.map(item => `• ${item.type}: [${item.href}](${item.href})`).join("\n");
            setMessages((prev) => [
              ...prev,
              { sender: "bot", text: `🛫 Check-in links for ${airline}:\n${links}\n\n*All links open in new tabs*` },
            ]);
          } else {
            setMessages((prev) => [
              ...prev,
              { sender: "bot", text: `❌ No check-in link found for ${airline}.` },
            ]);
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: "⚠️ Please provide an airline name or code (e.g., 'check in for British Airways' or 'check in for BA')." },
          ]);
        }
      } catch (err) {
        console.error("Check-in error:", err.response?.data || err.message);
        if (err.response?.status === 400) {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: `❌ Invalid airline format. Try: British Airways, BA, Lufthansa, LH, Air France, AF, etc.` },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: "❌ Error fetching check-in info. Try another airline." },
          ]);
        }
      }
      return;
    }

    // --- Hotel Query ---
    else if (/hotels? in (.+)/i.test(userMessage)) {
      const match = userMessage.match(/hotels? in (.+)/i);
      const city = normalizeCity(match?.[1] || "");

      if (!city) {
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: "⚠️ Please provide a valid city (e.g., 'hotels in London')." },
        ]);
        return;
      }

      try {
        const res = await axios.get(`/api/hotels/${encodeURIComponent(city)}`);
        
        if (res.data?.data?.length) {
          const hotels = res.data.data;
          let hotelText = `🏨 Hotels in ${city}:\n\n`;
          
          hotels.forEach(hotel => {
            hotelText += `**${hotel.name}** (${hotel.type}) - ${hotel.rating}⭐\n`;
            hotelText += `💰 ${hotel.price}\n`;
            hotelText += `🔗 [Book here](${hotel.link})\n\n`;
          });
          
          hotelText += "*All links open in new tabs*";
          
          setMessages((prev) => [...prev, { sender: "bot", text: hotelText }]);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "bot", text: `❌ No hotel information found for ${city}. Try major cities like London, Paris, Tokyo, New York, or Dubai.` },
          ]);
        }
      } catch (err) {
        console.error("Hotel error:", err.response?.data || err.message);
        setMessages((prev) => [
          ...prev,
          { sender: "bot", text: `❌ Error fetching hotel data for ${city}. Try major cities like London, Paris, Tokyo, New York, or Dubai.` },
        ]);
      }
      return;
    }

  
    // --- Default fallback ---
    setMessages((prev) => [...prev, { sender: "bot", text: "I can help you with:\n• Weather information (e.g., 'weather in London')\n• Travel destinations (e.g., 'travel from Paris')\n• Hotel information (e.g., 'hotels in Tokyo')\n• Airline check-in links (e.g., 'check in for BA')\n• Capital city information (e.g., 'what is the capital of France?')" }]);
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
