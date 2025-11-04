# MSI Remote Agent Installer

This directory contains the WiX Toolset configuration and build scripts for creating the MSI installer package.

## Quick Start

1. Install prerequisites (Node.js, WiX Toolset)
2. Configure `config.json` with your server URL
3. Run `node build-msi.js`
4. Find the installer at `MSIRemoteAgent.msi`

## Files

- **Product.wxs** - WiX source file defining the installer structure
- **config.json** - Default configuration for the agent
- **License.rtf** - License agreement shown during installation
- **build-msi.js** - Automated build script
- **BUILD.md** - Detailed build instructions

## Documentation

See [BUILD.md](BUILD.md) for complete build instructions and customization options.

## Requirements

- Windows OS
- Node.js 18+
- WiX Toolset 3.11+
- Administrator privileges (for service installation)
