import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';
import { sanitizeFileName } from './security.js';

// Set up pdfjs worker if available or disable worker for universal browser execution
if (pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * Format bytes into human readable string
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get icon and type category for document
 */
export function getDocumentMeta(filename) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  
  if (ext === 'pdf') {
    return { type: 'PDF Document', icon: '📕', color: '#ffffff', ext };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { type: 'Word Document', icon: '📘', color: '#ffffff', ext };
  }
  if (['xls', 'xlsx', 'csv', 'tsv'].includes(ext)) {
    return { type: 'Excel Spreadsheet', icon: '📊', color: '#ffffff', ext };
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return { type: 'PowerPoint Slides', icon: '📙', color: '#ffffff', ext };
  }
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return { type: 'ZIP Archive', icon: '📦', color: '#ffffff', ext };
  }
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'cpp', 'c', 'h', 'cs', 'java', 'html', 'css', 'json', 'xml', 'sql', 'sh', 'md'].includes(ext)) {
    return { type: 'VS Code Document', icon: '💻', color: '#ffffff', ext };
  }
  return { type: 'Text Document', icon: '📄', color: '#ffffff', ext };
}

/**
 * Parse text from PDF file
 */
async function parsePdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map(item => item.str).filter(Boolean);
      fullText += `--- Page ${pageNum} ---\n${pageStrings.join(' ')}\n\n`;
    }

    return fullText.trim() || `[PDF: ${file.name} - Could not extract text]`;
  } catch (err) {
    console.warn('PDF parsing error, trying fallback:', err);
    // Fallback: search for strings in raw text
    const text = await file.text();
    return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').slice(0, 50000);
  }
}

/**
 * Parse text from Word document (.docx)
 */
async function parseWord(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (result && result.value && result.value.trim()) {
      return result.value.trim();
    }
  } catch (err) {
    console.warn('Mammoth parsing failed, attempting JSZip XML fallback:', err);
  }

  // Fallback: unzip and parse word/document.xml
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const docXml = await zip.file('word/document.xml')?.async('text');
    if (docXml) {
      // Extract text content inside <w:t> tags
      const matches = docXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
      const extracted = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
      if (extracted.trim()) return extracted.trim();
    }
  } catch (err2) {
    console.warn('Word zip fallback error:', err2);
  }

  return await file.text();
}

/**
 * Parse Excel spreadsheets (.xlsx, .xls, .csv)
 */
async function parseExcel(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let fullText = '';

    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(worksheet);
      if (csv.trim()) {
        fullText += `### Sheet: ${sheetName}\n${csv}\n\n`;
      }
    });

    return fullText.trim() || `[Excel Sheet: ${file.name} is empty]`;
  } catch (err) {
    console.warn('Excel parse error:', err);
    return await file.text();
  }
}

/**
 * Parse PowerPoint presentations (.pptx)
 */
async function parsePowerPoint(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const slideFiles = Object.keys(zip.files).filter(k => k.startsWith('ppt/slides/slide') && k.endsWith('.xml'));
    
    // Sort slide numbers correctly
    slideFiles.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });

    let fullText = '';
    for (let i = 0; i < slideFiles.length; i++) {
      const xml = await zip.file(slideFiles[i])?.async('text');
      if (xml) {
        const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
        const slideText = matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ');
        if (slideText.trim()) {
          fullText += `--- Slide ${i + 1} ---\n${slideText.trim()}\n\n`;
        }
      }
    }

    if (fullText.trim()) return fullText.trim();
  } catch (err) {
    console.warn('PowerPoint parse error:', err);
  }

  return await file.text();
}

/**
 * Unpack a ZIP archive and parse all contained documents & code files
 * @param {File|Blob} file - The .zip archive file
 * @returns {Promise<Array<Object>>} Array of parsed document objects
 */
