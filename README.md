> [!NOTE]
> This repo is a work in progress...

# KhmerCoders Telegram Bot

## Introduction

This is a bot designed for the Khmer Coders telegram community. Its primary function is to track message counts for members within a group and generate leaderboards.

## Getting Started

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/KhmerCoders/khmercoders-telegram-bot.git
   cd khmercoders-telegram-bot
   ```

2. **Install Dependencies**:

   ```bash
   npm install
   ```

3. Setting Up for Development:

   ```bash
   npm run setup
   ```

> [!IMPORTANT]
> Replace `YOUR_TELEGRAM_BOT_TOKEN_HERE` with your Bot Token in `.dev.vars`.
> In production, please set `DEV_MODE` to `0`. Or don't add `DEV_MODE` to your enviroment variable at all.

### Start Development Server

To start the bot locally:

```bash
npm run dev
```

### Configuring the Webhook

After deploying your Cloudflare Worker, you must inform Telegram where to send updates. Set the webhook URL using the following command:

```bash
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-worker-url.workers.dev/webhook/telegram
```

**Remember to replace**:

- `<YOUR_BOT_TOKEN>` with your actual Telegram bot token.
- `https://your-worker-url.workers.dev/webhook/telegram` with the URL of your deployed Cloudflare Worker.

### Cloudflare AI Gateway Setup

This bot utilizes a Cloudflare AI Gateway named `khmercoders-bot-summary-gw` for specific AI functionalities. You will need to create this gateway in your Cloudflare account to ensure the bot operates correctly.

## Production Migrations

To apply migrations to the production database:

```bash
npm run migrate:prod
```
