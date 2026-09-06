import React, { useEffect, useMemo, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  FileText, Wallet, Package, RefreshCw, CheckCircle, Clock, XCircle,
  Loader2, MapPin, User
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LabelList, PieChart, Pie, Cell
} from 'recharts';
import { getTranslation } from '../../i18n';

const APPROVED_STATUSES = ['approved', 'ordered', 'completed'];
const PENDING_STATUSES = ['pending_ds', 'pending_director', 'approved_by_director'];

const statCardStyle = {
  padding: 'clamp(1rem, 3vw, 1.5rem)',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem',
  position: 'relative',
  overflow: 'hidden'
};

const iconBoxStyle = (bg) => ({
  width: '48px',
  height: '48px',
  borderRadius: '12px',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
});

const formatLKR = (value) => `LKR ${Number(value || 0).toLocaleString()}`;

function DODashboard({ language = 'en' }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tableSort, setTableSort] = useState({ key: 'date', dir: 'desc' });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const t = (key) => getTranslation(`doDashboard.${key}`, language);

  const fetchApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'applications'), where('officer.uid', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      setApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const stats = useMemo(() => {
    const grantOf = (app) => Number(app.equipment?.totalGrant || 0);
    const approvedApps = apps.filter(a => APPROVED_STATUSES.includes(a.status));
    const pendingApps = apps.filter(a => PENDING_STATUSES.includes(a.status));
    const rejectedApps = apps.filter(a => a.status === 'rejected');

    return {
      totalEntered: apps.length,
      approvedCount: approvedApps.length,
      approvedAmount: approvedApps.reduce((sum, a) => sum + grantOf(a), 0),
      pending: pendingApps.length,
      rejectedCount: rejectedApps.length,
      rejectedAmount: rejectedApps.reduce((sum, a) => sum + grantOf(a), 0),
      equipmentValue: apps.reduce((sum, a) => sum + grantOf(a) * 2, 0)
    };
  }, [apps]);

  const statusData = [
    { name: t('statusApproved'), value: stats.approvedCount, color: '#10b981' },
    { name: t('statusPending'), value: stats.pending, color: '#f59e0b' },
    { name: t('statusRejected'), value: stats.rejectedCount, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  const statusTotal = stats.approvedCount + stats.pending + stats.rejectedCount;

  const gsData = useMemo(() => {
    const map = {};
    apps.forEach(app => {
      const div = app.personal?.gsDivision || app.gsDivision || 'Unassigned';
      if (!map[div]) map[div] = { division: div, amount: 0, count: 0 };
      map[div].amount += Number(app.equipment?.totalGrant || 0);
      map[div].count += 1;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [apps]);

  const statusCounts = useMemo(() => ({
    all: apps.length,
    approved: apps.filter(a => APPROVED_STATUSES.includes(a.status)).length,
    pending: apps.filter(a => PENDING_STATUSES.includes(a.status)).length,
    rejected: apps.filter(a => a.status === 'rejected').length
  }), [apps]);

  const tableApps = useMemo(() => {
    const s = search.trim().toLowerCase();
    const filtered = apps.filter(app => {
      const matchSearch = !s ||
        (app.personal?.fullName || '').toLowerCase().includes(s) ||
        (app.business?.sector || '').toLowerCase().includes(s) ||
        (app.personal?.gsDivision || '').toLowerCase().includes(s);
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'approved' && APPROVED_STATUSES.includes(app.status)) ||
        (statusFilter === 'pending' && PENDING_STATUSES.includes(app.status)) ||
        (statusFilter === 'rejected' && app.status === 'rejected');
      return matchSearch && matchStatus;
    });

    const val = (app) => {
      switch (tableSort.key) {
        case 'applicant': return (app.personal?.fullName || '').toLowerCase();
        case 'division': return (app.personal?.gsDivision || '').toLowerCase();
        case 'amount': return Number(app.equipment?.totalGrant || 0);
        case 'status': return app.status || '';
        default: return app.createdAt?.seconds || 0;
      }
    };

    return [...filtered].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb));
      return tableSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [apps, search, statusFilter, tableSort]);

  const handleTableSort = (key) => {
    setTableSort(prev => (prev.key === key && prev.dir === 'desc') ? { key, dir: 'asc' } : { key, dir: 'desc' });
  };

  const statusChip = (status) => {
    if (APPROVED_STATUSES.includes(status)) return { label: t('statusApproved'), color: '#10b981' };
    if (status === 'rejected') return { label: t('statusRejected'), color: '#f43f5e' };
    return { label: t('statusPending'), color: '#f59e0b' };
  };

  if (loading) {
    return (
      <div style={{ padding: '6rem 1rem', textAlign: 'center', color: '#64748b' }}>
        <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 1rem' }} />
        <p>{t('loading')}</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', marginBottom: 'clamp(1.2rem, 4vw, 2rem)' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', margin: 0 }}>{t('title')}</h1>
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
            {t('welcome')} <strong>{(auth.currentUser?.email || '').split('@')[0]}</strong> &middot; {t('subtitle')}
          </p>
        </div>
        <button onClick={fetchApps} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.6rem 1.2rem', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>
          <RefreshCw size={15} /> {t('refresh')}
        </button>
      </header>

      {error && (
        <div className="glass" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderLeft: '3px solid #f43f5e', color: '#f43f5e', fontSize: '0.85rem' }}>
          {t('error')}: {error}
        </div>
      )}

      <div className="grid-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #2e75b6' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('myApps')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800 }}>{stats.totalEntered.toLocaleString()}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{t('myAppsSub')}</p>
            </div>
            <div style={iconBoxStyle('rgba(46, 117, 182, 0.15)')}>
              <FileText size={24} color="#3b82f6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #10b981' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('approvedAmount')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 800 }}>{formatLKR(stats.approvedAmount)}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{stats.approvedCount} {t('appsApprovedWord')}</p>
            </div>
            <div style={iconBoxStyle('rgba(16, 185, 129, 0.15)')}>
              <Wallet size={24} color="#10b981" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #8b5cf6' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('equipmentValue')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 800 }}>{formatLKR(stats.equipmentValue)}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{t('equipmentValueSub')}</p>
            </div>
            <div style={iconBoxStyle('rgba(139, 92, 246, 0.15)')}>
              <Package size={24} color="#8b5cf6" />
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid-3" style={{ marginTop: '1.5rem' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #10b981' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('statusApproved')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800, color: '#10b981' }}>{stats.approvedCount}</h2>
            </div>
            <div style={iconBoxStyle('rgba(16, 185, 129, 0.15)')}>
              <CheckCircle size={24} color="#10b981" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #f59e0b' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('statusPending')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800, color: '#f59e0b' }}>{stats.pending}</h2>
            </div>
            <div style={iconBoxStyle('rgba(245, 158, 11, 0.15)')}>
              <Clock size={24} color="#f59e0b" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #f43f5e' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('rejectedAmountLabel')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.4rem, 4vw, 1.9rem)', fontWeight: 800, color: '#f43f5e' }}>{formatLKR(stats.rejectedAmount)}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{stats.rejectedCount} {t('appsRejectedWord')}</p>
            </div>
            <div style={iconBoxStyle('rgba(244, 63, 94, 0.15)')}>
              <XCircle size={24} color="#f43f5e" />
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t('statusTitle')}</h3>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('statusSub')}</p>
          </div>

          {statusTotal === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>{t('noData')}</div>
          ) : (
            <>
              <div style={{ position: 'relative', flex: 1, minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="62%" outerRadius="88%" paddingAngle={4} strokeWidth={0}>
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0c111d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', fontSize: '0.8rem' }} formatter={(value, name) => [`${value} (${((value / statusTotal) * 100).toFixed(1)}%)`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{statusTotal}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('totalApplications')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '1.2rem' }}>
                {[
                  { label: t('statusApproved'), count: stats.approvedCount, color: '#10b981' },
                  { label: t('statusPending'), count: stats.pending, color: '#f59e0b' },
                  { label: t('statusRejected'), count: stats.rejectedCount, color: '#f43f5e' }
                ].map(({ label, count, color }) => {
                  const pct = statusTotal ? ((count / statusTotal) * 100).toFixed(0) : 0;
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.35rem' }}>
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{label}</span>
                          <span style={{ color: '#94a3b8' }}>{count} &middot; {pct}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#2e75b6" /> {t('gsTitle')}
            </h3>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('gsSub')}</p>
          </div>

          {gsData.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>{t('noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(240, Math.min(gsData.length, 15) * 34)}>
              <BarChart data={gsData.slice(0, 15)} layout="vertical" margin={{ top: 0, right: 110, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" domain={[0, Math.max(...gsData.map(d => d.count), 1) * 1.25]} allowDecimals={false} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                <YAxis type="category" dataKey="division" width={150} tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ background: '#0c111d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#e2e8f0', fontSize: '0.8rem' }} formatter={(value, name, entry) => [`${value} ${t('tooltipApps')} (${formatLKR(entry.payload.amount)})`, t('totalApplications')]} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14} fill="#2e75b6">
                  <LabelList dataKey="count" position="right" offset={8} fill="#f1f5f9" fontSize={12} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={18} color="#2e75b6" /> {t('allAppsTitle')}
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>({tableApps.length} / {apps.length})</span>
          </h3>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              style={{
                width: '100%',
                padding: '0.55rem 1rem',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                color: '#fff',
                outline: 'none',
                fontSize: '0.82rem'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            ['all', t('filterAll'), '#94a3b8'],
            ['approved', t('statusApproved'), '#10b981'],
            ['pending', t('statusPending'), '#f59e0b'],
            ['rejected', t('statusRejected'), '#f43f5e']
          ].map(([key, label, color]) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              style={{
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: statusFilter === key ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.12)',
                background: statusFilter === key ? `${color}22` : 'rgba(255,255,255,0.04)',
                color: statusFilter === key ? color : '#94a3b8'
              }}
            >
              {label} ({statusCounts[key]})
            </button>
          ))}
        </div>

        {tableApps.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>{t('noData')}</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '700px' }}>
              <thead>
                <tr>
                  {[
                    ['applicant', t('colApplicant'), 'left'],
                    ['division', t('colDivision'), 'left'],
                    ['amount', t('colAmount'), 'right'],
                    ['status', t('colStatus'), 'left'],
                    ['date', t('colDate'), 'right']
                  ].map(([key, label, align]) => (
                    <th
                      key={key}
                      onClick={() => handleTableSort(key)}
                      style={{
                        textAlign: align,
                        padding: '0.65rem 0.9rem',
                        borderBottom: '1px solid rgba(255,255,255,0.08)',
                        color: tableSort.key === key ? '#3b82f6' : '#94a3b8',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                      title="Click to sort"
                    >
                      {label}{tableSort.key === key ? (tableSort.dir === 'desc' ? ' ▼' : ' ▲') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableApps.map(app => {
                  const chip = statusChip(app.status);
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: '#e2e8f0' }}>
                        {app.personal?.fullName || 'Unnamed Applicant'}
                        <div style={{ fontSize: '0.72rem', opacity: 0.6, fontWeight: 400 }}>{app.business?.sector || ''}</div>
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', color: '#94a3b8' }}>{app.personal?.gsDivision || '—'}</td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: '#e2e8f0' }}>{formatLKR(app.equipment?.totalGrant)}</td>
                      <td style={{ padding: '0.65rem 0.9rem' }}>
                        <span style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, background: `${chip.color}22`, color: chip.color, border: `1px solid ${chip.color}55`, whiteSpace: 'nowrap' }}>
                          {chip.label}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {app.createdAt ? new Date(app.createdAt.seconds * 1000).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default DODashboard;
