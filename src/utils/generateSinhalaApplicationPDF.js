import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const si = {
  title: '50% දායකත්වය යටතේ ස්වං රැකියා උපකරණ ලබා දීම',
  refId: 'යොමු අංකය',
  generated: 'සකස් කළ දිනය',
  status: 'තත්වය',
  score: 'ලකුණු',
  grantAmount: 'ප්\u200Dරදාන මුදල',
  section1: '1. පුද්ගලික තොරතුරු',
  section2: '2. ව්\u200Dයාපාර පැතිකඩ',
  section3: '3. පුහුණුව හා සුදුසුකම්',
  section4: '4. නිෂ්පාදන හා ආදායම',
  section5: '5. උපකරණ ඉල්ලීම',
  section6: '6. ලකුණු බිඳවැට්ටය',
  section7: '7. සමාලෝචන තොරතුරු',
  fullName: 'සම්පූර්ණ නම',
  nic: 'ජාතික හැඳුනුම්පත් අංකය',
  dob: 'උපන් දිනය',
  gender: 'ස්ත්\u200Dරී/පුරුෂ භාවය',
  phone: 'දුරකථන අංකය',
  whatsapp: 'WhatsApp අංකය',
  address: 'ස්ථිර ලිපිනය',
  district: 'දිස්ත්\u200Dරික්කය',
  dsDivision: 'ප්\u200Dරාදේශීය ලේකම් කොට්ඨාශය',
  gsDivision: 'ග්\u200Dරාම නිලධාරී වසම',
  maritalStatus: 'විවාහක තත්වය',
  specialConsideration: 'විශේෂ සැලකිල්ල',
  dependants: 'යැපෙන්නන් ගණන',
  occupation: 'රැකියාව',
  businessName: 'ව්\u200Dයාපාර නම',
  regNo: 'ලියාපදිංචි අංකය',
  regDate: 'ලියාපදිංචි දිනය',
  licenseNo: 'වෙළඳ බලපත්\u200Dර අංකය',
  licenseDate: 'බලපත්\u200Dර නිකුත් කළ දිනය',
  employeeCount: 'සේවක සංඛ්\u200Dයාව',
  hasBookkeeping: 'ගිණුම් පොත් පවත්වාගෙන යනවාද',
  sector: 'ව්\u200Dයාපාර අංශය',
  nvqLevel: 'NVQ මට්ටම',
  degree: 'උපාධිය',
  experienceYears: 'පළපුරුද්ද (වසර)',
  otherTraining: 'වෙනත් පුහුණුව',
  awardRegional: 'ප්\u200Dරාදේශීය සම්මාන',
  awardDistrict: 'දිස්ත්\u200Dරික් සම්මාන',
  awardNational: 'ජාතික සම්මාන',
  products: 'ප්\u200Dරධාන නිෂ්පාදන/සේවා',
  rawMaterials: 'අමුද්\u200Dරව්\u200Dය',
  capacity: 'මාසික නිෂ්පාදන ධාරිතාව',
  productionCost: 'මාසික නිෂ්පාදන පිරිවැය (LKR)',
  estimatedIncome: 'ඇස්තමේන්තුගත මාසික ආදායම (LKR)',
  assetValue: 'මුළු වත්කම් වටිනාකම (LKR)',
  hasQualityCert: 'තත්ත්ව සහතිකය',
  noItems: 'උපකරණ ලැයිස්තුගත කර නැත.',
  item: 'අයිතමය',
  brand: 'වෙළඳ නම',
  model: 'මාදිලිය',
  qty: 'ප්\u200Dරමාණය',
  unitPrice: 'ඒකක මිල',
  subtotal: 'එකතුව',
  totalGrant: 'ඉල්ලන මුළු ප්\u200Dරදානය',
  totalScore: 'මුළු ලකුණු',
  dsReviewedBy: 'DS විසින් සමාලෝචනය කරන ලදී',
  dsReviewedAt: 'DS සමාලෝචන දිනය',
  dsComments: 'DS අදහස්',
  directorReviewedBy: 'අධ්\u200Dයක්ෂ විසින් සමාලෝචනය කරන ලදී',
  directorReviewedAt: 'අධ්\u200Dයක්ෂ සමාලෝචන දිනය',
  directorComments: 'අධ්\u200Dයක්ෂ අදහස්',
  section8: '8. අත්සන්',
  devOfficer: 'සංවර්ධන නිලධාරී',
  divisionalSecretary: 'ප්\u200Dරාදේශීය ලේකම්',
  directorSign: 'අධ්\u200Dයක්ෂ',
  signature: 'අත්සන',
  date: 'දිනය',
  submittedBy: 'ඉදිරිපත් කළේ',
  submittedOn: 'ඉදිරිපත් කළ දිනය',
  division: 'කොට්ඨාශය',
  na: 'N/A',
  yes: 'ඔව්',
  no: 'නැත',
  statusMap: {
    pending_ds: 'DS සමාලෝචනයට බලා සිටී',
    pending_director: 'අධ්\u200Dයක්ෂ සමාලෝචනයට බලා සිටී',
    approved: 'අනුමත කරන ලදී',
    approved_by_director: 'අධ්\u200Dයක්ෂ විසින් අනුමත කරන ලදී',
    rejected: 'ප්\u200Dරතික්ෂේප කරන ලදී',
    ordered: 'ඇණවුම් කරන ලදී',
    completed: 'සම්පූර්ණයි'
  }
};

