// release-orchestrator.js

import { execSync } from "child_process";
import fs from "fs";
import readline from "readline";

// Parse command line arguments
const args = process.argv.slice(2);
const SAFETY_MODE = args.includes("--safety");
const HELP_MODE = args.includes("--help") || args.includes("-h");

class ReleaseOrchestrator {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.colors = {
            reset: "\x1b[0m",
            bright: "\x1b[1m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            red: "\x1b[31m",
            blue: "\x1b[34m",
            cyan: "\x1b[36m"
        };

        this.config = {
            upstream: "upstream", // Default upstream remote name
            mainBranch: "main", // Default main branch name
            changelogPath: "../CHANGE_LOG.md", // Path to the CHANGELOG at the root
            safetyMode: SAFETY_MODE
        };
    }

    async start() {
        try {
            this.printHeader("OSS Release Orchestrator");
            
            if (this.config.safetyMode) {
                this.printWarning("SAFETY MODE ENABLED: Critical operations will require triple confirmation");
            }

            // Validate environment
            await this.validateEnvironment();

            // Get current version and state
            const packageInfo = this.getPackageInfo();
            console.log(`${this.colors.cyan}Current package:${this.colors.reset} ${packageInfo.name}@${packageInfo.version}`);

            // Determine workflow
            const workflowType = await this.promptChoice(
                "Select workflow",
                [
                    "Create an official release (tag and publish)",
                    "Prepare for next version after a release",
                    "Complete full release cycle (both steps above)",
                    "Create a hotfix release"
                ]
            );

            switch (workflowType) {
                case 0:
                    await this.officialReleaseWorkflow(packageInfo);
                    break;
                case 1:
                    await this.prepareNextVersionWorkflow(packageInfo);
                    break;
                case 2:
                    await this.fullReleaseWorkflow(packageInfo);
                    break;
                case 3:
                    await this.hotfixReleaseWorkflow(packageInfo);
                    break;
            }

            this.printSuccess("Release orchestration completed successfully!");
        } catch (error) {
            this.printError(`Release process failed: ${error.message}`);
            if (error.stack) console.log(error.stack);
        } finally {
            this.rl.close();
        }
    }

    async validateEnvironment() {
        this.printStep("Validating environment");

        // Check for git
        try {
            execSync("git --version", { stdio: "ignore" });
        } catch (error) {
            throw new Error("Git is not installed or not in PATH");
        }

        // Check if in git repository
        try {
            execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
        } catch (error) {
            throw new Error("Not in a git repository");
        }

        // Check for package.json
        if (!fs.existsSync("./package.json")) {
            throw new Error("package.json not found in current directory");
        }

        // Check for upstream remote
        try {
            const remotes = execSync("git remote").toString().trim().split("\n");
            if (!remotes.includes(this.config.upstream)) {
                const defaultRemote = remotes[0];
                console.log(`${this.colors.yellow}Warning:${this.colors.reset} Remote '${this.config.upstream}' not found`);

                const useDefault = await this.promptYesNo(`Use '${defaultRemote}' as upstream remote?`);
                if (useDefault) {
                    this.config.upstream = defaultRemote;
                } else {
                    const customRemote = await this.prompt("Enter the name of your upstream remote:");
                    if (!remotes.includes(customRemote)) {
                        throw new Error(`Remote '${customRemote}' not found`);
                    }
                    this.config.upstream = customRemote;
                }
            }
        } catch (error) {
            if (!error.message.includes("not found")) {
                throw error;
            }
            throw new Error("Failed to validate git remotes");
        }

        // Fetch latest from upstream
        try {
            this.printInfo("Fetching latest changes from upstream...");
            execSync(`git fetch ${this.config.upstream}`, { stdio: "ignore" });
        } catch (error) {
            throw new Error(`Failed to fetch from ${this.config.upstream}`);
        }

        this.printSuccess("Environment validation completed");
    }

    getPackageInfo() {
        const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
        return {
            name: packageJson.name,
            version: packageJson.version,
            isPrerelease: packageJson.version.includes("-")
        };
    }

