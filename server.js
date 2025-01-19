import express from "express";
import pkg from 'http-proxy-middleware';
const { createProxyMiddleware } = pkg;
import { load } from "cheerio";
import axios from "axios";
const { get } = axios;

const app = express();
const TARGET_URL = "https://www.onerugged.com/"; // Replace with the mother company's URL

// Middleware to modify HTML responses
app.use("/", async (req, res, next) => {
  try {
    // Fetch the content from the target website
    const response = await axios.get(`${TARGET_URL}${req.originalUrl}`, {
      responseType: "arraybuffer", // Ensure binary-safe handling for all types of content
    });
    if (response.status !== 200) {
      console.error("Error fetching the target URL:", `${TARGET_URL}${req.originalUrl}`);
      console.log(JSON.stringify(response));
    }
    const contentType = response.headers["content-type"];

    if (contentType) {
      if (contentType.includes("text/html")) {
        console.log("handling HTML content - START");
        // Handle HTML content
        const $ = load(response.data.toString("utf-8"));

        // Example: Replace contact information
        $("a[href^='mailto:']").attr("href", "mailto:tutaj@liteko.com");
        $("a[href^='mailto:']").text("tutaj@liteko.com");
        $("a[href^='tel:']").attr("href", "tel:+123456789");
        $(".contact-info").text("Your Custom Contact Info");

        // Example: Translate some text
        $("h1").each((_, el) => {
          $(el).text($(el).text().replace("Welcome", "Bienvenido"));
        });

        // Send modified HTML to the client
        res.setHeader("Content-Type", contentType);
        res.send($.html());
        console.log("handling HTML content - END");
      } else if (contentType.startsWith("image/")) {
        console.log("handling image content - START");
        // Handle image content
        res.setHeader("Content-Type", contentType);
        res.end(response.data, "binary");
        console.log("handling image content - END");
      } else {
        console.log(`handling other ${contentType} content - START`);
        // Handle other non-HTML and non-image content (e.g., JSON, CSS)
        res.setHeader("Content-Type", contentType);
        res.send(response.data);
        console.log("handling other content - END");
      }
    } else {
      // Handle cases where Content-Type is not provided
      res.status(500).send("Unable to determine content type.");
    }
  } catch (error) {
    console.error("Error fetching the target URL:", error.message);
    res.status(500).send("Error loading the page.");
  }
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server is running at http://localhost:${PORT}`);
});
