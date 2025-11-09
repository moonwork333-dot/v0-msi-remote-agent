const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

const CONFIG = {
  productName: "MSI Remote Agent",
  productVersion: "1.0.1",
  manufacturer: "Your Company Name",
  upgradeCode: "{12345678-1234-1234-1234-123456789012}",
  agentExePath: path.resolve(__dirname, "../agent/dist/agent.exe"),
  configJsonPath: path.resolve(__dirname, "../agent/config.json"),
  outputDir: path.resolve(__dirname, "output"),
  wxsFile: path.resolve(__dirname, "installer.wxs"),
  wixobjFile: path.resolve(__dirname, "installer.wixobj"),
  msiFile: path.resolve(__dirname, "output", "MSIRemoteAgent-1.0.1.msi"),
}

// Ensure output directory exists
if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true })
}

// Check if agent.exe exists
if (!fs.existsSync(CONFIG.agentExePath)) {
  console.error("Error: agent.exe not found at:", CONFIG.agentExePath)
  console.error("Please build the agent first: cd agent && npm run build")
  process.exit(1)
}

if (!fs.existsSync(CONFIG.configJsonPath)) {
  console.error("Error: config.json not found at:", CONFIG.configJsonPath)
  console.error("Please create agent/config.json with dashboardUrl configuration")
  process.exit(1)
}

const wxsContent = `<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" 
           Name="${CONFIG.productName}" 
           Language="1033" 
           Version="${CONFIG.productVersion}" 
           Manufacturer="${CONFIG.manufacturer}" 
           UpgradeCode="${CONFIG.upgradeCode}">
    
    <Package InstallerVersion="200" 
             Compressed="yes" 
             InstallScope="perMachine"
             InstallPrivileges="elevated"
             Description="${CONFIG.productName} Installer" />

    <MajorUpgrade DowngradeErrorMessage="A newer version is already installed." />
    <MediaTemplate EmbedCab="yes" />

    <Feature Id="ProductFeature" Title="${CONFIG.productName}" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
      <ComponentRef Id="LogsFolder" />
    </Feature>

    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="MSI Remote Agent" />
      </Directory>
      <Directory Id="CommonAppDataFolder">
        <Directory Id="APPDATAFOLDER" Name="MSIRemoteAgent">
          <Directory Id="LOGSFOLDER" Name="logs" />
        </Directory>
      </Directory>
    </Directory>

    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <!-- Agent Executable -->
      <Component Id="AgentExecutable" Guid="*">
        <File Id="AgentExe" 
              Source="${CONFIG.agentExePath.replace(/\\/g, "\\\\")}" 
              KeyPath="yes" 
              Vital="yes" />
        
        <!-- Install Windows Service -->
        <ServiceInstall Id="ServiceInstaller"
                        Name="MSIRemoteAgent"
                        DisplayName="MSI Remote Agent Service"
                        Description="Remote monitoring and control agent for MSI systems"
                        Type="ownProcess"
                        Start="auto"
                        Account="LocalSystem"
                        ErrorControl="normal"
                        Arguments="--service" />
        
        <ServiceControl Id="ServiceControl"
                        Name="MSIRemoteAgent"
                        Start="install"
                        Stop="both"
                        Remove="uninstall"
                        Wait="yes" />
      </Component>
      
      <Component Id="ConfigJson" Guid="*">
        <File Id="ConfigFile" 
              Source="${CONFIG.configJsonPath.replace(/\\/g, "\\\\")}" 
              KeyPath="yes" 
              Vital="yes" />
      </Component>
    </ComponentGroup>

    <Component Id="LogsFolder" Directory="LOGSFOLDER" Guid="{A1B2C3D4-E5F6-4A5B-8C7D-9E8F7A6B5C4D}">
      <CreateFolder />
    </Component>

  </Product>
</Wix>`

fs.writeFileSync(CONFIG.wxsFile, wxsContent)
console.log("✓ Generated WiX source file:", CONFIG.wxsFile)

try {
  console.log("\n→ Compiling WiX source...")
  execSync(`candle.exe "${CONFIG.wxsFile}" -out "${CONFIG.wixobjFile}"`, { stdio: "inherit" })
  console.log("✓ WiX compilation successful")

  console.log("\n→ Linking MSI installer...")
  execSync(`light.exe "${CONFIG.wixobjFile}" -out "${CONFIG.msiFile}"`, { stdio: "inherit" })
  console.log("✓ MSI created successfully:", CONFIG.msiFile)

  // Sign the MSI if certificate is provided
  if (process.env.CERT_PATH && process.env.CERT_PASSWORD) {
    console.log("\n→ Signing MSI installer...")
    try {
      execSync(
        `signtool sign /f "${process.env.CERT_PATH}" /p "${process.env.CERT_PASSWORD}" /tr http://timestamp.digicert.com /td sha256 /fd sha256 "${CONFIG.msiFile}"`,
        { stdio: "inherit" },
      )
      console.log("✓ MSI signed successfully")
    } catch (signError) {
      console.warn("⚠ Warning: MSI signing failed:", signError.message)
      console.warn("MSI will be unsigned")
    }
  } else {
    console.log("\n⚠ No certificate provided - MSI will be unsigned")
  }

  // Clean up intermediate files
  if (fs.existsSync(CONFIG.wxsFile)) fs.unlinkSync(CONFIG.wxsFile)
  if (fs.existsSync(CONFIG.wixobjFile)) fs.unlinkSync(CONFIG.wixobjFile)

  console.log("\n✓ Build complete!")
  console.log(`\nInstaller: ${CONFIG.msiFile}`)
  console.log(`Size: ${(fs.statSync(CONFIG.msiFile).size / 1024 / 1024).toFixed(2)} MB`)
} catch (error) {
  console.error("\n✗ Build failed:", error.message)
  process.exit(1)
}