export async function unpackZipDocuments(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const results = [];

    // Filter out directories, macOS metadata, and git / node_modules caches
    const fileKeys = Object.keys(zip.files).filter(k => {
      const zf = zip.files[k];
      return !zf.dir && 
             !k.startsWith('__MACOSX/') && 
             !k.includes('/.git/') && 
             !k.startsWith('.git/') &&
             !k.includes('/node_modules/') && 
             !k.startsWith('node_modules/') &&
             !k.endsWith('.DS_Store');
    });

    for (const relPath of fileKeys) {
      const zf = zip.files[relPath];
      const filename = relPath.split('/').pop();
      const ext = (filename.split('.').pop() || '').toLowerCase();
      
      const textExtensions = [
        'js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'h', 'hpp', 'cs', 
        'html', 'htm', 'css', 'scss', 'json', 'xml', 'sql', 'sh', 'bash', 
        'md', 'txt', 'csv', 'tsv', 'yaml', 'yml', 'log', 'env', 'rs', 'go', 
        'php', 'rb', 'swift', 'kt', 'dart', 'vue', 'svelte', 'tex'
      ];

      if (textExtensions.includes(ext)) {
        try {
          const content = await zf.async('string');
          const safeContent = (content || '').replace(/\0/g, '');
          const meta = getDocumentMeta(filename);
          results.push({
            id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            name: relPath,
            size: zf._data?.uncompressedSize || safeContent.length,
            sizeFormatted: formatFileSize(zf._data?.uncompressedSize || safeContent.length),
            ext,
            type: meta.type,
            icon: meta.icon,
            color: meta.color,
            content: safeContent,
            preview: safeContent.slice(0, 300).replace(/\s+/g, ' ').trim() + (safeContent.length > 300 ? '...' : ''),
            uploadedAt: Date.now(),
            zipSource: file.name
          });
        } catch (readErr) {
          console.warn(`Could not read ${relPath} from zip:`, readErr);
        }
      } else if (ext === 'docx') {
        try {
          const docxBuffer = await zf.async('arraybuffer');
          const mammothRes = await mammoth.extractRawText({ arrayBuffer: docxBuffer });
          const text = mammothRes?.value?.trim() || '';
          if (text) {
            const meta = getDocumentMeta(filename);
            results.push({
              id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
              name: relPath,
              size: docxBuffer.byteLength,
              sizeFormatted: formatFileSize(docxBuffer.byteLength),
              ext,
              type: meta.type,
              icon: meta.icon,
              color: meta.color,
              content: text,
              preview: text.slice(0, 300).replace(/\s+/g, ' ').trim() + '...',
              uploadedAt: Date.now(),
              zipSource: file.name
            });
          }
        } catch (e) {
          console.warn(`Could not read docx ${relPath} from zip:`, e);
        }
      }
    }

    return results;
  } catch (err) {
    console.error(`Failed to unpack zip ${file.name}:`, err);
    throw err;
  }
}

/**
 * Parse an entire ZIP archive folder as ONE single document
 * Contains complete file tree, individual file contents, and base64 for instant re-download.
 */
export async function parseZipFolderDocument(file) {
  const rawName = file.name || 'archive.zip';
  const name = sanitizeFileName(rawName);

  let extractedFiles = [];
  try {
    extractedFiles = await unpackZipDocuments(file);
  } catch (e) {
    console.warn('Could not unpack zip files, using fallback:', e);
  }

  let treeSummary = `[ZIP FOLDER ARCHIVE: "${name}" (${formatFileSize(file.size)})]\n`;
  treeSummary += `Total Files Extracted: ${extractedFiles.length}\n\n`;
  treeSummary += `PROJECT DIRECTORY TREE:\n`;
  if (extractedFiles.length > 0) {
    extractedFiles.forEach(f => {
      treeSummary += `  ├── ${f.name} (${f.sizeFormatted})\n`;
    });
  } else {
    treeSummary += `  └── (No extractable text files found)\n`;
  }
  treeSummary += `\n=======================================================\n`;
  treeSummary += `FULL FILE CONTENTS:\n=======================================================\n\n`;

  const filesBody = extractedFiles.map(f => {
    return `=== File: ${f.name} (${f.sizeFormatted}) ===\n${f.content}\n`;
  }).join('\n-------------------------------------------------------\n\n');

  const fullContent = (treeSummary + filesBody).replace(/\0/g, '');

  let base64Data = null;
  if (file.size < 50 * 1024 * 1024) {
    try {
      const buffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      base64Data = btoa(binary);
    } catch (e) {
      console.warn('Could not generate base64 for ZIP download:', e);
    }
  }

  return {
    id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    name,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    ext: 'zip',
    type: 'ZIP Folder Archive',
    icon: '📦',
    color: '#ffffff',
    fileCount: extractedFiles.length,
    files: extractedFiles.map(f => ({ name: f.name, content: f.content, sizeFormatted: f.sizeFormatted })),
    content: fullContent,
    preview: `📦 ZIP Archive Folder: "${name}" containing ${extractedFiles.length} file(s). Ready for multi-file code review, search, and direct download.`,
    base64Data,
    mimeType: 'application/zip',
    isZipFolder: true,
    uploadedAt: Date.now()
  };
}

/**
 * Universal document download helper:
 * - If ZIP folder archive: downloads original base64 if present, or dynamically rebuilds the exact .zip Blob with JSZip!
 * - If other document/code file: downloads base64 or text content with correct MIME type and filename.
 */
