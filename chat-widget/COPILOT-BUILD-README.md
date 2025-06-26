# Chat Widget Build Commander

This folder contains special files that allow you to build the chat widget using GitHub Copilot commands.

## How to Build with Copilot

1. Open any of these files in VS Code:
   - `dracarys.js`
   - `copilot-build.prompt`
   - `copilot-build.js`

2. Activate Copilot Chat (Ctrl+Shift+I or click the Copilot icon)

3. Type the magic word: `dracarys`

4. Copilot will recognize this command and offer to run the build process for you

5. Confirm, and the build will start automatically

## Manual Execution

If you prefer to run without Copilot, you can:

```bash
# Run directly
node dracarys.js dracarys

# Or use the build script
node copilot-build.js --copilot-run
```

## Customizing Paths

If your repositories are in different locations, you can set environment variables:

```bash
# Windows
set SOURCE_DIR=C:\your\source\path
set DEST_DIR=C:\your\destination\path
node dracarys.js dracarys

# PowerShell
$env:SOURCE_DIR="C:\your\source\path"
$env:DEST_DIR="C:\your\destination\path"
node dracarys.js dracarys

# Bash/Linux/MacOS
SOURCE_DIR=/your/source/path DEST_DIR=/your/destination/path node dracarys.js dracarys
```

## What it Does

This replaces the `build-and-copy.bat` script with a more robust Node.js implementation that:

1. Builds the chat widget in the OCW-FORK repository
2. Packages it into a tgz file
3. Copies the package to the CRM.OmniChannel.LiveChatWidget repository
4. Installs the package in the destination repository
5. Runs webpack build in the destination

All with better error handling and visual feedback!
