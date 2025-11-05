# Native Windows Service Implementation

This MSI installer now uses **native Windows Service** functionality instead of NSSM (Non-Sucking Service Manager). This eliminates third-party dependencies and reduces antivirus false positives.

## How It Works

### Installation Process

1. **MSI Installer** copies files to `C:\Program Files (x86)\MSI Remote Agent\`
2. **install-service.cmd** runs automatically and:
   - Creates a Windows Service using `sc.exe` (built-in Windows tool)
   - Configures the service to start automatically
   - Sets up automatic restart on failure
   - Starts the service immediately

### Service Configuration

- **Service Name**: `MSIRemoteAgent`
- **Display Name**: `MSI Remote Agent`
- **Start Type**: Automatic
- **Recovery**: Restarts automatically on failure (5s, 10s, 30s delays)
- **Account**: LocalSystem

### Uninstallation Process

1. **uninstall-service.cmd** runs automatically and:
   - Stops the service gracefully
   - Removes the service from Windows
2. **MSI Uninstaller** removes all files

## Benefits Over NSSM

### Security & Trust
- **No third-party executables** - Uses only Windows built-in tools (`sc.exe`)
- **Reduced antivirus flags** - No service wrapper that AV software might flag
- **Signed by Microsoft** - `sc.exe` is a trusted Windows component
- **Transparent operation** - Simple batch scripts that are easy to audit

### Reliability
- **Native Windows integration** - Uses official Windows Service API
- **Better error handling** - Direct control over service lifecycle
- **Automatic recovery** - Built-in restart on failure
- **Standard logging** - Uses Windows Event Viewer

### Maintenance
- **No external dependencies** - Nothing to download or update
- **Simpler build process** - No need to bundle NSSM.exe
- **Easier troubleshooting** - Standard Windows Service tools work

## Manual Service Management

### Check Service Status
\`\`\`cmd
sc query MSIRemoteAgent
\`\`\`

### Start Service
\`\`\`cmd
sc start MSIRemoteAgent
\`\`\`

### Stop Service
\`\`\`cmd
sc stop MSIRemoteAgent
\`\`\`

### View Service Configuration
\`\`\`cmd
sc qc MSIRemoteAgent
\`\`\`

### View Service in Services Manager
1. Press `Win + R`
2. Type `services.msc`
3. Find "MSI Remote Agent" in the list

## Troubleshooting

### Service Won't Start

1. **Check the log file**: `C:\Program Files (x86)\MSI Remote Agent\agent.log`
2. **Check Windows Event Viewer**:
   - Open Event Viewer (`eventvwr.msc`)
   - Go to Windows Logs > Application
   - Look for errors from "MSIRemoteAgent"

3. **Verify executable exists**:
   \`\`\`cmd
   dir "C:\Program Files (x86)\MSI Remote Agent\msi-agent.exe"
   \`\`\`

4. **Test executable manually**:
   \`\`\`cmd
   cd "C:\Program Files (x86)\MSI Remote Agent"
   msi-agent.exe
   \`\`\`

### Service Crashes Immediately

- Check `agent.log` for error messages
- Verify `config.json` has correct server URL
- Ensure network connectivity to server
- Check Windows Firewall isn't blocking the connection

### Reinstalling the Service

If you need to reinstall the service manually:

\`\`\`cmd
cd "C:\Program Files (x86)\MSI Remote Agent"
uninstall-service.cmd
install-service.cmd "C:\Program Files (x86)\MSI Remote Agent\"
\`\`\`

## Code Signing Recommendation

For production deployment, you should **code sign** the MSI installer and the agent executable:

1. **Get a code signing certificate** (see main README)
2. **Sign the executable**:
   \`\`\`cmd
   signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com msi-agent.exe
   \`\`\`
3. **Sign the MSI**:
   \`\`\`cmd
   signtool sign /f certificate.pfx /p password /t http://timestamp.digicert.com MSIRemoteAgent-1.0.0.msi
   \`\`\`

This will significantly reduce antivirus false positives and Windows SmartScreen warnings.

## Technical Details

### Service Creation Command

The installer uses this command to create the service:

\`\`\`cmd
sc create MSIRemoteAgent binPath= "C:\Program Files (x86)\MSI Remote Agent\msi-agent.exe" DisplayName= "MSI Remote Agent" start= auto
\`\`\`

### Why This Works

- **Node.js executable**: The `msi-agent.exe` is a standalone Node.js executable created by `pkg`
- **Service-compatible**: Node.js executables can run as Windows Services directly
- **No wrapper needed**: Modern Node.js apps can handle Windows Service signals
- **Standard process**: Windows treats it like any other service executable

### Comparison with NSSM

| Feature | NSSM | Native Service |
|---------|------|----------------|
| Third-party dependency | Yes | No |
| Antivirus concerns | Higher | Lower |
| Setup complexity | Medium | Simple |
| Windows integration | Wrapper | Native |
| Troubleshooting | NSSM-specific | Standard Windows |
| File size overhead | ~350 KB | 0 KB |
| Trust level | Third-party | Microsoft |

## Future Enhancements

Potential improvements for the native service implementation:

1. **Service account configuration** - Allow running as specific user
2. **Environment variables** - Pass configuration via service parameters
3. **Multiple instances** - Support running multiple agents on one machine
4. **Service dependencies** - Ensure network is available before starting
5. **Interactive service** - Allow desktop interaction if needed (not recommended)
