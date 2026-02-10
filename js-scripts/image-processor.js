const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { decodeHtmlEntities } = require('./utils');

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


const MAX_SNIPPET_CHARS = 80;
const MAX_TOTAL_CHARS = 2000;
const MIN_SNIPPET_CHARS = 3;
const MIN_ALPHA_RATIO = 0.15;

const OCR_LINE_CLASSES = "ocr_line|ocr_textfloat|ocr_caption";

function isUsefulSnippet(text) {
  if (!text || text.length < MIN_SNIPPET_CHARS) return false;
  const alpha = (text.match(/[a-zA-Z0-9]/g) || []).length;
  if (alpha / text.length < MIN_ALPHA_RATIO) return false;
  return true;
}

function parseHocrForSizedText(hocrContent) {
  const lines = [];
  const lineRegex = new RegExp(`<span class='(?:${OCR_LINE_CLASSES})'[^>]*title="([^"]*)"[^>]*>([\\s\\S]*?)\\n\\s*<\\/span>`, 'gi');
  const wordRegex = /<span class='ocrx_word'[^>]*>([^<]*)<\/span>/g;

  function extractLine(title, inner) {
    const xSizeMatch = title.match(/x_size\s+([\d.]+)/);
    const bboxMatch = title.match(/bbox\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
    const xSize = xSizeMatch ? parseFloat(xSizeMatch[1]) : 0;
    const height = bboxMatch ? parseInt(bboxMatch[4], 10) - parseInt(bboxMatch[2], 10) : 0;
    const size = xSize || height || 1;

    const words = [];
    let wordMatch;
    const wordRe = new RegExp(wordRegex.source, 'g');
    while ((wordMatch = wordRe.exec(inner)) !== null) {
      words.push(decodeHtmlEntities(wordMatch[1]).trim());
    }
    const text = words.join(' ').trim();
    if (text) {
      lines.push({ size, text });
    }
  }

  let m;
  while ((m = lineRegex.exec(hocrContent)) !== null) extractLine(m[1], m[2]);

  lines.sort((a, b) => b.size - a.size);

  let priority = 1;
  let totalChars = 0;
  const result = [];
  const textSnippets = [];

  for (const { text } of lines) {
    if (totalChars >= MAX_TOTAL_CHARS) break;
    if (!isUsefulSnippet(text)) continue;
    const snippet = text.length > MAX_SNIPPET_CHARS ? text.substring(0, MAX_SNIPPET_CHARS) + '…' : text;
    if (snippet.length > 0) {
      result.push(`${priority}: ${snippet}`);
      textSnippets.push(snippet);
      totalChars += snippet.length + 4;
      priority++;
    }
  }

  return { forPrompt: result.join('\n'), textSnippets };
}

function extractTextWithOCR(imagePath) {
  try {
    try {
      execSync('which tesseract', { stdio: 'ignore' });
    } catch (e) {
      return { raw: '', forPrompt: '', textSnippets: [] };
    }

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const outputBase = path.join(path.dirname(imagePath), `ocr_${uniqueId}`);
    const absImage = path.resolve(imagePath);
    const absOutput = path.resolve(outputBase);
    const hocrFile = `${absOutput}.hocr`;

    try {
      execSync(`tesseract "${absImage}" "${absOutput}" hocr 2>/dev/null`, {
        stdio: 'ignore',
        timeout: 15000
      });

      let forPrompt = '';
      let textSnippets = [];
      let raw = '';

      if (fs.existsSync(hocrFile)) {
        const hocrContent = fs.readFileSync(hocrFile, 'utf8');
        const parsed = parseHocrForSizedText(hocrContent);
        forPrompt = parsed.forPrompt;
        textSnippets = parsed.textSnippets;
        raw = textSnippets.join('\n');
        try { fs.unlinkSync(hocrFile); } catch (err) {}
      }

      if (forPrompt.length === 0) {
        const txtBase = `${absOutput}_txt`;
        const txtFile = `${txtBase}.txt`;
        try {
          execSync(`tesseract "${absImage}" "${txtBase}" 2>/dev/null`, { stdio: 'pipe', timeout: 15000 });
          if (fs.existsSync(txtFile)) {
            raw = fs.readFileSync(txtFile, 'utf8');
            const lines = raw.split('\n').map(l => decodeHtmlEntities(l).trim()).filter(Boolean).filter(isUsefulSnippet).slice(0, 50);
            textSnippets = lines.map(l => l.length > MAX_SNIPPET_CHARS ? l.substring(0, MAX_SNIPPET_CHARS) + '…' : l);
            forPrompt = textSnippets.map((t, i) => `${i + 1}: ${t}`).join('\n');
            try { fs.unlinkSync(txtFile); } catch (err) {}
          }
        } catch (e) {
          if (fs.existsSync(txtFile)) try { fs.unlinkSync(txtFile); } catch (err) {}
        }
      }

      return { raw, forPrompt, textSnippets };
    } catch (e) {
      if (fs.existsSync(hocrFile)) try { fs.unlinkSync(hocrFile); } catch (err) {}
    }

    return { raw: '', forPrompt: '', textSnippets: [] };
  } catch (e) {
    return { raw: '', forPrompt: '', textSnippets: [] };
  }
}

module.exports = {
  preprocessImage,
  getImageBase64,
  extractTextWithOCR
};
