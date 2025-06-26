# Chat Widget Build System

This build system provides an easy way to build, package, and install the Omnichannel Chat Widget.

## Folder Structure

```
chat-widget/
├── .copilot/               # Copilot prompt files
│   └── dracarys-build.prompt  # Prompt file for the "dracarys" command
├── scripts/                # Build script files
│   ├── build-widget.js     # Main build script
│   └── dracarys.js         # Command handler for the scripts folder
└── dracarys.js             # Root-level entry point
```

## How to Use

### Option 1: Using GitHub Copilot

1. Open VS Code with this workspace
2. Open the GitHub Copilot Chat panel
3. Type "dracarys" in the chat
4. Copilot will recognize the command and run the build process

### Option 2: Using the Command Line

Run the build process directly from the command line:

```
node dracarys.js dracarys
```

## Build Process

The build process performs the following steps:

1. Cleans up previous packages in both source and destination directories
2. Builds the chat widget
3. Packages it into a tgz file
4. Copies the package to the destination directory
5. Installs the package in the destination
6. Runs webpack to build the final output

## Customization

You can customize the build process by setting the following environment variables:

- `SOURCE_DIR`: The source directory (default: `C:\\src\\OCW-FORK\\omnichannel-chat-widget\\chat-widget`)
- `DEST_DIR`: The destination directory (default: `C:\\src\\CRM.OmniChannel.LiveChatWidget\\src`)

## Error Handling

The build process includes intelligent error handling that provides helpful suggestions based on the type of error encountered. If any step fails, the process will stop and display detailed error information.
