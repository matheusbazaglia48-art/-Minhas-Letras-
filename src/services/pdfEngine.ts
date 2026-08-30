import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

// In-memory cache of rendered page canvas images to make slide switching instant and 60fps
const pageImageCache = new Map<string, string>();

/**
 * Creates a minimal valid multi-page PDF ArrayBuffer with song lyrics and chords
 * Used for initial demo library songs so they work immediately with zero configuration.
 */
export function generateSampleSongPdf(title: string, artist: string, category: string, tone: string, pages: { pageNum: number; content: string[] }[]): ArrayBuffer {
  // Simple PDF Generator format conforming to PDF 1.4 spec
  // Each page will be a valid PDF page object
  const objects: string[] = [];
  
  function addObject(content: string): number {
    objects.push(content);
    return objects.length;
  }

  // Obj 1: Catalog
  // Obj 2: Pages root
  const pageObjIds: number[] = [];
  const contentObjIds: number[] = [];

  // Reserve 1 and 2
  objects.push(''); // 1 Catalog placeholder
  objects.push(''); // 2 Pages placeholder

  // Font object
  const fontObjId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>`);
  const regularFontObjId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  const monoFontObjId = addObject(`<< /Type /Font /Subtype /Type1 /BaseFont /Courier-Bold >>`);

  // Create each page
  pages.forEach((p, idx) => {
    let stream = `BT\n`;
    
    // Header banner (dark background band)
    stream += `0.1 0.12 0.18 rg\n`; // Dark slate color
    stream += `10 800 575 32 re f\n`; // Header bar
    
    // Title text (white)
    stream += `1 1 1 rg\n`;
    stream += `/F1 18 Tf\n`;
    stream += `24 812 Td\n`;
    stream += `(${escapePdf(title.toUpperCase())}) Tj\n`;
    stream += `ET\n`;

    // Metadata subheader (Tone, BPM, Category)
    stream += `BT\n`;
    stream += `0.4 0.45 0.55 rg\n`;
    stream += `/F2 10 Tf\n`;
    stream += `24 785 Td\n`;
    stream += `(TOM: ${escapePdf(tone)}  |  CATEGORIA: ${escapePdf(category.toUpperCase())}  |  ARTISTA: ${escapePdf(artist)}) Tj\n`;
    stream += `ET\n`;

    // Divider line
    stream += `0.8 0.82 0.85 RG 1 w 24 775 m 570 775 l S\n`;

    // Lyrics and chords body
    let currentY = 750;
    p.content.forEach((line) => {
      if (line.startsWith('[')) {
        // Section header like [INTRO], [VERSO 1], [REFRÃO]
        stream += `BT\n`;
        stream += `0.15 0.35 0.7 rg\n`; // Blue accent
        stream += `/F1 12 Tf\n`;
        stream += `24 ${currentY} Td\n`;
        stream += `(${escapePdf(line)}) Tj\n`;
        stream += `ET\n`;
        currentY -= 20;
      } else if (line.startsWith('§')) {
        // Chords line (marked with § prefix in our generator)
        stream += `BT\n`;
        stream += `0.85 0.25 0.1 rg\n`; // Amber/Orange chords
        stream += `/F3 11 Tf\n`;
        stream += `32 ${currentY} Td\n`;
        stream += `(${escapePdf(line.substring(1))}) Tj\n`;
        stream += `ET\n`;
        currentY -= 16;
      } else if (line.trim() === '') {
        currentY -= 14;
      } else {
        // Normal Lyric line
        stream += `BT\n`;
        stream += `0.1 0.1 0.1 rg\n`; // Crisp dark text
        stream += `/F2 11 Tf\n`;
        stream += `32 ${currentY} Td\n`;
        stream += `(${escapePdf(line)}) Tj\n`;
        stream += `ET\n`;
        currentY -= 18;
      }
    });

    // Footer page number
    stream += `BT\n`;
    stream += `0.5 0.5 0.5 rg\n`;
    stream += `/F2 10 Tf\n`;
    stream += `260 25 Td\n`;
    stream += `(Pagina ${p.pageNum} de ${pages.length} - Minhas Letras V4) Tj\n`;
    stream += `ET\n`;

    // Stream object
    const streamLen = stream.length;
    const contentObjId = addObject(`<< /Length ${streamLen} >>\nstream\n${stream}\nendstream`);
    contentObjIds.push(contentObjId);

    // Page object (A4 size: 595.28 x 841.89)
    const pageObjId = addObject(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents ${contentObjId} 0 R /Resources << /Font << /F1 ${fontObjId} 0 R /F2 ${regularFontObjId} 0 R /F3 ${monoFontObjId} 0 R >> >> >>`);
    pageObjIds.push(pageObjId);
  });

  // Now fill 1 Catalog and 2 Pages
  objects[0] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[1] = `<< /Type /Pages /Kids [${pageObjIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;

  // Build PDF body with xref table
  let pdf = `%PDF-1.4\n%âãÏÓ\n`;
  const offsets: number[] = [];

  objects.forEach((obj, idx) => {
    offsets.push(pdf.length);
    pdf += `${idx + 1} 0 obj\n${obj}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  offsets.forEach((off) => {
    pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  });

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  // Convert to ArrayBuffer
  const buffer = new ArrayBuffer(pdf.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < pdf.length; i++) {
    view[i] = pdf.charCodeAt(i) & 0xff;
  }
  return buffer;
}