export async function downloadDocumentFile(doc) {
  if (!doc) return false;
  try {
    const isZip = doc.isZipFolder || doc.ext === 'zip' || (doc.name && doc.name.toLowerCase().endsWith('.zip'));

    if (isZip) {
      // 1. Try base64 if available in memory
      if (doc.base64Data) {
        try {
          const byteChars = atob(doc.base64Data);
          const byteNumbers = new Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteNumbers[i] = byteChars.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/zip' });
          triggerBlobDownload(blob, doc.name || 'archive.zip');
          return true;
        } catch (b64Err) {
          console.warn('Base64 decode failed for zip, will rebuild from files:', b64Err);
        }
      }

      // 2. Rebuild real .zip file from extracted files using JSZip on ANY device!
      const zip = new JSZip();
      let hasFiles = false;

      if (Array.isArray(doc.files) && doc.files.length > 0) {
        doc.files.forEach(f => {
          if (f.name) {
            zip.file(f.name, f.content || '');
            hasFiles = true;
          }
        });
      }

      // Fallback: parse "=== File: <name> ===\n<content>" from doc.content
      if (!hasFiles && doc.content) {
        const fileRegex = /=== File:\s*([^\r\n(]+)(?:\s*\([^)]*\))?\s*===\r?\n([\s\S]*?)(?=(?:=== File:|$|\n-------------------------------------------------------))/g;
        let match;
        while ((match = fileRegex.exec(doc.content)) !== null) {
          const fileName = match[1].trim();
          const fileBody = match[2].trim();
          if (fileName) {
            zip.file(fileName, fileBody);
            hasFiles = true;
          }
        }
      }

      if (!hasFiles) {
        const fallbackName = (doc.name || 'archive').replace(/\.zip$/i, '') + '.txt';
        zip.file(fallbackName, doc.content || '');
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadName = doc.name?.toLowerCase().endsWith('.zip') ? doc.name : `${doc.name || 'archive'}.zip`;
      triggerBlobDownload(zipBlob, downloadName);
      return true;
    }

    // Standard non-zip document
    if (doc.base64Data) {
      const mime = doc.mimeType || 'application/octet-stream';
      const byteChars = atob(doc.base64Data);
      const byteNumbers = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNumbers[i] = byteChars.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mime });
      triggerBlobDownload(blob, doc.name || 'document');
      return true;
    }

    // Text content fallback
    const mime = doc.mimeType || 'text/plain';
    const blob = new Blob([doc.content || ''], { type: `${mime};charset=utf-8` });
    triggerBlobDownload(blob, doc.name || 'document.txt');
    return true;
  } catch (err) {
    console.error('downloadDocumentFile error:', err);
    return false;
  }
}

function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Universal document parser: supports PDF, Word, Excel, PowerPoint, ZIP archives, VS Code code files, and plain text
 */
export async function parseDocumentFile(file) {
  const rawName = file.name || 'document.txt';
  const name = sanitizeFileName(rawName);
  const ext = (name.split('.').pop() || '').toLowerCase();
  const meta = getDocumentMeta(name);

  let content = '';

  try {
    if (ext === 'pdf') {
      content = await parsePdf(file);
    } else if (['docx', 'doc'].includes(ext)) {
      content = await parseWord(file);
    } else if (['xlsx', 'xls', 'csv', 'tsv'].includes(ext)) {
      content = await parseExcel(file);
    } else if (['pptx', 'ppt'].includes(ext)) {
      content = await parsePowerPoint(file);
    } else if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      const extracted = await unpackZipDocuments(file);
      if (extracted && extracted.length > 0) {
        content = extracted.map(d => `=== File: ${d.name} (${d.sizeFormatted}) ===\n${d.content}\n`).join('\n');
      } else {
        content = `[ZIP Archive: ${name} (${formatFileSize(file.size)}) - No readable text files extracted]`;
      }
    } else {
      // VS Code documents, source code, text, json, markdown, etc.
      content = await file.text();
    }
  } catch (err) {
    console.error(`Failed to parse ${name}:`, err);
    try {
      content = await file.text();
    } catch {
      content = `[File: ${name} (${formatFileSize(file.size)}) - Binary document attached]`;
    }
  }

  let base64Data = null;
  let mimeType = null;
  if (['pdf', 'zip'].includes(ext) && file.size < 50 * 1024 * 1024) {
    try {
      const buffer = await file.arrayBuffer();
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const chunk = 8192;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      base64Data = btoa(binary);
      mimeType = ext === 'pdf' ? 'application/pdf' : 'application/zip';
    } catch (e) {
      console.warn(`Could not generate base64 for ${ext}:`, e);
    }
  }

  const safeContent = (content || '').replace(/\0/g, '');

  return {
    id: 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
    name,
    size: file.size,
    sizeFormatted: formatFileSize(file.size),
    ext,
    type: meta.type,
    icon: meta.icon,
    color: meta.color,
    content: safeContent,
    preview: safeContent.slice(0, 300).replace(/\s+/g, ' ').trim() + (safeContent.length > 300 ? '...' : ''),
    base64Data,
    mimeType,
    uploadedAt: Date.now()
  };
}
