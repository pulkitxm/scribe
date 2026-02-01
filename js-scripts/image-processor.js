const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function preprocessImage(inputPath) {
  // Use random ID to avoid collisions in parallel processing
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const tempPath = path.join(path.dirname(inputPath), `temp_${uniqueId}.jpg`);
  try {
    execSync(`sips -Z 1280 -s format jpeg "${inputPath}" --out "${tempPath}"`, { stdio: 'ignore' });
    return tempPath;
  } catch (e) {
    return inputPath;
  }
}

function getImageBase64(filePath) {
  const fileData = fs.readFileSync(filePath);
  return fileData.toString('base64');
}

module.exports = {
  preprocessImage,
  getImageBase64
};