    async officialReleaseWorkflow(packageInfo) {
        this.printHeader("Official Release Workflow");

        // 1. Make sure we're on the latest code
        this.printStep("Preparing workspace");

        // Pull latest changes
        try {
            this.printInfo(`Pulling latest changes from ${this.config.upstream}/${this.config.mainBranch}...`);
            execSync(`git checkout ${this.config.mainBranch}`, { stdio: "inherit" });
            execSync(`git pull ${this.config.upstream} ${this.config.mainBranch}`, { stdio: "inherit" });
        } catch (error) {
            throw new Error(`Failed to pull latest changes: ${error.message}`);
        }

        // 2. Create release branch
        const releaseVersion = await this.determineReleaseVersion(packageInfo);
        const branchName = `release-v${releaseVersion}`;

        try {
            this.printInfo(`Creating release branch: ${branchName}`);
            execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
        } catch (error) {
            throw new Error(`Failed to create branch: ${error.message}`);
        }

        // 3. Update CHANGELOG
        await this.updateChangelog(releaseVersion);

        // 4. Update version
        this.printStep(`Updating version to ${releaseVersion}`);
        try {
            execSync(`yarn version --new-version ${releaseVersion} --no-git-tag-version`, { stdio: "inherit" });
            
            // Run yarn install to update dependencies and yarn.lock
            this.printInfo("Running yarn install to update dependencies...");
            execSync("yarn install", { stdio: "inherit" });
            
            // Add package.json and yarn.lock (this project uses yarn)
            execSync("git add package.json", { stdio: "inherit" });
            if (fs.existsSync("./yarn.lock")) {
                execSync("git add yarn.lock", { stdio: "inherit" });
            }
            execSync(`git commit -m "Release v${releaseVersion}"`, { stdio: "inherit" });
        } catch (error) {
            throw new Error(`Failed to update version: ${error.message}`);
        }

        // 5. Create and push tag
        this.printStep(`Creating and pushing tag mex-${releaseVersion}`);
        const tagMessage = await this.prompt(`Enter tag annotation message for mex-${releaseVersion} (no quotes needed):`, `Release version ${releaseVersion}`);        try {
            // Create annotated tag
            if (!await this.safetyConfirm(`create a new tag mex-${releaseVersion}`)) {
                this.printWarning("Tag creation cancelled");
                return;
            }
            
            execSync(`git tag -a mex-${releaseVersion} -m "${tagMessage}"`, { stdio: "inherit" });
            
            // Show tag details for review
            this.printInfo(`Showing contents of tag mex-${releaseVersion} for review:`);
            console.log("\n");
            execSync(`git show mex-${releaseVersion}`, { stdio: "inherit" });
            console.log("\n");

            // Confirm push after reviewing tag contents
            const confirmPush = await this.promptYesNo(`After reviewing the changes, are you ready to push tag mex-${releaseVersion} to ${this.config.upstream}?`);
            if (!confirmPush) {
                this.printWarning("Tag creation completed but not pushed. You can push later with:");
                console.log(`git push ${this.config.upstream} mex-${releaseVersion}`);
                return;
            }

            // Additional safety check for pushing tag
            if (!await this.safetyConfirm(`push tag mex-${releaseVersion} to ${this.config.upstream}`)) {
                this.printWarning("Tag push cancelled. You can push later with:");
                console.log(`git push ${this.config.upstream} mex-${releaseVersion}`);
                return;
            }
            
            // Push tag
            execSync(`git push ${this.config.upstream} mex-${releaseVersion}`, { stdio: "inherit" });
            this.printSuccess(`Tag mex-${releaseVersion} pushed successfully!`);
            this.printInfo("Release pipeline should be triggered automatically");
        } catch (error) {
            throw new Error(`Failed to create or push tag: ${error.message}`);
        }
    }

