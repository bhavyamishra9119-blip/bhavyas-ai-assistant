const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const electronDist = path.join(rootDir, 'node_modules', 'electron', 'dist');
const releaseDir = path.join(rootDir, 'release', "Bhavya's AI Assistant-win32-x64");
const resourcesDir = path.join(releaseDir, 'resources');
const appDir = path.join(resourcesDir, 'app');

console.log('=== Building Bhavya\'s AI Assistant Standalone Desktop Application ===');

// 1. Check electron source
if (!fs.existsSync(electronDist)) {
  console.error('Error: Electron dist not found at:', electronDist);
  process.exit(1);
}

// 2. Prepare release directory
if (fs.existsSync(releaseDir)) {
  console.log('Cleaning existing release directory...');
  fs.rmSync(releaseDir, { recursive: true, force: true });
}
fs.mkdirSync(releaseDir, { recursive: true });

// 3. Copy Electron binaries
console.log('Copying native Electron runtime...');
fs.cpSync(electronDist, releaseDir, { recursive: true });

// 4. Rename executable
const originalExe = path.join(releaseDir, 'electron.exe');
const targetExe = path.join(releaseDir, "Bhavya's AI Assistant.exe");
if (fs.existsSync(originalExe)) {
  fs.renameSync(originalExe, targetExe);
  console.log('Created native executable:', targetExe);
}

// 5. Remove default_app.asar
const defaultAppAsar = path.join(resourcesDir, 'default_app.asar');
if (fs.existsSync(defaultAppAsar)) {
  fs.unlinkSync(defaultAppAsar);
}

// 6. Create app directory
fs.mkdirSync(appDir, { recursive: true });

// 7. Copy required application files
console.log('Bundling application assets and embedded server...');
fs.copyFileSync(path.join(rootDir, 'main.cjs'), path.join(appDir, 'main.cjs'));
fs.copyFileSync(path.join(rootDir, 'package.json'), path.join(appDir, 'package.json'));

if (fs.existsSync(path.join(rootDir, 'app-icon.ico'))) {
  fs.copyFileSync(path.join(rootDir, 'app-icon.ico'), path.join(appDir, 'app-icon.ico'));
}

if (fs.existsSync(path.join(rootDir, 'keys.json'))) {
  fs.copyFileSync(path.join(rootDir, 'keys.json'), path.join(appDir, 'keys.json'));
}

// Copy dist folder
const distSrc = path.join(rootDir, 'dist');
const distDest = path.join(appDir, 'dist');
if (fs.existsSync(distSrc)) {
  fs.cpSync(distSrc, distDest, { recursive: true });
  console.log('Bundled dist/ frontend assets into app package.');
} else {
  console.error('Error: dist/ does not exist. Run npm run build first.');
  process.exit(1);
}

// 8. Create Windows Desktop Shortcut
console.log('Configuring desktop shortcut...');
const desktopDir = 'C:\\Users\\bhavy\\OneDrive\\Desktop';
const shortcutPath = path.join(desktopDir, "Bhavya's AI Assistant.lnk");
const iconPath = path.join(rootDir, 'app-icon.ico');

if (fs.existsSync(shortcutPath)) {
  try { fs.unlinkSync(shortcutPath); } catch (e) {}
}

const psScript = `
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("${shortcutPath.replace(/\\/g, '\\\\')}")
$Shortcut.TargetPath = "${targetExe.replace(/\\/g, '\\\\')}"
$Shortcut.Arguments = ""
$Shortcut.WorkingDirectory = "${releaseDir.replace(/\\/g, '\\\\')}"
$Shortcut.IconLocation = "${iconPath.replace(/\\/g, '\\\\')},0"
$Shortcut.Description = "Bhavya's AI Assistant - Standalone Native Desktop Application"
$Shortcut.Save()
`;

try {
  const tempPs1 = path.join(__dirname, 'create-shortcut.ps1');
  fs.writeFileSync(tempPs1, psScript, 'utf8');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tempPs1}"`, { stdio: 'inherit' });
  if (fs.existsSync(tempPs1)) fs.unlinkSync(tempPs1);
  console.log('Successfully created Desktop shortcut at:', shortcutPath);
} catch (e) {
  console.warn('Could not create shortcut automatically:', e.message);
}

console.log('\n======================================================');
console.log(' BUILD COMPLETE!');
console.log(' Native Executable: ' + targetExe);
console.log(' Desktop Shortcut: ' + shortcutPath);
console.log('======================================================');
