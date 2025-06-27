#!/usr/bin/env node

/**
 * Release Script Wrapper
 * This script serves as a simple wrapper around the release-orchestrator.js script.
 * It passes through the --safety flag if provided.
 */

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check for safety flag
const safetyFlag = process.argv.includes("--safety") ? "--safety" : "";

try {
    // Execute the release orchestrator with any passed arguments
    execSync(`node ${path.join(__dirname, "release-orchestrator.js")} ${safetyFlag}`, { 
        stdio: "inherit"
    });
} catch (error) {
    console.error("Release process failed:", error.message);
    process.exit(1);
}
