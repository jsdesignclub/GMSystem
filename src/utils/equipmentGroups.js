import { exportTablePDF } from './exportUtils';

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

export async function exportEquipmentGroupPDF({
  apps,
  items,
  groupName,
  onlySelected = false,
  totalAvailable = null
}) {
  const set = toSet(items);
  const exportSet = apps || [];
  if (exportSet.length === 0) {
    alert('No applications match the selected equipment group.');
    return false;
  }

  const columns = [
    '#', 'Ref ID', 'Name', 'Business', 'Division', 'GS Div', 'Equipment',
    'Brand', 'Model', 'Qty', 'Score', 'Total Cost', 'Grant', 'Dispatch'
  ];

  const rows = exportSet.map((app, i) => {
    const its = matchGroupItems(app, set);
    return [
      (i + 1).toString(),
      (app.id || '').substring(0, 8).toUpperCase(),
      app.personal?.fullName || 'N/A',
      app.business?.businessName || 'N/A',
      app.division || '-',
      app.personal?.gsDivision || '-',
      its.map(it => it.name).join(', ') || '-',
      its.map(it => it.brand).filter(Boolean).join(', ') || '-',
      its.map(it => it.model).filter(Boolean).join(', ') || '-',
      its.reduce((s, it) => s + (Number(it.qty) || 0), 0).toString(),
      (app.score || 0).toString(),
      ((app.equipment?.totalGrant || 0) * 2).toLocaleString(),
      (app.equipment?.totalGrant || 0).toLocaleString(),
      app.adminDispatch ? 'Sent to Accounts' : 'Awaiting Dispatch'
    ];
  });

  const sums = exportSet.reduce((acc, app) => {
    const its = matchGroupItems(app, set);
    acc.units += its.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    acc.totalCost += (app.equipment?.totalGrant || 0) * 2;
    acc.totalGrant += app.equipment?.totalGrant || 0;
    return acc;
  }, { units: 0, totalCost: 0, totalGrant: 0 });

  const foot = Array(columns.length).fill('');
  foot[0] = 'TOTAL';
  foot[9] = String(sums.units);
  foot[11] = `LKR ${sums.totalCost.toLocaleString()}`;
  foot[12] = `LKR ${sums.totalGrant.toLocaleString()}`;

  const scope = onlySelected && totalAvailable !== null
    ? `Selected rows only (${exportSet.length} of ${totalAvailable})`
    : `${exportSet.length} application(s)`;

  const safeName = (groupName || 'Ad-hoc selection').replace(/[^\w\s-]/g, '').trim() || 'equipment-group';

  try {
    await exportTablePDF({
      title: `SME Grant System - Equipment Group: ${groupName || 'Ad-hoc'}`,
      subtitle: [
        `Equipment: ${(items || []).join(' + ') || 'All'}`,
        scope,
        `Department of Industries Development Uva Province | Report Date: ${new Date().toLocaleString()}`
      ].join('  |  '),
      columns,
      rows,
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
