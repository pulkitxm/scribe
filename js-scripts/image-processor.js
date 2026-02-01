const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function preprocessImage(inputPath) {
  // Use random ID to avoid collisions in parallel processing
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const tempPath = path.join(path.dirname(inputPath), `temp_${uniqueId}.jpg`);
  try {
    // Increase resolution to 1920px for better text readability
    // Keep quality high and use JPEG format for compatibility
    execSync(`sips -Z 1920 -s format jpeg "${inputPath}" --out "${tempPath}"`, { stdio: 'ignore' });
    return tempPath;
  } catch (e) {
    return inputPath;
  }
}

function getImageBase64(filePath) {
  const fileData = fs.readFileSync(filePath);
  return fileData.toString('base64');
}

/**
 * Extract text from image using Tesseract OCR
 * Returns a string with all extracted text
 */
function extractTextWithOCR(imagePath) {
  try {
    // Check if tesseract is available
    try {
      execSync('which tesseract', { stdio: 'ignore' });
    } catch (e) {
      // Tesseract not installed, return empty string
      return '';
    }

    // Run tesseract OCR
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const outputBase = path.join(path.dirname(imagePath), `ocr_${uniqueId}`);
    const outputFile = `${outputBase}.txt`;

    try {
      // Run tesseract with optimized settings for screen text
      execSync(`tesseract "${imagePath}" "${outputBase}" --psm 6 -l eng 2>/dev/null`, { 
        stdio: 'ignore',
        timeout: 10000 // 10 second timeout
      });

      if (fs.existsSync(outputFile)) {
        const text = fs.readFileSync(outputFile, 'utf8');
        fs.unlinkSync(outputFile);
        
        // Clean up the text: remove excessive whitespace, empty lines
        const cleaned = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        return cleaned;
      }
    } catch (e) {
      // Clean up on error
      if (fs.existsSync(outputFile)) {
        try { fs.unlinkSync(outputFile); } catch (err) {}
      }
    }

    return '';
  } catch (e) {
    return '';
  }
}

module.exports = {
  preprocessImage,
  getImageBase64,
  extractTextWithOCR
};