    async prepareNextVersionWorkflow(packageInfo) {
        this.printHeader("Prepare Next Version Workflow");

        // 1. Determine next development version
        const currentVersion = packageInfo.version;
        let nextVersion;

        if (packageInfo.isPrerelease) {
            this.printWarning("Current version is already a prerelease. Be careful about version ordering.");
            const suggestedVersion = this.suggestNextVersion(currentVersion, true);
            nextVersion = await this.prompt("Enter next development version:", suggestedVersion);
        } else {
            const suggestedVersion = this.suggestNextVersion(currentVersion, true);
            nextVersion = await this.prompt("Enter next development version:", suggestedVersion);
        }

        // 2. Create branch for version bump
        const branchName = `bump-v${nextVersion}`;

        try {
            if (!await this.safetyConfirm(`create a new branch: ${branchName}`)) {
                this.printWarning("Branch creation cancelled");
                return;
            }
            
            this.printInfo(`Creating branch: ${branchName}`);
            execSync(`git checkout -b ${branchName}`, { stdio: "inherit" });
        } catch (error) {
            throw new Error(`Failed to create branch: ${error.message}`);
        }

        // 3. Update version
        this.printStep(`Updating version to ${nextVersion}`);
        try {
            execSync(`yarn version --new-version ${nextVersion} --no-git-tag-version`, { stdio: "inherit" });
            
            // Run yarn install to update dependencies and yarn.lock
            this.printInfo("Running yarn install to update dependencies...");
            execSync("yarn install", { stdio: "inherit" });
            
            // Add package.json and yarn.lock (this project uses yarn)
            execSync("git add package.json", { stdio: "inherit" });
            if (fs.existsSync("./yarn.lock")) {
                execSync("git add yarn.lock", { stdio: "inherit" });
            }
            execSync(`git commit -m "Bump version to ${nextVersion}"`, { stdio: "inherit" });
        } catch (error) {
            throw new Error(`Failed to update version: ${error.message}`);
        }

        // 4. Push branch and create PR
        const pushBranch = await this.promptYesNo(`Push branch ${branchName} to origin?`);
        if (pushBranch) {
            if (!await this.safetyConfirm(`push branch ${branchName} to origin`)) {
                this.printWarning("Branch push cancelled. You can push later with:");
                console.log(`git push -u origin ${branchName}`);
                return;
            }
            
            try {
                execSync(`git push -u origin ${branchName}`, { stdio: "inherit" });
                this.printSuccess("Branch pushed successfully!");
                this.printInfo(`Create a pull request from ${branchName} to ${this.config.mainBranch}`);
            } catch (error) {
                throw new Error(`Failed to push branch: ${error.message}`);
            }
        } else {
            this.printWarning("Branch created but not pushed. You can push later with:");
            console.log(`git push -u origin ${branchName}`);
        }
    }

    async fullReleaseWorkflow(packageInfo) {
        // First do the official release
        await this.officialReleaseWorkflow(packageInfo);

        // Then prepare for next version
        // Get updated package info after release
        const updatedPackageInfo = this.getPackageInfo();
        await this.prepareNextVersionWorkflow(updatedPackageInfo);
    }