function esc(t) {
  if (t === undefined || t === null) return si.na;
  const d = document.createElement('div');
  d.textContent = String(t);
  return d.innerHTML;
}

function lkr(n) {
  if (n === undefined || n === null) return si.na;
  return 'LKR ' + Number(n).toLocaleString();
}

function yn(v) { return v ? si.yes : si.no; }

function dts(ts) {
  if (!ts || !ts.seconds) return si.na;
  return new Date(ts.seconds * 1000).toLocaleDateString('en-GB');
}

function row(l, v) {
  return `<tr><td style="width:40%;padding:4px 10px;font-weight:bold;color:#444;font-size:11px;border-bottom:1px solid #eee;vertical-align:top;">${esc(l)}</td><td style="width:60%;padding:4px 10px;font-size:11px;border-bottom:1px solid #eee;">${esc(v)}</td></tr>`;
}

function sec(title) {
  return `<tr><td colspan="2" style="background:#1f4e79;color:#fff;padding:7px 10px;font-weight:bold;font-size:12px;">${esc(title)}</td></tr>`;
}

export async function generateSinhalaApplicationPDF(app) {
  const p = app.personal || {};
  const b = app.business || {};
  const t = app.training || {};
  const pr = app.production || {};
  const eq = app.equipment || {};

  let r = '';

  r += `<tr><td colspan="2" style="background:#1f4e79;color:#fff;padding:14px 10px;text-align:center;"><h2 style="margin:0 0 4px;font-size:16px;">${esc(si.title)}</h2><p style="margin:0;font-size:10px;opacity:0.85;">${esc(si.refId)}: ${(app.id || '').substring(0, 8).toUpperCase()} | ${esc(si.generated)}: ${new Date().toLocaleDateString('en-GB')}</p></td></tr>`;

  const statusLabel = si.statusMap[app.status] || app.status || si.na;
  const parts = [`<strong>${esc(si.status)}:</strong> ${esc(statusLabel)}`];
  if (app.score !== undefined) parts.push(`<strong>${esc(si.score)}:</strong> ${app.score}/100`);
  if (eq.totalGrant !== undefined) parts.push(`<strong>${esc(si.grantAmount)}:</strong> ${lkr(eq.totalGrant)}`);
  r += `<tr><td colspan="2" style="padding:8px 10px;background:#f5f6f8;font-size:11px;">${parts.join(' | ')}</td></tr>`;

  r += sec(si.section1);
  r += row(si.fullName, p.fullName);
  r += row(si.nic, p.nic);
  r += row(si.dob, p.dob);
  r += row(si.gender, p.gender);
  r += row(si.phone, p.phone);
  r += row(si.whatsapp, p.whatsapp);
  r += row(si.address, p.address);
  r += row(si.district, p.district);
  r += row(si.dsDivision, p.dsDivision);
  r += row(si.gsDivision, p.gsDivision);
  r += row(si.maritalStatus, p.maritalStatus);
  r += row(si.specialConsideration, p.specialConsideration);
  r += row(si.dependants, p.dependants);
  r += row(si.occupation, p.occupation);
  r += row('රාජ්‍ය සේවය', p.govService === 'yes' ? `ඔව් (${p.govInstitution || ''} - ${p.govPosition || ''})` : 'නැත');

  r += sec(si.section2);
  r += row(si.businessName, b.businessName);
  r += row(si.regNo, b.regNo);
  r += row(si.regDate, b.regDate);
  r += row(si.licenseNo, b.licenseNo);
  r += row(si.licenseDate, b.licenseDate);
  r += row(si.employeeCount, b.employeeCount);
  r += row(si.hasBookkeeping, b.hasBookkeeping === 'yes' ? si.yes : si.no);
  r += row('සාමාන්‍ය මාසික ආදායම (LKR)', b.avgMonthlyIncome ? lkr(b.avgMonthlyIncome) : si.na);
  r += row(si.sector, b.sector);

  r += sec(si.section3);
  r += row(si.nvqLevel, t.nvqLevel);
  r += row(si.degree, t.degree);
  r += row(si.experienceYears, t.experienceYears);
  r += row(si.otherTraining, t.otherTraining);
  r += row(si.awardRegional, yn(t.awardRegional));
  r += row(si.awardDistrict, yn(t.awardDistrict));
  r += row(si.awardNational, yn(t.awardNational));

  r += sec(si.section4);
  r += row(si.products, pr.products);
  r += row(si.rawMaterials, pr.rawMaterials);
  r += row(si.capacity, pr.capacity);
  r += row(si.productionCost, lkr(pr.productionCost));
  r += row(si.estimatedIncome, lkr(pr.estimatedIncome));
  r += row(si.assetValue, lkr(pr.assetValue));
  r += row(si.hasQualityCert, pr.hasQualityCert === 'yes' ? si.yes : si.no);
  r += row('ගුණාත්මකභාවය වැඩිදියුණු කිරීමේ පියවර', pr.qualitySteps);

  r += sec(si.section5);
  const items = eq.items || [];
  if (items.length === 0) {
    r += `<tr><td colspan="2" style="padding:10px;color:#999;font-style:italic;font-size:11px;">${esc(si.noItems)}</td></tr>`;
  } else {
    let eh = '<table style="width:100%;border-collapse:collapse;font-size:10px;">';
    eh += '<thead><tr style="background:#e8ecef;">';
    eh += '<th style="padding:4px 6px;text-align:left;">#</th>';
    eh += `<th style="padding:4px 6px;text-align:left;">${esc(si.item)}</th>`;
    eh += `<th style="padding:4px 6px;text-align:left;">${esc(si.brand)}</th>`;
    eh += `<th style="padding:4px 6px;text-align:left;">${esc(si.model)}</th>`;
    eh += `<th style="padding:4px 6px;text-align:right;">${esc(si.qty)}</th>`;
    eh += `<th style="padding:4px 6px;text-align:right;">${esc(si.unitPrice)}</th>`;
    eh += `<th style="padding:4px 6px;text-align:right;">${esc(si.subtotal)}</th>`;
    eh += '</tr></thead><tbody>';
    items.forEach((item, i) => {
      eh += '<tr style="border-bottom:1px solid #ddd;">';
      eh += `<td style="padding:3px 6px;">${i + 1}</td>`;
      eh += `<td style="padding:3px 6px;">${esc(item.name)}</td>`;
      eh += `<td style="padding:3px 6px;">${esc(item.brand)}</td>`;
      eh += `<td style="padding:3px 6px;">${esc(item.model)}</td>`;
      eh += `<td style="padding:3px 6px;text-align:right;">${item.qty || 0}</td>`;
      eh += `<td style="padding:3px 6px;text-align:right;">${lkr(item.unitPrice)}</td>`;
      eh += `<td style="padding:3px 6px;text-align:right;">${lkr((item.qty || 0) * (item.unitPrice || 0))}</td>`;
      eh += '</tr>';
    });
    eh += '</tbody></table>';
    r += `<tr><td colspan="2" style="padding:0;">${eh}</td></tr>`;
    if (eq.totalGrant !== undefined) {
      r += `<tr><td colspan="2" style="padding:6px 10px;font-weight:bold;color:#1f4e79;font-size:12px;">${esc(si.totalGrant)}: ${lkr(eq.totalGrant)}</td></tr>`;
    }
  }

  if (app.scoreBreakdown) {
    r += sec(si.section6);
    const sb = app.scoreBreakdown;
    [['Business Stability & Growth', sb.businessStability, 25],
     ['Professional Competency', sb.professionalCompetency, 25],
     ['Household Status & Social', sb.householdStatus, 15],
     ['Economic Contribution & Innovation', sb.economicContribution, 25],
     ['Special Awards & Recognition', sb.specialAwards, 10]].forEach(([n, v, m]) => {
      r += row(n, `${v || 0} / ${m}`);
    });
    r += row(si.totalScore, `${app.score || 0} / 100`);
  }

  if (app.dsReview || app.directorReview) {
    r += sec(si.section7);
    if (app.dsReview) {
      r += row(si.dsReviewedBy, app.dsReview.reviewedBy);
      r += row(si.dsReviewedAt, dts(app.dsReview.reviewedAt));
      r += row(si.dsComments, app.dsReview.comments);
    }
    if (app.directorReview) {
      r += row(si.directorReviewedBy, app.directorReview.reviewedBy);
      r += row(si.directorReviewedAt, dts(app.directorReview.reviewedAt));
      r += row(si.directorComments, app.directorReview.comments);
    }
  }

  r += sec(si.section8);
  r += `<tr><td colspan="2" style="padding:10px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:33%;text-align:center;padding:0 8px;">
          <div style="font-weight:bold;font-size:11px;margin-bottom:30px;">${esc(si.devOfficer)}</div>
          <div style="border-top:1px solid #333;width:80%;margin:0 auto 2px;"></div>
          <div style="font-size:9px;color:#888;">${esc(si.signature)}</div>
          <div style="border-top:1px solid #333;width:80%;margin:8px auto 2px;"></div>
          <div style="font-size:9px;color:#888;">${esc(si.date)}</div>
        </td>
        <td style="width:33%;text-align:center;padding:0 8px;">
          <div style="font-weight:bold;font-size:11px;margin-bottom:30px;">${esc(si.divisionalSecretary)}</div>
          <div style="border-top:1px solid #333;width:80%;margin:0 auto 2px;"></div>
          <div style="font-size:9px;color:#888;">${esc(si.signature)}</div>
          <div style="border-top:1px solid #333;width:80%;margin:8px auto 2px;"></div>
          <div style="font-size:9px;color:#888;">${esc(si.date)}</div>
        </td>
        <td style="width:33%;text-align:center;padding:0 8px;">
          <div style="font-weight:bold;font-size:11px;margin-bottom:30px;">${esc(si.directorSign)}</div>
          <div style="border-top:1px solid #333;width:80%;margin:0 auto 2px;"></div>
          <div style="font-size:9px;color:#888;">${esc(si.signature)}</div>
          <div style="border-top:1px solid #333;width:80%;margin:8px auto 2px;"></div>
          <div style="font-size:9px;color:#888;">${esc(si.date)}</div>
        </td>
      </tr>
    </table>
  </td></tr>`;

  const footer = `${esc(si.submittedBy)}: ${app.officer?.email || si.na} | ${esc(si.submittedOn)}: ${dts(app.createdAt)} | ${esc(si.division)}: ${app.division || si.na}`;
  r += `<tr><td colspan="2" style="padding:8px 10px;color:#888;font-size:9px;border-top:1px solid #ddd;">${footer}</td></tr>`;

  const C = document.createElement('div');
  C.innerHTML = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Sinhala:wght@400;700&display=swap');
      .spdf { font-family: 'Noto Sans Sinhala', 'Iskoola Pota', 'Nirmala UI', sans-serif; width: 700px; margin: 0 auto; color: #333; background: #fff; }
      .spdf table { width: 100%; border-collapse: collapse; border: 1px solid #ccc; }
    </style>
    <div class="spdf"><table>${r}</table></div>
  `;
  C.style.cssText = 'position:fixed;top:0;left:0;width:700px;z-index:9999;background:#fff;';
  document.body.appendChild(C);

  await document.fonts.ready;

  try {
    const canvas = await html2canvas(C, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 700,
      logging: false,
      allowTaint: true
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const doc = new jsPDF('p', 'mm', 'a4');
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    const imgW = pw - 20;
    const imgH = (canvas.height / canvas.width) * imgW;

    if (imgH <= ph - 20) {
      doc.addImage(imgData, 'JPEG', 10, 10, imgW, imgH);
    } else {
      const pageH = ph - 20;
      const ratio = canvas.width / (pw - 20);
      let remaining = canvas.height;
      let offset = 0;
      let page = 0;
      while (remaining > 0) {
        if (page > 0) doc.addPage();
        const h = Math.min(remaining, pageH * ratio);
        const ch = document.createElement('canvas');
        ch.width = canvas.width;
        ch.height = h;
        const ctx = ch.getContext('2d');
        ctx.drawImage(canvas, 0, offset, canvas.width, h, 0, 0, canvas.width, h);
        const pageImg = ch.toDataURL('image/jpeg', 0.92);
        doc.addImage(pageImg, 'JPEG', 10, 10, imgW, h / ratio);
        offset += h;
        remaining -= h;
        page++;
      }
    }

    const name = (p.fullName || 'Applicant').replace(/\s+/g, '_');
    const id = app.id ? app.id.substring(0, 8) : '00000000';
    doc.save(`SME_Loan_${name}_${id}_si.pdf`);
  } catch (e) {
    console.error('Sinhala PDF error:', e);
    alert('Sinhala PDF generation failed. Please try English PDF instead.');
  } finally {
    document.body.removeChild(C);
  }
}
