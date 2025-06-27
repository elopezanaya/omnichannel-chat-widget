// release.js - Wrapper script for release-orchestrator.js
// This script ensures correct directory context for running the release orchestrator

import { execSync } from "child_process";
import path from "path";
import process from "process";

// Parse command line arguments to pass through to the orchestrator
const args = process.argv.slice(2);
const safetyArg = args.includes("--safety") ? "--safety" : "";

// Get the directory where this script is located
const scriptDir = path.dirname(new URL(import.meta.url).pathname);

try {
    // Change to the chat-widget directory if not already there
    const currentDir = process.cwd();
    if (!currentDir.endsWith("chat-widget")) {
        console.warn("WARNING: This script should be run from the 'chat-widget' directory.");
        console.warn("Current directory: " + currentDir);
        console.warn("Attempting to find and change to the chat-widget directory...");
        
        // Try to change to chat-widget directory
        if (currentDir.includes("scripts")) {
            process.chdir("..");
            console.log("Changed directory to: " + process.cwd());
        }
    }
    
    // Run the release orchestrator with the given arguments
    const command = `node ${path.join(scriptDir, "release-orchestrator.js")} ${safetyArg}`;
    execSync(command, { stdio: "inherit" });
} catch (error) {
    // The orchestrator will handle most errors, this is just for unexpected failures
    console.error("Release failed:", error.message);
    process.exit(1);
}
