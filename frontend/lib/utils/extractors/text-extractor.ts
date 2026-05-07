import { extractTextFromPDF } from './pdf-extractor';

/**
 * Extracts text from various file types.
 * Currently supports: .txt, .json, .csv, .md, .pdf
 */
export async function extractTextFromFile(file: File): Promise<string | null> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  // Handle PDF
  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    try {
      return await extractTextFromPDF(file);
    } catch (error) {
      console.error('Failed to extract text from PDF:', error);
      return null;
    }
  }

  // Handle plain text files
  if (
    fileType.startsWith('text/') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.json') ||
    fileName.endsWith('.csv') ||
    fileName.endsWith('.md')
  ) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  // PDF and other complex formats would require libraries like pdfjs-dist
  // For now, we return null for unsupported types so backend skipping works as intended
  return null;
}
