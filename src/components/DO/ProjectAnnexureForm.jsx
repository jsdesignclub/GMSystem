import React, { useEffect, useMemo, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Trash2, Save, Loader2, RefreshCw, FileText, Download } from 'lucide-react';
import { getTranslation } from '../../i18n';
import { exportCSV, exportTablePDF } from '../../utils/exportUtils';

function ProjectAnnexureForm({ annexure, language = 'en' }) {
  const ts = (key) => getTranslation(`trainingProject.${key}`, language);
  const ta = (key) => getTranslation(key, language);

  const emptyRow = () => annexure.columns.reduce((row, c) => ({ ...row, [c.key]: '' }), {});

  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [records, setRecords] = useState([]);

  const numericKeys = annexure.columns.filter(c => c.numeric).map(c => c.key);

  const fetchRecords = async () => {
    if (!auth.currentUser) {
      setRecords([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'development_projects'), where('officer.uid', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(rec => rec.type === annexure.type);
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecords(list);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setRows([emptyRow()]);
    fetchRecords();
  }, [annexure.type]);

  const handleChange = (index, key, value) => {
    setRows(prev => prev.map((row, i) => (i === index ? { ...row, [key]: value } : row)));
    setSaved(false);
  };

  const recordRows = (rec) => (rec.rows || []).map((r, i) =>
    annexure.columns.map(c => {
      if (c.key === 'refNo') return r.refNo || i + 1;
      if (c.numeric) return Number(r[c.key] || 0);
      return r[c.key] || '';
    })
  );

  const recordGrandTotal = (rec) => {
    if (rec.grandTotal != null) return Number(rec.grandTotal);
    return (rec.rows || []).reduce((sum, r) => sum + numericKeys.reduce((s, k) => s + Number(r[k] || 0), 0), 0);
  };

  const currentTotal = useMemo(
    () => rows.reduce((sum, row) => sum + numericKeys.reduce((s, k) => s + Number(row[k] || 0), 0), 0),
    [rows]
  );

  const addRow = () => {
    setRows(prev => [...prev, emptyRow()]);
    setSaved(false);
  };

  const removeRow = (index) => {
    setRows(prev => (prev.length === 1 ? [emptyRow()] : prev.filter((_, i) => i !== index)));
    setSaved(false);
  };

  const isRowFilled = (row) => annexure.columns.some(c => String(row[c.key] || '').trim());

  const handleSave = async () => {
    if (!auth.currentUser) {
      setError(ts('loginRequired'));
      return;
    }
    const filled = rows.filter(isRowFilled);
    if (filled.length === 0) {
      setError(ts('emptyRows'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await addDoc(collection(db, 'development_projects'), {
        type: annexure.type,
        year: 2027,
        title: ta(annexure.titleKey),
        rows: filled.map((row, i) => {
          const out = { refNo: String(row.refNo || i + 1) };
          annexure.columns.forEach(c => {
            if (c.key === 'refNo') return;
            out[c.key] = c.numeric ? Number(row[c.key] || 0) : String(row[c.key] || '').trim();
          });
          return out;
        }),
        grandTotal: filled.reduce((sum, row) => sum + numericKeys.reduce((s, k) => s + Number(row[k] || 0), 0), 0),
        officer: { uid: auth.currentUser.uid, email: auth.currentUser.email },
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      setRows([emptyRow()]);
      setSaved(true);
      await fetchRecords();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(ts('deleteConfirm'))) return;
    try {
      await deleteDoc(doc(db, 'development_projects', id));
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  const formatLKR = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

  const columnLabels = annexure.columns.map(c => ta(c.labelKey));

  const recordDate = (rec) => (rec.createdAt ? new Date(rec.createdAt.seconds * 1000) : null);

  const allRows = useMemo(() => records.flatMap(recordRows), [records, language, annexure.type]);
  const allGrandTotal = useMemo(() => records.reduce((sum, rec) => sum + recordGrandTotal(rec), 0), [records]);

  const exportFilename = `${annexure.type}-proposals-2027-${new Date().toISOString().slice(0, 10)}`;

  const totalRow = (value) => [
    ta(annexure.totalKey),
    ...Array(Math.max(annexure.columns.length - 2, 0)).fill(''),
    value
  ];

  const handleExportCSV = () => {
    exportCSV({
      filename: `${exportFilename}.csv`,
      headers: [ta(annexure.titleKey)],
      rows: [
        [`${ts('officer')}: ${auth.currentUser?.email || ''}`],
        [`${ts('generatedOn')}: ${new Date().toLocaleString()}`],
        [],
        columnLabels,
        ...allRows,
        [],
        totalRow(formatLKR(allGrandTotal))
      ]
    });
  };

  const handleExportPDF = () => {
    exportTablePDF({
      title: ta(annexure.titleKey),
      subtitle: `${ts('officer')}: ${auth.currentUser?.email || ''}  |  ${ts('generatedOn')}: ${new Date().toLocaleString()}`,
      columns: columnLabels,
      rows: allRows.map((r, ri) => r.map((cell, ci) => (annexure.columns[ci]?.numeric ? formatLKR(cell) : cell))),
      foot: totalRow(formatLKR(allGrandTotal)),
      filename: `${exportFilename}.pdf`,
      orientation: 'landscape',
      signature: `${ts('signature')}: ............................................`
    });
  };

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: 'clamp(1.2rem, 4vw, 2rem)' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <FileText size={30} color="#2e75b6" /> {ta(annexure.titleKey)}
          </h1>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>{ta(annexure.subtitleKey)}</p>
        </div>
        <button
          onClick={fetchRecords}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}
        >
          <RefreshCw size={15} /> {ts('refresh')}
        </button>
      </header>

      {error && (
        <div className="glass" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderLeft: '3px solid #f43f5e', color: '#f43f5e', fontSize: '0.85rem' }}>
          {ts('error')}: {error}
        </div>
      )}

      {saved && !error && (
        <div className="glass" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderLeft: '3px solid #10b981', color: '#10b981', fontSize: '0.85rem' }}>
          {ts('savedMsg')}
        </div>
      )}

      <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{ta(annexure.formTitleKey)}</h3>
          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{rows.length} {ts('rowsLabel')}</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '760px' }}>
            <thead>
              <tr>
                {columnLabels.map((label, i) => (
                  <th key={i} style={{ textAlign: 'left', padding: '0.65rem 0.6rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {label}
                  </th>
                ))}
                <th style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {annexure.columns.map((c, ci) => (
                    <td key={c.key} style={{ padding: '0.5rem 0.4rem', minWidth: ci === 0 ? '60px' : '180px' }}>
                      <input
                        type={c.input}
                        min={c.numeric ? '0' : undefined}
                        value={row[c.key]}
                        onChange={(e) => handleChange(index, c.key, e.target.value)}
                        placeholder={ci === 0 ? String(index + 1) : ''}
                        style={cellInput}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '0.5rem 0.4rem', textAlign: 'center' }}>
                    <button
                      onClick={() => removeRow(index)}
                      title={ts('removeRow')}
                      style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#f43f5e', borderRadius: '8px', padding: '0.4rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={annexure.columns.length - 1} style={{ padding: '0.9rem 0.6rem', textAlign: 'right', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem' }}>
                  {ta(annexure.totalKey)}
                </td>
                <td style={{ padding: '0.9rem 0.6rem', color: '#10b981', fontWeight: 800, fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                  {formatLKR(currentTotal)}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={addRow}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.3rem', background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', color: '#cbd5e1', fontWeight: 600, cursor: 'pointer' }}
          >
            <Plus size={17} /> {ts('addRow')}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.7rem',
              padding: '0.85rem 2.2rem',
              background: saving ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)',
              border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700,
              fontSize: '0.95rem', cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 10px 25px rgba(46, 117, 182, 0.2)'
            }}
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} {saving ? ts('saving') : ts('save')}
          </button>
        </div>
      </div>

      <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileText size={18} color="#2e75b6" /> {ts('savedProposals')}
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>({allRows.length} {ts('rowsLabel')})</span>
          </h3>
          {records.length > 0 && !loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button onClick={handleExportCSV} style={downloadBtnStyle}>
                <Download size={15} /> {ts('downloadCsv')}
              </button>
              <button onClick={handleExportPDF} style={downloadBtnStyle}>
                <Download size={15} /> {ts('downloadPdf')}
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b' }}>
            <Loader2 className="animate-spin" size={24} style={{ margin: '0 auto 0.6rem', display: 'block' }} />
            {ts('loading')}
          </div>
        ) : records.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>{ts('noData')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: '760px' }}>
              <thead>
                <tr>
                  {columnLabels.map((label, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '0.65rem 0.7rem', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontWeight: 600, whiteSpace: 'nowrap', background: 'rgba(255,255,255,0.02)' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.map(rec => {
                  const dt = recordDate(rec);
                  return (
                    <React.Fragment key={rec.id}>
                      <tr>
                        <td colSpan={annexure.columns.length} style={{ padding: '0.5rem 0.7rem', background: 'rgba(46,117,182,0.1)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>
                              {ts('officer')}: {rec.officer?.email || '—'} &middot; {dt ? dt.toLocaleDateString() : '—'} &middot; {(rec.rows || []).length} {ts('rowsLabel')}
                            </span>
                            <button
                              onClick={() => handleDelete(rec.id)}
                              title={ts('deleteRow')}
                              style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', color: '#f43f5e', borderRadius: '8px', padding: '0.3rem 0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {recordRows(rec).map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} style={{ padding: '0.6rem 0.7rem', color: annexure.columns[ci]?.numeric ? '#10b981' : '#cbd5e1', fontWeight: annexure.columns[ci]?.numeric ? 700 : 400, whiteSpace: 'nowrap' }}>
                              {annexure.columns[ci]?.numeric ? formatLKR(cell) : cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={annexure.columns.length - 1} style={{ padding: '0.9rem 0.7rem', textAlign: 'right', color: '#94a3b8', fontWeight: 700, fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {ta(annexure.totalKey)}
                  </td>
                  <td style={{ padding: '0.9rem 0.7rem', color: '#10b981', fontWeight: 800, fontSize: '0.95rem', whiteSpace: 'nowrap', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    {formatLKR(allGrandTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const cellInput = {
  width: '100%',
  minWidth: '70px',
  padding: '0.5rem 0.6rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.8rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit'
};

const downloadBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.4rem',
  padding: '0.5rem 0.9rem',
  background: 'rgba(46, 117, 182, 0.15)',
  border: '1px solid rgba(46, 117, 182, 0.45)',
  borderRadius: '8px',
  color: '#60a5fa',
  fontWeight: 600,
  fontSize: '0.78rem',
  cursor: 'pointer'
};

export default ProjectAnnexureForm;
