const pdfParse = require('pdf-parse');
const fs       = require('fs');
const path     = require('path');

async function extractTextFromPDF(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const data   = await pdfParse(buffer);
    return (data.text || '').replace(/\s+/g, ' ').trim();
  } catch (err) {
    throw new Error('Failed to parse PDF: ' + err.message);
  }
}

function deleteFile(filename) {
  if (!filename) return;
  const fp = path.join(__dirname, '..', 'uploads', filename);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

module.exports = { extractTextFromPDF, deleteFile };