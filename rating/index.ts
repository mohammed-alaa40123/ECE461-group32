/**
 * Main entry point for the application
 */
import { exit } from "process";
import { getLogger, logTestResults } from "./logger.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { calculateNetScore } from "./metrics/netScore.js";
import "dotenv/config";
import { validateGithubToken } from "./util.js";

if (!process.env.LOG_FILE || !process.env.GITHUB_TOKEN) {
  console.error("Missing environment variables");
  exit(1);
}

if (!(await validateGithubToken())) {
  console.error("Invalid GitHub token");
  exit(1);
}

const logger = getLogger();

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("No command provided");
  process.exit(1);
}

const commandOrFile = args[0];

switch (commandOrFile) {
  case "test":
    logger.info("Running tests");
    await logTestResults().catch((e) => {
      logger.debug(e);
      console.error(e);
      exit(1);
    });
    break;
  default:
    logger.info("Processing URL file");
    await calculateNetScore(commandOrFile).catch((e) => {
      logger.debug(e);
      console.error(e);
      exit(1);
    });
    break;
}

// if repos dir exists, remove it
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const reposDir = path.resolve(__dirname, "..", "repos");
  await fs.rm(reposDir, { recursive: true, force: true });
} catch (error) {
  if (!(error as Error).message.includes("no such file or directory")) {
    logger.debug("Error removing repos directory", error);
  }
}
