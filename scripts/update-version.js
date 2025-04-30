const fs = require('fs');
const path = require('path');

const versionFile = path.join(__dirname, '../public/version.json');
const packageJson = require('../package.json');

// Get current date in YYYYMMDD format
const now = new Date();
const date = now.toISOString().split('T')[0].replace(/-/g, '');

// Read current version.json
let versionData = {
  version: packageJson.version,
  build: `${date}.1`
};

try {
  const currentVersion = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
  if (currentVersion.build.startsWith(date)) {
    // If build is from today, increment the build number
    const buildNumber = parseInt(currentVersion.build.split('.')[1]) + 1;
    versionData.build = `${date}.${buildNumber}`;
  }
} catch (error) {
  // If file doesn't exist or is invalid, use default values
  console.log('Creating new version.json file');
}

// Write updated version.json
fs.writeFileSync(versionFile, JSON.stringify(versionData, null, 2));
console.log(`Updated version.json: ${JSON.stringify(versionData)}`); 