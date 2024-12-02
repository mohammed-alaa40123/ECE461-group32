// backend/src/rating/index.ts

/**
 * This module handles the main execution logic for rating operations.
 */

import { exit } from "process";
import { getLogger, logTestResults } from "./logger";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { calculateNetScore } from "./metrics/netScore";
import "dotenv/config";
import { validateGithubToken } from "./util";

// Immediately Invoked Async Function Expression (IIAFE)
(async () => {
  const logger = getLogger();

  // Retrieve the command or file argument, assuming it's passed as the first CLI argument
  const commandOrFile = process.argv[2];

  try {
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

    // If 'repos' directory exists, remove it
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const reposDir = path.resolve(__dirname, "..", "repos");
      await fs.rm(reposDir, { recursive: true, force: true });
    } catch (error) {
      logger.debug(error);
      console.error(error);
      exit(1);
    }

    // Additional logic can be placed here

  } catch (error) {
    logger.debug(error);
    console.error("Fatal Error:", error);
    exit(1);
  }
})();