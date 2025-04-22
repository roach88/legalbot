import { promises as fs } from 'fs';
import * as path from 'path';

// This is a custom wrapper for pdf-parse to avoid the test file loading error
export async function parsePdf(buffer: Buffer): Promise<{
  text: string;
  numpages: number;
  info: any;
}> {
  try {
    // Only import pdf-parse when a buffer is actually being processed
    const pdfParse = await import('pdf-parse');
    
    return await pdfParse.default(buffer);
  } catch (error: any) {
    console.error('Error in custom PDF parser:', error);
    throw new Error(`PDF parsing failed: ${error?.message || 'Unknown error'}`);
  }
}