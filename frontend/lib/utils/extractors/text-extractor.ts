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

  // Handle plain text and simple document formats
  const textExtensions = [
    '.txt', '.json', '.csv', '.md',
    '.xml', '.yaml', '.yml', '.log', '.rtf',
  ]
  const isTextMime = fileType.startsWith('text/')
  const isTextExtension = textExtensions.some((ext) => fileName.endsWith(ext))

  if (isTextMime || isTextExtension) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        let text = reader.result as string
        // Strip HTML/XML tags for cleaner tag extraction
        if (fileName.endsWith('.html') || fileName.endsWith('.htm') || fileName.endsWith('.xml')) {
          text = text.replace(/<[^>]+>/g, ' ')
        }
        resolve(text)
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  }

  return null;
}
