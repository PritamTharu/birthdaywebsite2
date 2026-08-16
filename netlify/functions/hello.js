// Netlify Serverless Function: hello.js
// Location: netlify/functions/hello.js

// In-memory data store (persists as long as the serverless execution container remains warm)
let wishesStore = [
  {
    id: 1,
    name: "Aarav",
    message: "Happy Birthday Neharika! Wishing you a spectacular year ahead filled with magic, success, and endless joy! ✨🍰",
    timestamp: "2026-08-13T10:00:00.000Z"
  },
  {
    id: 2,
    name: "Tanya",
    message: "To my favorite person! May this birthday bring you as much happiness as you bring to everyone around you. Cheers to 2026! 🥂❤️",
    timestamp: "2026-08-13T11:15:00.000Z"
  },
  {
    id: 3,
    name: "Kabir",
    message: "Happy Birthday! Keep shining bright, chasing dreams, and inspiring us all. Have a fabulous day, Neharika! 🚀🎉",
    timestamp: "2026-08-13T12:30:00.000Z"
  },
  {
    id: 4,
    name: "Meera",
    message: "Wishing you a wonderful day filled with cakes, balloons, and your favorite people. You deserve the best! 🎂🎈",
    timestamp: "2026-08-13T13:45:00.000Z"
  }
];

let globalStats = {
  candlesLit: 42,
  giftsUnlocked: 7
};

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Successful preflight" })
    };
  }

  try {
    if (event.httpMethod === "GET") {
      // Return list of wishes and stats
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "success",
          stats: globalStats,
          wishes: wishesStore
        })
      };
    } 
    
    if (event.httpMethod === "POST") {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ status: "error", message: "Body is required" })
        };
      }

      const body = JSON.parse(event.body);

      // Handle Action 1: Add a birthday wish
      if (body.action === "addWish") {
        const { name, message } = body;
        
        if (!name || !message || name.trim() === "" || message.trim() === "") {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ status: "error", message: "Name and message are required" })
          };
        }

        const newWish = {
          id: wishesStore.length + 1,
          name: name.trim().substring(0, 50),
          message: message.trim().substring(0, 500),
          timestamp: new Date().toISOString()
        };

        wishesStore.unshift(newWish); // Add new wish to the top
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            status: "success",
            message: "Wish added successfully!",
            wishes: wishesStore
          })
        };
      }

      // Handle Action 2: Increment candle lit stats
      if (body.action === "lightCandle") {
        globalStats.candlesLit += 1;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: "success",
            stats: globalStats
          })
        };
      }

      // Handle Action 3: Increment gift unlocked stats
      if (body.action === "unlockGift") {
        globalStats.giftsUnlocked += 1;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            status: "success",
            stats: globalStats,
            secretGreeting: "Happy Birthday Neharika! Here is your special unlock: May this year bring you closer to all your beautiful aspirations, and may your smile grow wider every single day! You are deeply appreciated and loved. ❤️"
          })
        };
      }

      // If action is unrecognized
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ status: "error", message: "Invalid action specified" })
      };
    }

    // Default error for unhandled HTTP methods
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ status: "error", message: "Method Not Allowed" })
    };

  } catch (error) {
    console.error("Function execution error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ status: "error", message: "Internal Server Error" })
    };
  }
};
