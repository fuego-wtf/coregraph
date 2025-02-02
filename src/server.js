"use strict";

require("dotenv").config();
const buildApp = require("./app");

async function startServer() {
  try {
    const app = await buildApp();
    const port = process.env.PORT || 3000;
    await app.listen({ port, host: process.env.HOST || '0.0.0.0' });
    app.log.info(`server listening on port ${port}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

startServer(); 