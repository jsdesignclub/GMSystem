import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import notoRegularUrl from '../assets/fonts/NotoSansSinhala-Regular.ttf';
import notoBoldUrl from '../assets/fonts/NotoSansSinhala-Bold.ttf';

const esc = (t) => {
  if (t === undefined || t === null) return '';
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
};

export function exportCSV({ filename, headers, rows }) {
  const escape = (v) => {
    const s = v === undefined || v === null ? '' : String(v);
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const content = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportTablePDF({ title, subtitle, columns, rows, foot, filename, orientation = 'landscape', format = 'a3' }) {
  const head = columns.map((c) => `<th>${esc(c)}</th>`).join('');
  const body = rows
    .map(
      (r, i) =>
        `<tr>${r.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`
    )
    .join('');
  const footHtml = foot
    ? `<tfoot><tr>${foot.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr></tfoot>`
    : '';
  const footer = `Generated: ${new Date().toLocaleString()} | Records: ${rows.length}`;

  const C = document.createElement('div');
  C.innerHTML = `
    <style>
      @font-face { font-family: 'NotoSinhala'; src: url('${notoRegularUrl}') format('truetype'); font-weight: 400; }
      @font-face { font-family: 'NotoSinhala'; src: url('${notoBoldUrl}') format('truetype'); font-weight: 700; }
      .expdf { font-family: 'NotoSinhala', 'Iskoola Pota', 'Nirmala UI', sans-serif; width: 1600px; margin: 0 auto; color: #1a202c; background: #fff; padding: 24px; box-sizing: border-box; }
      .expdf h1 { margin: 0 0 4px; font-size: 26px; font-weight: 700; color: #1f4e79; }
      .expdf .sub { margin: 0 0 16px; font-size: 13px; color: #4a5568; }
      .expdf table { width: 100%; border-collapse: collapse; font-size: 11px; }
      .expdf th { background: #1f4e79; color: #fff; font-weight: 700; padding: 7px 8px; text-align: left; border: 1px solid #cbd5e1; }
      .expdf td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; }
      .expdf tr:nth-child(even) td { background: #f7fafc; }
      .expdf tfoot td { background: #e2e8f0; font-weight: 700; }
      .expdf .footer { margin-top: 12px; font-size: 11px; color: #718096; }
    </style>
    <div class="expdf">
      <h1>${esc(title)}</h1>
      <p class="sub">${esc(subtitle)}</p>
      <table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${footHtml}</table>
      <p class="footer">${esc(footer)}</p>
    </div>
  `;
  C.style.cssText = 'position:fixed;top:0;left:-10000px;width:1600px;z-index:9999;background:#fff;';
  document.body.appendChild(C);

  await document.fonts.ready;

  try {
    const canvas = await html2canvas(C, {
      scale: 1,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 1600,
      windowWidth: 1600,
      logging: false,
      allowTaint: true
    });

    const doc = new jsPDF(orientation, 'mm', format);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const imgW = pw - 24;
    const imgH = (canvas.height / canvas.width) * imgW;

    if (imgH <= ph - 24) {
      doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 12, 12, imgW, imgH);
    } else {
      const pageH = ph - 24;
      const ratio = canvas.width / imgW;
      let remaining = canvas.height;
      let offset = 0;
      let page = 0;
      while (remaining > 0) {
        if (page > 0) doc.addPage();
        const h = Math.min(remaining, pageH * ratio);
        const ch = document.createElement('canvas');
        ch.width = canvas.width;
        ch.height = Math.ceil(h);
        const ctx = ch.getContext('2d');
        ctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, ch.height);
        doc.addImage(ch.toDataURL('image/jpeg', 0.92), 'JPEG', 12, 12, imgW, h / ratio);
        offset += h;
        remaining -= h;
        page++;
      }
    }

    doc.save(filename);
  } catch (e) {
    console.error('Table PDF export error:', e);
    throw e;
  } finally {
    document.body.removeChild(C);
  }
}
