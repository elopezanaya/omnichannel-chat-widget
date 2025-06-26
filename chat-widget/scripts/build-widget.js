// @ts-check
/**
 * Chat Widget Build Helper Script
 * 
 * To use this script:
 * 1. Type "dracarys" in the Copilot chat
 * 2. Copilot will recognize the command and offer to run the build process
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configuration (can be customized by each developer)
const config = {
    sourceDirectory: process.env.SOURCE_DIR || "C:\\src\\OCW-FORK\\omnichannel-chat-widget\\chat-widget",
    destinationDirectory: process.env.DEST_DIR || "C:\\src\\CRM.OmniChannel.LiveChatWidget\\src",
    verbose: true
};

// Terminal colors for better output
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m", 
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    red: "\x1b[31m"
};

/**
 * Logs a message with optional styling
 * @param {string} message - The message to log
 * @param {string} color - Color code from the colors object
 */
function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

/**
 * Executes a shell command and returns the output
 * @param {string} command - Command to execute
 * @param {string} cwd - Working directory
 * @returns {string} Command output
 */
function executeCommand(command, cwd = config.sourceDirectory) {
    log(`Running: ${command}`, colors.cyan);
  
    try {
        const output = execSync(command, { 
            cwd, 
            stdio: config.verbose ? "inherit" : "pipe",
            encoding: "utf8"
        });
    
        log("✅ Command completed successfully", colors.green);
        return output;
    } catch (error) {
        // Enhanced error handling with detailed diagnostics
        log(`\n❌ COMMAND FAILED: ${command}`, colors.bright + colors.red);
        log(`Error message: ${error.message}`, colors.red);
        
        if (error.stderr) {
            log("\nError details:", colors.red);
            log(error.stderr, colors.red);
        }
        
        // Provide helpful context-aware suggestions based on the error
        suggestFixForError(command, error);
        
        throw error;
    }
}

/**
 * Provides intelligent suggestions based on the type of error encountered
 * @param {string} command - The command that failed
 * @param {Error} error - The error object
 */
function suggestFixForError(command, error) {
    const errorMsg = error.message.toLowerCase();
    const suggestions = [];
    
    // Yarn-related errors
    if (command.includes("yarn") && errorMsg.includes("not found")) {
        suggestions.push("Make sure Node.js and Yarn are installed and in your PATH");
        suggestions.push("Try running 'npm install -g yarn' to install Yarn");
    }
    
    // Build errors
    if (command.includes("build") && errorMsg.includes("syntax")) {
        suggestions.push("There may be syntax errors in the code");
        suggestions.push("Check recent changes for missing brackets, semicolons, etc.");
    }
    
    // Permission errors
    if (errorMsg.includes("permission") || errorMsg.includes("access")) {
        suggestions.push("You might not have sufficient permissions");
        suggestions.push("Try running the script with administrator privileges");
    }
    
    // Path errors
    if (errorMsg.includes("no such file") || errorMsg.includes("cannot find")) {
        suggestions.push("Check if the specified paths exist:");
        suggestions.push(`Source: ${config.sourceDirectory}`);
        suggestions.push(`Destination: ${config.destinationDirectory}`);
        suggestions.push("You can customize paths using environment variables SOURCE_DIR and DEST_DIR");
    }
    
    // Dependency errors
    if (errorMsg.includes("dependency") || errorMsg.includes("module")) {
        suggestions.push("There might be missing or incompatible dependencies");
        suggestions.push("Try running 'yarn install' before building");
    }
    
    // Network errors
    if (errorMsg.includes("network") || errorMsg.includes("enotfound") || errorMsg.includes("etimedout")) {
        suggestions.push("Check your internet connection");
        suggestions.push("If you're behind a proxy, make sure it's configured correctly");
    }
    
    // Display suggestions
    if (suggestions.length > 0) {
        log("\n💡 SUGGESTIONS:", colors.bright + colors.yellow);
        suggestions.forEach((suggestion, index) => {
            log(`  ${index + 1}. ${suggestion}`, colors.yellow);
        });
        log("\n");
    }
}

