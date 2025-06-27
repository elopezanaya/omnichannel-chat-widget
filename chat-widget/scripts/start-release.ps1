#!/usr/bin/env pwsh
# start-release.ps1 - A script to start the release process from GitHub Copilot Chat

param(
    [switch]$Safety,
    [string]$WorkflowType
)

# Navigate to the correct directory
Set-Location -Path "c:\src\OCW-FORK\omnichannel-chat-widget\chat-widget"

# Start the release process
if ($Safety) {
    Write-Host "Starting release process in safety mode..."
    node scripts/release.js --chat --safety
} else {
    Write-Host "Starting release process..."
    node scripts/release.js --chat
}

# The script will now prompt for input in a format that can be answered in GitHub Copilot Chat
