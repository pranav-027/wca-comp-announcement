const express = require("express");
const path = require("path");
const { getCompetitionMessage, getCompetitionFbMessage, getMarkdownMessage } = require("./my_app"); // Logic methods
const { RestrictionError } = require("./utils/errors");

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


app.get("/admin", (req, res) => { 
  res.render("login", { error: "Invalid credentials!" });
});


app.post("/admin", (req, res) => {
  const { username, password } = req.body;

  // Validate against environment variables
  if (
    username === process.env.ADMIN_ID &&
    password === process.env.ADMIN_PASSWORD
  ) {
    res.render("admin"); // Render the admin page on success
  } else {
    res.render("loginerror"); // Send an empty response for incorrect credentials
  }
});

// Route to handle the POST request
app.post("/result", async (req, res) => {
  try {
    const competitionUrl = req.body.competition_url;
    const isAdmin = req.body.is_admin === 'true';
    const compWhatsAppMessage = await getCompetitionMessage(competitionUrl, isAdmin);
    const compFbMessage = await getCompetitionFbMessage(competitionUrl, isAdmin);
    const compMarkdownMessage = await getMarkdownMessage(competitionUrl, isAdmin);

    res.render("result", {
      message: compWhatsAppMessage,
      fbMessage: compFbMessage,
      markdownMessage: compMarkdownMessage
    });
  } catch (error) {
      console.error("Unexpected error:", error);
      res.status(500).send("An unexpected error occurred.");
    }
  }
);

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
