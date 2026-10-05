/**
 * Chunked & Dynamic Exporter Utility
 * Offloads heavy document generation (PDF, Excel, DOCX, CSV) to dynamic imports
 * and time-sliced chunks so the main UI thread never freezes.
 */

export interface ChunkProgressCallback {
  (progress: number): void;
}

/**
 * Yields control back to the browser's event loop to allow UI rendering & microtasks.
 */
export const yieldToMainThread = (delayMs: number = 0): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, delayMs));
};

/**
 * Escapes a single CSV cell value according to RFC 4180.
 */
export const escapeCsvCell = (val: unknown): string => {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  // If the cell contains commas, quotes, or newlines, quote and double-escape quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
};

/**
 * Exports data to a CSV file using Blob and object URLs.
 * Processes rows in time-sliced chunks to prevent freezing on large datasets.
 */
export const exportCsvBlob = async (
  filename: string,
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][],
  onProgress?: ChunkProgressCallback
): Promise<void> => {
  const CHUNK_SIZE = 250;
  const totalRows = rows.length;
  const csvChunks: string[] = [];

  // Add header
  csvChunks.push(headers.map(escapeCsvCell).join(',') + '\r\n');
  onProgress?.(totalRows > 0 ? 5 : 50);

  // Process rows in chunks
  let processed = 0;
  for (let i = 0; i < totalRows; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const chunkString = chunk
      .map(row => row.map(escapeCsvCell).join(','))
      .join('\r\n') + '\r\n';
    
    csvChunks.push(chunkString);
    processed += chunk.length;

    const percent = Math.min(95, Math.round(5 + (processed / totalRows) * 90));
    onProgress?.(percent);

    // Yield to let browser update animations & progress bar
    if (totalRows > CHUNK_SIZE) {
      await yieldToMainThread(0);
    }
  }

  // Create UTF-8 BOM + CSV Blob
  const blob = new Blob(['\uFEFF' + csvChunks.join('')], { type: 'text/csv;charset=utf-8;' });
  
  if (typeof window !== 'undefined') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Revoke object URL after a short timeout to prevent memory leak
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  onProgress?.(100);
};

/**
 * Dynamic lazy-loader for jsPDF and autoTable plugins.
 */
export const loadJsPdf = async () => {
  const [jspdfModule, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const jsPDF = jspdfModule.default || jspdfModule;
  const autoTable = autoTableModule.default || autoTableModule;
  return { jsPDF, autoTable };
};

/**
 * Dynamic lazy-loader for XLSX.
 */
export const loadXlsx = async () => {
  const xlsxModule = await import('xlsx');
  return xlsxModule.default || xlsxModule;
};

/**
 * Dynamic lazy-loader for DOCX & FileSaver.
 */
export const loadDocx = async () => {
  const [docxModule, fileSaverModule] = await Promise.all([
    import('docx'),
    import('file-saver')
  ]);
  const docx = docxModule;
  const saveAs = fileSaverModule.saveAs || (fileSaverModule as any).default?.saveAs || fileSaverModule;
  return { docx, saveAs };
};
