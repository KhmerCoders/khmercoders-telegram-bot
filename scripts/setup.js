const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Path to .dev.vars file
const envPath = path.join(__dirname, "..", ".dev.vars");

const updateEnvFile = () => {
  try {
    // Check if .dev.vars file already exists
    if (fs.existsSync(envPath)) {
      console.log("log: .dev.vars file already exists. Skipping creation.");
      return;
    }

    // Create the .dev.vars content with all required variables
    const envContent = `
    BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN_HERE"
    DEV_MODE=1`;

    // Write the content to .dev.vars file (only if it doesn't exist)
    fs.writeFileSync(envPath, envContent);
    console.log("log: .dev.vars file has been created with the required variables");
  } catch (error) {
    console.error("error: Error creating .env file:", error);
    process.exit(1);
  }
};

console.log("-> Setting up environment variables");
updateEnvFile()

console.log("-> Migrating database");
execSync("npm run migrate:dev");