// Add environment sensing and auto-discovery capabilities
if (!process.env.SOURCE_DIR || !process.env.DEST_DIR) {
    log("🔍 Attempting to auto-detect repository locations...", colors.blue);
    
    // Try to find the repos in standard locations
    const possibleSourceDirs = [
        config.sourceDirectory,
        path.join(os.homedir(), "src", "OCW-FORK", "omnichannel-chat-widget", "chat-widget"),
        path.join(os.homedir(), "source", "OCW-FORK", "omnichannel-chat-widget", "chat-widget"),
        path.join(os.homedir(), "code", "OCW-FORK", "omnichannel-chat-widget", "chat-widget")
    ];
    
    const possibleDestDirs = [
        config.destinationDirectory,
        path.join(os.homedir(), "src", "CRM.OmniChannel.LiveChatWidget", "src"),
        path.join(os.homedir(), "source", "CRM.OmniChannel.LiveChatWidget", "src"),
        path.join(os.homedir(), "code", "CRM.OmniChannel.LiveChatWidget", "src")
    ];
    
    // Find first existing source directory
    for (const dir of possibleSourceDirs) {
        if (fs.existsSync(dir)) {
            if (!process.env.SOURCE_DIR) {
                config.sourceDirectory = dir;
                log(`✅ Auto-detected source directory: ${dir}`, colors.green);
                break;
            }
        }
    }
    
    // Find first existing destination directory
    for (const dir of possibleDestDirs) {
        if (fs.existsSync(dir)) {
            if (!process.env.DEST_DIR) {
                config.destinationDirectory = dir;
                log(`✅ Auto-detected destination directory: ${dir}`, colors.green);
                break;
            }
        }
    }
}

/**
 * Main build process
 */
async function buildChatWidget() {
    try {
        log("\n🔥 DRACARYS! Starting chat widget build process...\n", colors.bright + colors.yellow);
    
        // Step 1: Clean up previous tgz files
        log("\n📦 Step 1: Cleaning up previous packages...", colors.magenta);
        const tgzFiles = fs.readdirSync(config.sourceDirectory)
            .filter(file => file.endsWith(".tgz"));
    
        if (tgzFiles.length > 0) {
            tgzFiles.forEach(file => {
                fs.unlinkSync(path.join(config.sourceDirectory, file));
                log(`  Removed: ${file}`);
            });
        } else {
            log("  No previous packages found");
        }
    
        // Step 2: Build the widget
        log("\n🛠️ Step 2: Building chat widget...", colors.magenta);
        executeCommand("yarn build");
    
        // Step 3: Package the widget
        log("\n📦 Step 3: Packaging chat widget...", colors.magenta);
        executeCommand("yarn pack");
    
        // Step 4: Clean destination
        log("\n🧹 Step 4: Preparing destination...", colors.magenta);
    
        // Clean tgz files in destination
        const destTgzFiles = fs.readdirSync(config.destinationDirectory)
            .filter(file => file.endsWith(".tgz"));
    
        if (destTgzFiles.length > 0) {
            destTgzFiles.forEach(file => {
                fs.unlinkSync(path.join(config.destinationDirectory, file));
                log(`  Removed: ${file}`);
            });
        }
    
        // Clean dist directory
        const distDir = path.join(config.destinationDirectory, "dist");
        if (fs.existsSync(distDir)) {
            fs.rmSync(distDir, { recursive: true, force: true });
            log("  Removed dist directory");
        }
    
        // Step 5: Copy package to destination
        log("\n📋 Step 5: Copying package to destination...", colors.magenta);
        const newTgzFile = fs.readdirSync(config.sourceDirectory)
            .find(file => file.endsWith(".tgz"));
    
        if (!newTgzFile) {
            throw new Error("No .tgz package file found to copy");
        }
    
        fs.copyFileSync(
            path.join(config.sourceDirectory, newTgzFile),
            path.join(config.destinationDirectory, newTgzFile)
        );
        log(`  Copied: ${newTgzFile}`);
    
        // Step 6: Install package in destination
        log("\n📥 Step 6: Installing package in destination...", colors.magenta);
        executeCommand(`yarn add ./${newTgzFile}`, config.destinationDirectory);
    
        // Step 7: Run webpack build
        log("\n🚀 Step 7: Running webpack build...", colors.magenta);
        executeCommand("yarn build:webpack", config.destinationDirectory);
    
        // Done!
        log("\n✨ DRACARYS COMPLETE! Chat widget built and deployed successfully! ✨\n", colors.bright + colors.green);
    
    } catch (error) {
        log(`\n❌ BUILD FAILED: ${error.message}\n`, colors.bright + colors.red);
        process.exit(1);
    }
}

// Auto-execution when requested by Copilot
if (process.argv.includes("--copilot-run")) {
    buildChatWidget();
}

// Export the function for direct usage
export { buildChatWidget };
