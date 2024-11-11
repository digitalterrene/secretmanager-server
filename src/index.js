const express = require("express");
const crypto = require("crypto");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").configDotenv();

const app = express();
app.use(express.json());

const corsOptions = {
  origin: ["https://localhost:3000", ""],
  methods: "POST",
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));
// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: "Too many requests, please try again later.",
});

app.use(limiter);

// Server-side secret, should be kept confidential
const SERVER_SECRET = process.env.SECRET; // Must remain constant

// Configurable parameters
const STRETCH_COUNT = 10000; // Number of additional hashing rounds

// Generate the secret based on phrase, and timestamp
app.post("/generate-secret", (req, res) => {
  const { phrase, timestamp } = req.body;

  // Validate inputs
  if (!validateInputs(phrase, timestamp)) {
    return res.status(400).json({
      error: "Invalid input. Check phrase, and timestamp.",
    });
  }

  // Generate the deterministic secret
  const secret = generateDeterministicSecret(phrase, timestamp);

  // Respond for client-side use
  res.json({ secret, phrase, timestamp });
});

// Function to validate phrase and timestamp inputs
function validateInputs(phrase, timestamp) {
  const phraseRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Check if the phrase is strong enough
  if (!phrase || !phraseRegex.test(phrase)) {
    return false;
  }

  // Check if timestamp is valid
  if (!timestamp || !/^\d{13}$/.test(timestamp)) {
    // Expecting a 13-digit Unix timestamp
    return false;
  }

  return true;
}

// Deterministic secret generation with hash stretching
function generateDeterministicSecret(phrase, timestamp) {
  let result = `${phrase}${timestamp}${SERVER_SECRET}`;

  for (let i = 0; i < STRETCH_COUNT; i++) {
    const hmac = crypto.createHmac("sha256", SERVER_SECRET);
    hmac.update(result);
    result = hmac.digest("hex");
  }

  return result;
}

const PORT = process.env.PORT;
app.listen(PORT, () => {
  app.post("/", (req, res) => {
    // Respond for client-side use
    res.send(`Server running on port ${PORT}`);
  });
});