    async hotfixReleaseWorkflow(packageInfo) {
        this.printHeader("Hotfix Release Workflow");

        // 1. Determine hotfix version
        const currentVersion = packageInfo.version;
        const baseVersion = currentVersion.includes("-")
            ? currentVersion.split("-")[0]
            : currentVersion;

        const lastVersion = await this.prompt("Enter the last released version to hotfix:", baseVersion);
        const hotfixVersion = this.suggestHotfixVersion(lastVersion);
        const confirmedVersion = await this.prompt("Enter hotfix version:", hotfixVersion);

        // 2. Create hotfix branch
        const branchName = `hotfix-v${confirmedVersion}`;

        try {
            this.printInfo(`Creating hotfix branch: ${branchName}`);
            execSync(`git checkout -b ${branchName} ${this.config.upstream}/${this.config.mainBranch}`, { stdio: "inherit" });
        } catch (error) {
            throw new Error(`Failed to create hotfix branch: ${error.message}`);
        }

        // 3. Update CHANGELOG
        await this.updateChangelog(confirmedVersion, true);

        // 4. Update version
        this.printStep(`Updating version to ${confirmedVersion}`);
        try {
            execSync(`yarn version --new-version ${confirmedVersion} --no-git-tag-version`, { stdio: "inherit" });
            
            // Run yarn install to update dependencies and yarn.lock
            this.printInfo("Running yarn install to update dependencies...");
            execSync("yarn install", { stdio: "inherit" });
            
            // Add package.json and yarn.lock (this project uses yarn)
            execSync("git add package.json", { stdio: "inherit" });
            if (fs.existsSync("./yarn.lock")) {
                execSync("git add yarn.lock", { stdio: "inherit" });
            }
            execSync(`git commit -m "Hotfix v${confirmedVersion}"`, { stdio: "inherit" });
        } catch (error) {
            throw new Error(`Failed to update version: ${error.message}`);
        }

        // 5. Create and push tag
        this.printStep(`Creating and pushing tag mex-${confirmedVersion}`);
        const tagMessage = await this.prompt(`Enter tag annotation message for mex-${confirmedVersion} (no quotes needed):`, `Hotfix version ${confirmedVersion}`);        try {
            // Create annotated tag
            if (!await this.safetyConfirm(`create a new hotfix tag mex-${confirmedVersion}`)) {
                this.printWarning("Hotfix tag creation cancelled");
                return;
            }
            
            execSync(`git tag -a mex-${confirmedVersion} -m "${tagMessage}"`, { stdio: "inherit" });
            
            // Show tag details for review
            this.printInfo(`Showing contents of tag mex-${confirmedVersion} for review:`);
            console.log("\n");
            execSync(`git show mex-${confirmedVersion}`, { stdio: "inherit" });
            console.log("\n");
            
            // Confirm push after reviewing tag contents
            const confirmPush = await this.promptYesNo(`After reviewing the changes, are you ready to push tag mex-${confirmedVersion} to ${this.config.upstream}?`);
            if (!confirmPush) {
                this.printWarning("Tag creation completed but not pushed. You can push later with:");
                console.log(`git push ${this.config.upstream} mex-${confirmedVersion}`);
                return;
            }
            
            // Additional safety check for pushing tag
            if (!await this.safetyConfirm(`push hotfix tag mex-${confirmedVersion} to ${this.config.upstream}`)) {
                this.printWarning("Tag push cancelled. You can push later with:");
                console.log(`git push ${this.config.upstream} mex-${confirmedVersion}`);
                return;
            }
            
            // Push tag
            execSync(`git push ${this.config.upstream} mex-${confirmedVersion}`, { stdio: "inherit" });
            this.printSuccess(`Tag mex-${confirmedVersion} pushed successfully!`);
            this.printInfo("Release pipeline should be triggered automatically");
        } catch (error) {
            throw new Error(`Failed to create or push tag: ${error.message}`);
        }
    }

