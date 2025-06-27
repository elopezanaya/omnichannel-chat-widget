// release.js - Wrapper script for release-orchestrator.js
// This script ensures correct directory context for running the release orchestrator

import { execSync } from "child_process";
import path from "path";

// Parse command line arguments to pass through to the orchestrator
const args = process.argv.slice(2);
const safetyArg = args.includes("--safety") ? "--safety" : "";
const chatArg = args.includes("--chat") ? "--chat" : "";

// Get the directory where this script is located
const scriptDir = path.dirname(new URL(import.meta.url).pathname);

try {
    // Run the release orchestrator with the given arguments
    const command = `node ${path.join(scriptDir, "release-orchestrator.js")} ${safetyArg} ${chatArg}`;
    execSync(command, { stdio: "inherit" });
} catch (error) {
    // The orchestrator will handle most errors, this is just for unexpected failures
    console.error("Release failed:", error.message);
    process.exit(1);
}