function escapePdf(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Loads a PDF Document from an ArrayBuffer or Uint8Array
 */
export async function loadPdfDocument(data: ArrayBuffer | Uint8Array): Promise<pdfjsLib.PDFDocumentProxy> {
  const loadingTask = pdfjsLib.getDocument({
    data,
    cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });
  return await loadingTask.promise;
}

/**
 * Gets total page count from PDF binary data
 */
export async function getPdfPageCount(data: ArrayBuffer | Uint8Array): Promise<number> {
  try {
    const doc = await loadPdfDocument(data);
    const count = doc.numPages;
    if (typeof (doc as any).destroy === 'function') {
      (doc as any).destroy();
    }
    return count;
  } catch (err) {
    console.warn('Error reading PDF page count:', err);
    return 1;
  }
}

/**
 * Generates a high-quality thumbnail image URL (data URL) for page 1
 */
export async function renderPdfThumbnail(data: ArrayBuffer | Uint8Array, cacheKey?: string): Promise<string> {
  if (cacheKey && pageImageCache.has(cacheKey)) {
    return pageImageCache.get(cacheKey)!;
  }

  try {
    const doc = await loadPdfDocument(data);
    const page = await doc.getPage(1);
    
    // Scale for thumbnail width around 240px
    const viewport = page.getViewport({ scale: 0.45 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    
    if (!ctx) {
      if (typeof (doc as any).destroy === 'function') (doc as any).destroy();
      return '';
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render as any)({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    if (typeof (doc as any).destroy === 'function') {
      (doc as any).destroy();
    }

    if (cacheKey) {
      pageImageCache.set(cacheKey, dataUrl);
    }
    return dataUrl;
  } catch (err) {
    console.error('Failed to render PDF thumbnail:', err);
    return '';
  }
}

/**
 * Renders a specific page to an HTML Canvas
 */
export async function renderPdfPageToCanvas(
  pdfDoc: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.5,
  invertColors = false
): Promise<{ width: number; height: number }> {
  try {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return { width: 0, height: 0 };

    canvas.width = viewport.width;
    canvas.height = viewport.height;

    // Background
    ctx.fillStyle = invertColors ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await (page.render as any)({
      canvasContext: ctx,
      viewport: viewport,
      canvas: canvas,
    }).promise;

    if (invertColors) {
      // Invert stage mode for night venues (light text on dark background)
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];         // R
        data[i + 1] = 255 - data[i + 1]; // G
        data[i + 2] = 255 - data[i + 2]; // B
      }
      ctx.putImageData(imgData, 0, 0);
    }

    return { width: viewport.width, height: viewport.height };
  } catch (err) {
    console.error(`Error rendering page ${pageNumber}:`, err);
    return { width: 0, height: 0 };
  }
}