    async updateChangelog(version, isHotfix = false) {
        this.printStep(`Updating CHANGELOG for version ${version}`);

        if (!fs.existsSync(this.config.changelogPath)) {
            this.printWarning(`CHANGELOG not found at ${this.config.changelogPath}`);
            const createChangelog = await this.promptYesNo("Create a new CHANGE_LOG.md?");
            if (createChangelog) {
                try {
                    // Make sure parent directory exists
                    const dirPath = require('path').dirname(this.config.changelogPath);
                    if (!fs.existsSync(dirPath)) {
                        fs.mkdirSync(dirPath, { recursive: true });
                        this.printInfo(`Created directory: ${dirPath}`);
                    }
                    
                    const initialContent = `# Changelog\n\n## ${version} (${new Date().toISOString().split("T")[0]})\n\n`;
                    fs.writeFileSync(this.config.changelogPath, initialContent, "utf8");
                    this.printInfo(`Created new CHANGE_LOG.md at ${this.config.changelogPath}`);
                } catch (error) {
                    this.printError(`Failed to create changelog: ${error.message}`);
                    throw new Error(`Could not create changelog file: ${error.message}`);
                }
            } else {
                this.printInfo("Skipping CHANGELOG update");
                return;
            }
        }

        // Open the changelog in editor or provide guidance
        this.printInfo(`Please update ${this.config.changelogPath} for version ${version}`);
        this.printInfo("Add a new section at the top of the file:");
        console.log(`## ${version} (${new Date().toISOString().split("T")[0]})\n`);

        if (isHotfix) {
            this.printInfo("For a hotfix, include only the bug fixes addressed");
        } else {
            this.printInfo("Include all notable changes since the last release");
        }

        // Try up to 3 times to get changelog updates
        let changelogUpdated = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!changelogUpdated && attempts < maxAttempts) {
            attempts++;
            
            if (attempts > 1) {
                this.printWarning(`Attempt ${attempts} of ${maxAttempts} to update the changelog`);
            }
            
            await this.prompt("Press Enter once you have updated the CHANGE_LOG...");

            // Check if changes were made
            const status = execSync("git status --porcelain").toString();
            
            // Get the relative path from the current working directory to CHANGE_LOG.md
            const changelogRelativePath = this.config.changelogPath.replace(/^\.\//, ""); // Remove potential ./ prefix
            const changelogName = "CHANGE_LOG.md"; // Filename to look for
            
            // Check if either the path or just the filename is in the status
            if (!status.includes(changelogRelativePath) && !status.includes(changelogName)) {
                this.printInfo("No changes detected in CHANGE_LOG.md based on git status");
                
                if (attempts >= maxAttempts) {
                    const forceCommit = await this.promptYesNo("Maximum attempts reached. No changes detected in CHANGE_LOG. Commit anyway?");
                    if (!forceCommit) {
                        throw new Error("CHANGELOG not updated after maximum attempts");
                    }
                    changelogUpdated = true; // Force continue even without changes
                } else {
                    this.printWarning(`No changes detected in CHANGE_LOG. Please try again (${attempts}/${maxAttempts})`);
                    // Continue to next iteration of the loop
                }
            } else {
                changelogUpdated = true; // Changes detected
            }
        }

        // Commit changes
        try {
            try {
                // Try using the configured path
                execSync(`git add ${this.config.changelogPath}`, { stdio: "inherit" });
            } catch (error) {
                this.printWarning(`Failed to add using configured path: ${error.message}`);
                // Fallback to the absolute path if possible
                try {
                    const absPath = fs.realpathSync(this.config.changelogPath);
                    execSync(`git add "${absPath}"`, { stdio: "inherit" });
                    this.printInfo(`Successfully added changelog using absolute path: ${absPath}`);
                } catch (err) {
                    this.printError(`Could not resolve or add changelog file: ${err.message}`);
                    throw new Error("Failed to add CHANGELOG to git");
                }
            }
            
            execSync(`git commit -m "Update CHANGELOG for v${version}"`, { stdio: "inherit" });
            this.printSuccess("CHANGELOG updated and committed");
        } catch (error) {
            if (error.message === "CHANGELOG not updated after maximum attempts") {
                throw error;
            }
            throw new Error(`Failed to commit CHANGELOG: ${error.message}`);
        }
    }

    async determineReleaseVersion(packageInfo) {
        const currentVersion = packageInfo.version;

        // If current version is already a release version (no prerelease identifier)
        if (!packageInfo.isPrerelease) {
            this.printWarning(`Current version ${currentVersion} is not a prerelease`);
            const suggestedNext = this.suggestNextVersion(currentVersion, false);
            return await this.prompt("Enter release version:", suggestedNext);
        }

        // If it's a prerelease, suggest the release version without prerelease identifier
        const baseVersion = currentVersion.split("-")[0];
        return await this.prompt("Enter release version:", baseVersion);
    }

