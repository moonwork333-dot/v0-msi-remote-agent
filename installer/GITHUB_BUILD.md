# Building MSI via GitHub Actions

Your project is now configured to build the MSI installer automatically using GitHub Actions.

## How It Works

The GitHub Actions workflow (`.github/workflows/build-msi.yml`) will automatically:
- Build the MSI installer on every push to main/master branch
- Build on pull requests
- Create releases with the MSI attached when you push a version tag

## Setup Steps

1. **Push your code to GitHub**:
   \`\`\`bash
   git add .
   git commit -m "Add MSI installer configuration"
   git push origin main
   \`\`\`

2. **Check the Actions tab** in your GitHub repository to see the build progress

3. **Download the MSI**:
   - Go to the "Actions" tab in your GitHub repo
   - Click on the latest workflow run
   - Download the "MSI-Installer" artifact

## Creating a Release

To create a release with the MSI:

\`\`\`bash
git tag v1.0.0
git push origin v1.0.0
\`\`\`

This will trigger a build and automatically create a GitHub release with the MSI attached.

## Manual Trigger

You can also manually trigger a build:
1. Go to the "Actions" tab
2. Select "Build MSI Installer"
3. Click "Run workflow"

## Current Configuration

- **WebSocket Server**: wss://val-closefisted-morgan.ngrok-free.dev
- **Build Platform**: Windows (via GitHub Actions)
- **Node.js Version**: 18

## Updating the Server URL

To change the WebSocket server URL, edit `installer/config.json` and push the changes.
