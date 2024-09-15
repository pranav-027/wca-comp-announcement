const express = require("express");
const path = require("path");
const { getCompetitionMessage, getCompetitionFbMessage, getMarkdownMessage } = require("./my_app"); // Logic methods

const app = express();
const port = 3000;

// Set view engine
app.set("view engine", "ejs");
// Set views directory
app.set("views", path.join(__dirname, "views"));

// Middleware to serve static files (CSS, JS, etc.)
app.use("/static", express.static(path.join(__dirname, "static")));

// Middleware to parse JSON and URL-encoded form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route to serve the index.html
app.get("/", (req, res) => {
  res.render("index");
});

// Route to handle the POST request
app.post("/result", async (req, res) => {
  try {
    const competitionUrl = req.body.competition_url;

    const compWhatsAppMessage = await getCompetitionMessage(competitionUrl);
    const compFbMessage = await getCompetitionFbMessage(competitionUrl);
    const compMarkdownMessage = await getMarkdownMessage(competitionUrl);

    res.render("result", {
      message: compWhatsAppMessage,
      fbMessage: compFbMessage,
      markdownMessage: compMarkdownMessage
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send("Server Error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
