import { parsePdf } from './custom-pdf-parse';

type PdfResult = {
  text: string;
  pageCount: number;
  info: Record<string, any>;
};

/**
 * Extracts text from a PDF document
 * @param buffer The PDF file buffer
 * @returns The extracted text, page count, and document info
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<PdfResult> {
  try {
    // Check if buffer is valid
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty or invalid PDF buffer');
    }
    
    const data = await parsePdf(buffer);
    
    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info || {}
    };
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error?.message || 'Unknown error'}`);
  }
}