    suggestNextVersion(version, asPrerelease = false) {
        if (!version) return "0.1.0";

        // Remove prerelease identifiers if present
        const baseVersion = version.includes("-") ? version.split("-")[0] : version;

        // Parse the version
        const parsed = baseVersion.split(".").map(Number);

        if (parsed.length !== 3) {
            return asPrerelease ? "0.1.0-0" : "0.1.0";
        }

        const [major, minor, patch] = parsed;

        // For prerelease, increment patch and add prerelease identifier
        if (asPrerelease) {
            return `${major}.${minor}.${patch + 1}-0`;
        }

        // For regular release, just increment patch
        return `${major}.${minor}.${patch + 1}`;
    }

    suggestHotfixVersion(version) {
        if (!version) return "0.0.1";

        // Remove prerelease identifiers if present
        const baseVersion = version.includes("-") ? version.split("-")[0] : version;

        // Parse the version
        const parsed = baseVersion.split(".").map(Number);

        if (parsed.length !== 3) {
            return "0.0.1";
        }

        const [major, minor, patch] = parsed;

        // For hotfix, just increment patch
        return `${major}.${minor}.${patch + 1}`;
    }

    // Helper methods for prompts and output formatting

    prompt(question, defaultValue = "") {
        return new Promise((resolve) => {
            const defaultText = defaultValue ? ` (${defaultValue})` : "";
            this.rl.question(`${question}${defaultText}: `, (answer) => {
                resolve(answer || defaultValue);
            });
        });
    }

    async promptYesNo(question) {
        return new Promise((resolve) => {
            this.rl.question(`${question} (y/n): `, (answer) => {
                resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
            });
        });
    }

    async safetyConfirm(action) {
        if (!this.config.safetyMode) {
            return true; // Skip safety checks if not in safety mode
        }

        this.printWarning(`SAFETY CHECK: You are about to ${action}`);
        this.printWarning("This action could affect your repository state");
        
        // First confirmation
        let confirm = await this.promptYesNo(`Are you SURE you want to ${action}? (1/3)`);
        if (!confirm) return false;
        
        // Second confirmation
        confirm = await this.promptYesNo(`Please confirm again that you want to ${action}? (2/3)`);
        if (!confirm) return false;
        
        // Third confirmation
        confirm = await this.promptYesNo(`FINAL CONFIRMATION: ${action}? (3/3)`);
        return confirm;
    }

    async promptChoice(question, choices) {
        console.log(`\n${question}:`);
        choices.forEach((choice, index) => {
            console.log(`  ${index + 1}. ${choice}`);
        });

        const answer = await this.prompt("Enter number");
        const choice = parseInt(answer) - 1;

        if (isNaN(choice) || choice < 0 || choice >= choices.length) {
            this.printError("Invalid choice");
            return this.promptChoice(question, choices);
        }

        return choice;
    }

    printHeader(text) {
        console.log(`\n${this.colors.bright}${this.colors.blue}=== ${text} ===${this.colors.reset}\n`);
    }

    printStep(text) {
        console.log(`\n${this.colors.bright}${this.colors.cyan}> ${text}${this.colors.reset}`);
    }

    printInfo(text) {
        console.log(`${this.colors.blue}ℹ ${text}${this.colors.reset}`);
    }

    printSuccess(text) {
        console.log(`${this.colors.green}✓ ${text}${this.colors.reset}`);
    }

    printWarning(text) {
        console.log(`${this.colors.yellow}⚠ ${text}${this.colors.reset}`);
    }

    printError(text) {
        console.log(`${this.colors.red}✗ ${text}${this.colors.reset}`);
    }
}

// Run the orchestrator
if (HELP_MODE) {
    console.log(`
=== OSS Release Orchestrator Help ===

Usage: node release-orchestrator.js [options]

Options:
  --help, -h     Show this help message
  --safety       Enable safety mode (requires triple confirmation for critical actions)

Description:
  The release orchestrator guides you through different release workflows:
  1. Create an official release (tag and publish)
  2. Prepare for next version after a release
  3. Complete full release cycle (both steps above)
  4. Create a hotfix release

  Safety mode will require triple confirmation for critical operations
  like tag creation and pushing to remote repositories.
`);
} else {
    const orchestrator = new ReleaseOrchestrator();
    orchestrator.start();
}
