const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

function preprocessImage(inputPath) {
  
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const tempPath = path.join(path.dirname(inputPath), `temp_${uniqueId}.jpg`);
  try {
    
    
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


function extractTextWithOCR(imagePath) {
  try {
    
    try {
      execSync('which tesseract', { stdio: 'ignore' });
    } catch (e) {
      
      return '';
    }

    
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const outputBase = path.join(path.dirname(imagePath), `ocr_${uniqueId}`);
    const outputFile = `${outputBase}.txt`;

    try {
      
      execSync(`tesseract "${imagePath}" "${outputBase}" --psm 6 -l eng 2>/dev/null`, { 
        stdio: 'ignore',
        timeout: 10000 
      });

      if (fs.existsSync(outputFile)) {
        const text = fs.readFileSync(outputFile, 'utf8');
        fs.unlinkSync(outputFile);
        
        
        const cleaned = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0)
          .join('\n');
        
        return cleaned;
      }
    } catch (e) {
      
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
