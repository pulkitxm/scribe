const fs = require('fs');
const path = require('path');
const { preprocessImage, getImageBase64 } = require('./image-processor');
const { callOllama } = require('./ollama');
const { parseAndValidateJSON } = require('./validator');
const { buildTimestamp, buildSystemMetadata, buildVisualization, buildSummary } = require('./metadata');
const { log, cleanObject } = require('./utils');

const MAX_RETRIES = 2;

async function analyzeImageWithAI(imagePath, existingMetadata = null) {
  const baseName = path.basename(imagePath, path.extname(imagePath));
  const finalOutputPath = path.join(path.dirname(imagePath), `${baseName}.json`);

  log.info(`Processing ${path.basename(imagePath)}...`);

  const processedImagePath = preprocessImage(imagePath);
  const imageBase64 = getImageBase64(processedImagePath);

  if (processedImagePath !== imagePath && fs.existsSync(processedImagePath)) {
    try { fs.unlinkSync(processedImagePath); } catch (e) { }
  }

  let lastErr = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) log.warn(`Retry ${attempt}/${MAX_RETRIES}...`);
      const responseText = await callOllama(imageBase64, attempt > 0);
      const resultJSON = parseAndValidateJSON(responseText);

      // Build complete metadata
      const category = resultJSON.category || 'unknown';
      const productivityScore = resultJSON.scores?.productivity_score || 0;
      const codeLanguage = resultJSON.context?.code_context?.language || '';

      // If we have existing metadata (from batch processing), use it
      // Otherwise build fresh metadata from environment variables
      resultJSON.timestamp = existingMetadata?.timestamp || buildTimestamp();
      resultJSON.system_metadata = existingMetadata?.system_metadata || buildSystemMetadata();
      
      // Always build visualization and summary from AI results
      resultJSON.visualization = buildVisualization(category, productivityScore, codeLanguage);
      resultJSON.summary = buildSummary(category, resultJSON.short_description);

      const cleanedJSON = cleanObject(resultJSON);

      fs.writeFileSync(finalOutputPath, JSON.stringify(cleanedJSON, null, 2));
      log.success(`Saved: ${finalOutputPath}`);
      return cleanedJSON;
    } catch (err) {
      lastErr = err;
      log.warn(err.message);
    }
  }

  log.error(`Failed after ${MAX_RETRIES + 1} attempts: ${lastErr?.message || 'unknown error'}`);
  throw lastErr;
}

module.exports = {
  analyzeImageWithAI
};
