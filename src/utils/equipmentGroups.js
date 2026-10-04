import { exportCSV, exportTablePDF } from './exportUtils';

export const EQUIPMENT_GROUPS_COLLECTION = 'equipment_groups';

const toSet = (items) => new Set(items || []);

export function buildEquipmentOptions(apps) {
  const counts = new Map();
  (apps || []).forEach(app => {
    (app.equipment?.items || []).forEach(item => {
      if (!item?.name) return;
      counts.set(item.name, (counts.get(item.name) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function matchGroupItems(app, itemsOrSet) {
  const set = itemsOrSet instanceof Set ? itemsOrSet : toSet(itemsOrSet);
  return (app.equipment?.items || []).filter(item => set.has(item.name));
}

export function filterAppsByEquipmentGroup(apps, items, search = '') {
  if (!items || items.length === 0) return [];
  const set = toSet(items);
  const q = (search || '').trim().toLowerCase();
  return (apps || [])
    .filter(app => matchGroupItems(app, set).length > 0)
    .filter(app => !q
      || (app.personal?.fullName || '').toLowerCase().includes(q)
      || (app.business?.businessName || '').toLowerCase().includes(q)
      || (app.personal?.gsDivision || '').toLowerCase().includes(q)
      || (app.id || '').toLowerCase().includes(q))
    .sort((a, b) => (a.personal?.fullName || '').localeCompare(b.personal?.fullName || ''));
}

export function computeGroupTotals(apps, items) {
  const set = toSet(items);
  return (apps || []).reduce((acc, app) => {
    const its = matchGroupItems(app, set);
    acc.itemCount += its.length;
    acc.units += its.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    acc.itemCost += its.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0);
    acc.totalCost += (app.equipment?.totalGrant || 0) * 2;
    acc.totalGrant += app.equipment?.totalGrant || 0;
    return acc;
  }, { itemCount: 0, units: 0, itemCost: 0, totalCost: 0, totalGrant: 0 });
}

const safeGroupFileName = (groupName) =>
  (groupName || 'Ad-hoc selection').replace(/[^\w\s-]/g, '').trim() || 'equipment-group';

// One definition of the report shape, shared by the PDF and CSV exports so the two
// can never drift apart. Values are left numeric so a spreadsheet can total them;
// each exporter formats for its own medium.
export function buildEquipmentGroupTable({ apps, items }) {
  const set = toSet(items);

  const columns = [
    '#', 'Ref ID', 'Name', 'Business', 'Division', 'GS Div', 'Equipment',
    'Brand', 'Model', 'Qty', 'Score', 'Total Cost', 'Grant', 'Dispatch'
  ];

  const rows = (apps || []).map((app, i) => {
    const its = matchGroupItems(app, set);
    return [
      i + 1,
      (app.id || '').substring(0, 8).toUpperCase(),
      app.personal?.fullName || 'N/A',
      app.business?.businessName || 'N/A',
      app.division || '-',
      app.personal?.gsDivision || '-',
      its.map(it => it.name).join(', ') || '-',
      its.map(it => it.brand).filter(Boolean).join(', ') || '-',
      its.map(it => it.model).filter(Boolean).join(', ') || '-',
      its.reduce((s, it) => s + (Number(it.qty) || 0), 0),
      Number(app.score) || 0,
      (app.equipment?.totalGrant || 0) * 2,
      app.equipment?.totalGrant || 0,
      app.adminDispatch ? 'Sent to Accounts' : 'Awaiting Dispatch'
    ];
  });

  const sums = (apps || []).reduce((acc, app) => {
    const its = matchGroupItems(app, set);
    acc.units += its.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    acc.totalCost += (app.equipment?.totalGrant || 0) * 2;
    acc.totalGrant += app.equipment?.totalGrant || 0;
    return acc;
  }, { units: 0, totalCost: 0, totalGrant: 0 });

  return { columns, rows, sums };
}

// Column indexes that carry money, used by both exporters to format totals.
const COST_COL = 11;
const GRANT_COL = 12;
const UNITS_COL = 9;

export async function exportEquipmentGroupPDF({
  apps,
  items,
  groupName,
  onlySelected = false,
  totalAvailable = null
}) {
  const exportSet = apps || [];
  if (exportSet.length === 0) {
    alert('No applications match the selected equipment group.');
    return false;
  }

  const { columns, rows, sums } = buildEquipmentGroupTable({ apps: exportSet, items });

  const pdfRows = rows.map(row => row.map((cell, i) => (
    i === COST_COL || i === GRANT_COL ? Number(cell).toLocaleString() : String(cell)
  )));

  const foot = Array(columns.length).fill('');
  foot[0] = 'TOTAL';
  foot[UNITS_COL] = String(sums.units);
  foot[COST_COL] = `LKR ${sums.totalCost.toLocaleString()}`;
  foot[GRANT_COL] = `LKR ${sums.totalGrant.toLocaleString()}`;

  const scope = onlySelected && totalAvailable !== null
    ? `Selected rows only (${exportSet.length} of ${totalAvailable})`
    : `${exportSet.length} application(s)`;

  const safeName = safeGroupFileName(groupName);

  try {
    await exportTablePDF({
      title: `SME Grant System - Equipment Group: ${groupName || 'Ad-hoc'}`,
      subtitle: [
        `Equipment: ${(items || []).join(' + ') || 'All'}`,
        scope,
        `Department of Industries Development Uva Province | Report Date: ${new Date().toLocaleString()}`
      ].join('  |  '),
      columns,
      rows: pdfRows,
      foot,
      filename: `${safeName}_${new Date().toISOString().split('T')[0]}.pdf`,
      orientation: 'landscape',
      format: 'a3'
    });
    return true;
  } catch (err) {
    console.error('PDF Export Error:', err);
    alert('Error generating PDF.');
    return false;
  }
}

// Spreadsheet twin of the PDF above: same columns, same rows, same totals, but
// numbers stay numeric so Excel/LibreOffice can sort, filter and re-total them.
export function exportEquipmentGroupCSV({
  apps,
  items,
  groupName,
  onlySelected = false,
  totalAvailable = null
}) {
  const exportSet = apps || [];
  if (exportSet.length === 0) {
    alert('No applications match the selected equipment group.');
    return false;
  }

  const { columns, rows, sums } = buildEquipmentGroupTable({ apps: exportSet, items });

  const totals = Array(columns.length).fill('');
  totals[0] = 'TOTAL';
  totals[UNITS_COL] = sums.units;
  totals[COST_COL] = sums.totalCost;
  totals[GRANT_COL] = sums.totalGrant;

  const scopeTag = onlySelected && totalAvailable !== null
    ? `_selected-${exportSet.length}of${totalAvailable}`
    : '';

  exportCSV({
    filename: `${safeGroupFileName(groupName)}${scopeTag}_${new Date().toISOString().split('T')[0]}.csv`,
    headers: columns,
    rows: [...rows, totals]
  });
  return true;
}
