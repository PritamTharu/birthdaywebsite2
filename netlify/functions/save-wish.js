const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod === "POST") {
    try {
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ status: "error", message: "Request body is empty" })
        };
      }

      const { wish } = JSON.parse(event.body);
      if (!wish || wish.trim() === "") {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ status: "error", message: "Wish text is empty" })
        };
      }

      // Format current timestamp in India Standard Time (IST)
      const now = new Date();
      const dateStr = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      // Resolve workspace root directory to write wishes.md
      const workspaceDir = path.resolve(__dirname, '../../');
      const wishesFilePath = path.join(workspaceDir, 'wishes.md');

      // Check if wishes.md exists, otherwise create it with header
      if (!fs.existsSync(wishesFilePath)) {
        fs.writeFileSync(
          wishesFilePath,
          `# Neharika's Birthday Wishes 🌟✨\n\nThis file lists wishes typed by Neharika in the celebration application.\n\n`,
          'utf8'
        );
      }

      // Append the new wish as a clean bullet point
      const bulletPoint = `- **[${dateStr}]** ${wish.trim()}\n`;
      fs.appendFileSync(wishesFilePath, bulletPoint, 'utf8');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: "success",
          message: "Wish successfully written to wishes.md!"
        })
      };
    } catch (err) {
      console.error("Error writing wish to file:", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ status: "error", message: err.message })
      };
    }
  }

  // Support GET request to view the wishes in JSON
  if (event.httpMethod === "GET") {
    try {
      const workspaceDir = path.resolve(__dirname, '../../');
      const wishesFilePath = path.join(workspaceDir, 'wishes.md');
      let fileContent = "No wishes made yet.";
      
      if (fs.existsSync(wishesFilePath)) {
        fileContent = fs.readFileSync(wishesFilePath, 'utf8');
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ status: "success", content: fileContent })
      };
    } catch (err) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ status: "error", message: err.message })
      };
    }
  }

  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ status: "error", message: "Method Not Allowed" })
  };
};
