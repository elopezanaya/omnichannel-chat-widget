/**
 * Chat Widget Build Entry Point
 *
 * Simply type: "dracarys" in the Copilot chat while this file is open
 * or run this file directly with "node dracarys.js dracarys"
 */

// Import the build function directly from the scripts folder
import { buildChatWidget } from './scripts/build-widget.js';

console.log("🐉 Chat Widget Build Commander ready!");
console.log("Say 'dracarys' to Copilot to begin building the chat widget...");

// Listen for command
if (process.argv.includes("dracarys")) {
  console.log("🔥 Command recognized! Starting build process...");
  buildChatWidget();
}
