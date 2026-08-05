import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateApplicationPDF(app) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = margin;

  const p = app.personal || {};
  const b = app.business || {};
  const t = app.training || {};
  const pr = app.production || {};
  const eq = app.equipment || {};

  const label = (text) => { doc.setFont(undefined, 'bold'); doc.setFontSize(10); return text; };
  const value = (text) => { doc.setFont(undefined, 'normal'); doc.setFontSize(10); return text; };
  const sectionTitle = (title) => {
    if (y > 260) { doc.addPage(); y = margin; }
    doc.setFillColor(31, 78, 121);
    doc.rect(margin, y, pageWidth - 2 * margin, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(title, margin + 3, y + 5.5);
    y += 14;
    doc.setTextColor(0, 0, 0);
  };
  const field = (l, v) => {
    if (v === undefined || v === null || v === '') v = 'N/A';
    if (y > 275) { doc.addPage(); y = margin; }
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(l + ':', margin, y);
    const lWidth = doc.getTextWidth(l + ':') + 2;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(String(v), margin + lWidth, y);
    y += 5.5;
  };

  doc.setFillColor(31, 78, 121);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(18);
  doc.text('SME Loan Application', margin, 16);
  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`Reference ID: ${app.id ? app.id.substring(0, 8).toUpperCase() : 'N/A'}`, margin, 24);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, margin, 29);

  y = 42;

  if (app.status) {
    const statusMap = {
      pending_ds: 'Pending DS Review',
      pending_director: 'Pending Director Review',
      approved: 'Approved',
      approved_by_director: 'Approved by Director',
      rejected: 'Rejected',
      ordered: 'Ordered',
      completed: 'Completed'
    };
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('Status:', margin, y);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(31, 78, 121);
    doc.text(statusMap[app.status] || app.status, margin + 15, y);
    y += 8;

    if (app.score !== undefined) {
      doc.setFont(undefined, 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Score:', margin, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 128, 0);
      doc.text(`${app.score} / 100 Points`, margin + 15, y);
      y += 8;
    }

    if (eq.totalGrant !== undefined) {
      doc.setFont(undefined, 'bold');
      doc.setTextColor(80, 80, 80);
      doc.text('Grant Amount:', margin, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`LKR ${Number(eq.totalGrant).toLocaleString()}`, margin + 28, y);
      y += 10;
    }
  }

  sectionTitle('1. Personal Details');
  field('Full Name', p.fullName);
  field('NIC', p.nic);
  field('Date of Birth', p.dob);
  field('Gender', p.gender);
  field('Phone', p.phone);
  field('WhatsApp', p.whatsapp);
  field('Permanent Address', p.address);
  field('District', p.district);
  field('DS Division', p.dsDivision);
  field('GS Division', p.gsDivision);
  field('Marital Status', p.maritalStatus);
  field('Special Consideration', p.specialConsideration);
  field('Dependants', p.dependants);
  field('Occupation', p.occupation);
  field('Gov. Service', p.govService === 'yes' ? `Yes (${p.govInstitution || ''} - ${p.govPosition || ''})` : 'No');

  sectionTitle('2. Business Profile');
  field('Business Name', b.businessName);
  field('Registration No', b.regNo);
  field('Registration Date', b.regDate);
  field('Trade License No', b.licenseNo);
  field('License Issue Date', b.licenseDate);
  field('Employee Count', b.employeeCount);
  field('Bookkeeping Maintained', b.hasBookkeeping);
  field('Average Monthly Income (LKR)', b.avgMonthlyIncome ? Number(b.avgMonthlyIncome).toLocaleString() : undefined);
  field('Business Sector', b.sector);

  sectionTitle('3. Training & Qualifications');
  field('NVQ Level', t.nvqLevel);
  field('Highest Degree', t.degree);
  field('Years of Experience', t.experienceYears);
  field('Other Training', t.otherTraining);
  field('Regional Award', t.awardRegional ? 'Yes' : 'No');
  field('District Award', t.awardDistrict ? 'Yes' : 'No');
  field('National Award', t.awardNational ? 'Yes' : 'No');

  sectionTitle('4. Production & Income');
  field('Main Products/Services', pr.products);
  field('Raw Materials', pr.rawMaterials);
  field('Monthly Capacity', pr.capacity);
  field('Monthly Production Cost (LKR)', pr.productionCost ? Number(pr.productionCost).toLocaleString() : undefined);
  field('Estimated Monthly Income (LKR)', pr.estimatedIncome ? Number(pr.estimatedIncome).toLocaleString() : undefined);
  field('Total Asset Value (LKR)', pr.assetValue ? Number(pr.assetValue).toLocaleString() : undefined);
  field('Quality Certification', pr.hasQualityCert);
  field('Quality Improvement Steps', pr.qualitySteps);

  sectionTitle('5. Equipment Request');
  const items = eq.items || [];
  if (items.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('No equipment items listed.', margin, y);
    y += 7;
  } else {
    const tableData = items.map((item, i) => [
      (i + 1).toString(),
      item.name || '-',
      item.brand || '-',
      item.model || '-',
      String(item.qty || 0),
      `LKR ${Number(item.unitPrice || 0).toLocaleString()}`,
      `LKR ${Number((item.qty || 0) * (item.unitPrice || 0)).toLocaleString()}`
    ]);
    autoTable(doc, {
      startY: y + 2,
      head: [['#', 'Item', 'Brand', 'Model', 'Qty', 'Unit Price', 'Subtotal']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [31, 78, 121], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: margin, right: margin }
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (eq.totalGrant !== undefined) {
    if (y > 270) { doc.addPage(); y = margin; }
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(31, 78, 121);
    doc.text(`Total Grant Requested: LKR ${Number(eq.totalGrant).toLocaleString()}`, margin, y);
    y += 10;
  }

  if (app.scoreBreakdown) {
    sectionTitle('6. Score Breakdown');
    const sb = app.scoreBreakdown;
    const sbData = [
      ['Business Stability & Growth', `${sb.businessStability || 0} / 25`],
      ['Professional Competency', `${sb.professionalCompetency || 0} / 25`],
      ['Household Status & Social', `${sb.householdStatus || 0} / 15`],
      ['Economic Contribution & Innovation', `${sb.economicContribution || 0} / 25`],
      ['Special Awards & Recognition', `${sb.specialAwards || 0} / 10`],
      ['Total Score', `${app.score || 0} / 100`]
    ];
    autoTable(doc, {
      startY: y + 2,
      head: [['Category', 'Points']],
      body: sbData,
      theme: 'grid',
      headStyles: { fillColor: [31, 78, 121], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: margin, right: margin },
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });
    y = doc.lastAutoTable.finalY + 10;
  }

  if (app.dsReview || app.directorReview) {
    sectionTitle('7. Review Information');
    if (app.dsReview) {
      field('DS Reviewed By', app.dsReview.reviewedBy);
      field('DS Reviewed At', app.dsReview.reviewedAt ? new Date(app.dsReview.reviewedAt.seconds * 1000).toLocaleString() : undefined);
      field('DS Comments', app.dsReview.comments);
    }
    if (app.directorReview) {
      field('Director Reviewed By', app.directorReview.reviewedBy);
      field('Director Reviewed At', app.directorReview.reviewedAt ? new Date(app.directorReview.reviewedAt.seconds * 1000).toLocaleString() : undefined);
      field('Director Comments', app.directorReview.comments);
    }
  }

  if (y > 250) { doc.addPage(); y = margin; }
  sectionTitle('8. Signatures');

  const colW = (pageWidth - 2 * margin) / 3;
  const signY = y + 5;

  ['Development Officer', 'Divisional Secretary', 'Director'].forEach((label, i) => {
    const x = margin + i * colW;
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(label, x, signY);

    const line1Y = signY + 18;
    const line2Y = signY + 30;

    doc.line(x, line1Y, x + colW - 5, line1Y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(130, 130, 130);
    doc.text('Signature', x, line1Y + 3);

    doc.line(x, line2Y, x + colW - 5, line2Y);
    doc.text('Date', x, line2Y + 3);
  });

  y = signY + 38;

  if (app.officer) {
    if (y > 270) { doc.addPage(); y = margin; }
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Submitted by: ${app.officer.email || 'N/A'}`, margin, y);
    if (app.createdAt) {
      doc.text(`Submitted on: ${new Date(app.createdAt.seconds * 1000).toLocaleDateString('en-GB')}`, margin + 80, y);
    }
    if (app.division) {
      doc.text(`Division: ${app.division}`, margin + 150, y);
    }
  }

  doc.save(`SME_Loan_${(p.fullName || 'Applicant').replace(/\s+/g, '_')}_${app.id ? app.id.substring(0, 8) : '00000000'}.pdf`);
}
