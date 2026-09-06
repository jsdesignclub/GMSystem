import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  FileText, Wallet, Package, RefreshCw, CheckCircle, Clock, XCircle, Loader2, Users, MapPin
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LabelList, PieChart, Pie, Cell
} from 'recharts';
import { getTranslation } from '../i18n';

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

const formatCompact = (value) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return `${Number(value || 0)}`;
};

function AdminDashboard({ language = 'en' }) {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartScope, setChartScope] = useState('all');
  const [gsScope, setGsScope] = useState('all');
  const [doSort, setDoSort] = useState({ key: 'entered', dir: 'desc' });

  const t = (key) => getTranslation(`adminDashboard.${key}`, language);

  const fetchApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'applications'));
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
    const costOf = (app) => Number(app.equipment?.totalGrant || 0) * 2;

    const approvedApps = apps.filter(a => APPROVED_STATUSES.includes(a.status));
    const pendingApps = apps.filter(a => PENDING_STATUSES.includes(a.status));
    const rejectedApps = apps.filter(a => a.status === 'rejected');

    return {
      totalReceived: apps.length,
      grantTotal: approvedApps.reduce((sum, a) => sum + grantOf(a), 0),
      equipmentAmount: apps.reduce((sum, a) => sum + costOf(a), 0),
      approved: approvedApps.length,
      pending: pendingApps.length,
      rejected: rejectedApps.length
    };
  }, [apps]);

  const divisionData = useMemo(() => {
    const source = chartScope === 'approved'
      ? apps.filter(a => APPROVED_STATUSES.includes(a.status))
      : apps;

    const map = {};
    source.forEach(app => {
      const div = app.division || 'Unassigned';
      if (!map[div]) map[div] = { division: div, amount: 0, count: 0 };
      map[div].amount += Number(app.equipment?.totalGrant || 0);
      map[div].count += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .map(d => ({
        ...d,
        labelText: `${d.count}  ·  ${d.amount > 0 ? `LKR ${formatCompact(d.amount)}` : '—'}`
      }));
  }, [apps, chartScope]);

  const statusData = [
    { name: t('approved'), value: stats.approved, color: '#10b981' },
    { name: t('pending'), value: stats.pending, color: '#f59e0b' },
    { name: t('rejected'), value: stats.rejected, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  const doStats = useMemo(() => {
    const map = {};
    apps.forEach(app => {
      const key = app.officer?.uid || app.officer?.email || 'unknown';
      if (!map[key]) {
        map[key] = {
          id: key,
          name: app.officer?.email?.split('@')[0] || 'Unknown',
          email: app.officer?.email || '',
          entered: 0,
          approvedCount: 0,
          approvedAmount: 0,
          rejectedCount: 0,
          rejectedAmount: 0,
          equipmentValue: 0
        };
      }
      const s = map[key];
      const grant = Number(app.equipment?.totalGrant || 0);
      s.entered += 1;
      s.equipmentValue += grant * 2;
      if (APPROVED_STATUSES.includes(app.status)) {
        s.approvedCount += 1;
        s.approvedAmount += grant;
      } else if (app.status === 'rejected') {
        s.rejectedCount += 1;
        s.rejectedAmount += grant;
      }
    });
    return Object.values(map).sort((a, b) => b.entered - a.entered);
  }, [apps]);

  const sortedDoStats = useMemo(() => {
    const { key, dir } = doSort;
    return [...doStats].sort((a, b) => (dir === 'asc' ? a[key] - b[key] : b[key] - a[key]));
  }, [doStats, doSort]);

  const doTotals = useMemo(() => doStats.reduce((acc, s) => ({
    entered: acc.entered + s.entered,
    approvedCount: acc.approvedCount + s.approvedCount,
    approvedAmount: acc.approvedAmount + s.approvedAmount,
    rejectedCount: acc.rejectedCount + s.rejectedCount,
    rejectedAmount: acc.rejectedAmount + s.rejectedAmount,
    equipmentValue: acc.equipmentValue + s.equipmentValue
  }), { entered: 0, approvedCount: 0, approvedAmount: 0, rejectedCount: 0, rejectedAmount: 0, equipmentValue: 0 }), [doStats]);

  const gsBreakdown = useMemo(() => {
    const source = gsScope === 'approved'
      ? apps.filter(a => APPROVED_STATUSES.includes(a.status))
      : apps;

    const map = {};
    source.forEach(app => {
      const div = app.personal?.gsDivision || app.gsDivision || 'Unassigned';
      if (!map[div]) map[div] = { division: div, amount: 0, count: 0 };
      map[div].amount += Number(app.equipment?.totalGrant || 0);
      map[div].count += 1;
    });

    return Object.values(map)
      .sort((a, b) => b.count - a.count)
      .map(d => ({
        ...d,
        labelText: `${d.count}  ·  ${d.amount > 0 ? `LKR ${formatCompact(d.amount)}` : '—'}`
      }));
  }, [apps, gsScope]);

  const maxGsCount = Math.max(...gsBreakdown.map(d => d.count), 0);
  const handleDoSort = (key) => {
    setDoSort(prev => (prev.key === key && prev.dir === 'desc') ? { key, dir: 'asc' } : { key, dir: 'desc' });
  };

  const statusTotal = stats.approved + stats.pending + stats.rejected;
  const maxDivisionCount = Math.max(...divisionData.map(d => d.count), 0);

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
          <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>{t('subtitle')}</p>
        </div>
        <button
          onClick={fetchApps}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '0.6rem 1.2rem',
            borderRadius: '10px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
        >
          <RefreshCw size={15} />
          {t('refresh')}
        </button>
      </header>

      {error && (
        <div className="glass" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', borderLeft: '3px solid #f43f5e', color: '#f43f5e', fontSize: '0.85rem' }}>
          {t('error')}: {error}
        </div>
      )}

      {/* Top Stats */}
      <div className="grid-3">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #2e75b6' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('applicationsReceived')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800 }}>{stats.totalReceived.toLocaleString()}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{t('applicationsReceivedSub')}</p>
            </div>
            <div style={iconBoxStyle('rgba(46, 117, 182, 0.15)')}>
              <FileText size={24} color="#3b82f6" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.08 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #10b981' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('grantTotal')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800 }}>{formatLKR(stats.grantTotal)}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{t('grantTotalSub')}</p>
            </div>
            <div style={iconBoxStyle('rgba(16, 185, 129, 0.15)')}>
              <Wallet size={24} color="#10b981" />
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.16 }}>
          <div className="glass" style={{ ...statCardStyle, borderBottom: '2px solid #8b5cf6' }}>
            <div>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>{t('equipmentAmount')}</p>
              <h2 style={{ margin: '0.6rem 0 0.2rem', fontSize: 'clamp(1.6rem, 5vw, 2.2rem)', fontWeight: 800 }}>{formatLKR(stats.equipmentAmount)}</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>{t('equipmentAmountSub')}</p>
            </div>
            <div style={iconBoxStyle('rgba(139, 92, 246, 0.15)')}>
              <Package size={24} color="#8b5cf6" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* DS Division Chart */}
        <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.2rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t('divisionChartTitle')}</h3>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('divisionChartSub')}</p>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {[['all', t('scopeAll')], ['approved', t('scopeApproved')]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setChartScope(key)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: chartScope === key ? '1px solid #2e75b6' : '1px solid rgba(255,255,255,0.12)',
                    background: chartScope === key ? 'rgba(46,117,182,0.25)' : 'rgba(255,255,255,0.04)',
                    color: '#fff'
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {divisionData.length === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>{t('noData')}</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(280, divisionData.length * 38)}>
              <BarChart data={divisionData} layout="vertical" margin={{ top: 0, right: 120, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={maxDivisionCount > 0 ? [0, maxDivisionCount * 1.25] : [0, 'auto']}
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="division"
                  width={110}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    background: '#0c111d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#e2e8f0',
                    fontSize: '0.8rem'
                  }}
                  formatter={(value, name, entry) => [
                    `${value} ${t('tooltipApps')} (${formatLKR(entry.payload.amount)})`,
                    t('totalApplications')
                  ]}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                  <LabelList dataKey="labelText" position="right" offset={10} fill="#f1f5f9" fontSize={12} fontWeight={700} />
                  {divisionData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={chartScope === 'approved'
                        ? (entry.count === maxDivisionCount ? '#10b981' : 'rgba(16,185,129,0.55)')
                        : (entry.count === maxDivisionCount ? '#2e75b6' : 'rgba(46,117,182,0.55)')}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.2rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>{t('statusBreakdownTitle')}</h3>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('statusBreakdownSub')}</p>
          </div>

          {statusTotal === 0 ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>{t('noData')}</div>
          ) : (
            <>
              <div style={{ position: 'relative', flex: 1, minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={4}
                      strokeWidth={0}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: '#0c111d',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '10px',
                        color: '#e2e8f0',
                        fontSize: '0.8rem'
                      }}
                      formatter={(value, name) => [`${value} (${((value / statusTotal) * 100).toFixed(1)}%)`, name]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none'
                }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800 }}>{statusTotal}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('totalApplications')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', marginTop: '1.2rem' }}>
                {[
                  { key: 'approved', label: t('approved'), count: stats.approved, color: '#10b981', icon: CheckCircle },
                  { key: 'pending', label: t('pending'), count: stats.pending, color: '#f59e0b', icon: Clock },
                  { key: 'rejected', label: t('rejected'), count: stats.rejected, color: '#f43f5e', icon: XCircle }
                ].map(({ key, label, count, color, icon: Icon }) => {
                  const pct = statusTotal ? ((count / statusTotal) * 100).toFixed(0) : 0;
                  return (
                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <Icon size={17} color={color} />
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
      </div>

      {/* DO Performance */}
      <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginTop: '1.5rem' }}>
        <div style={{ marginBottom: '1.2rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#2e75b6" /> {t('doPerfTitle')}
          </h3>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('doPerfSub')}</p>
        </div>

        {doStats.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>{t('noData')}</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(200, doStats.length * 38)}>
              <BarChart data={doStats} layout="vertical" margin={{ top: 0, right: 60, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, Math.max(...doStats.map(d => d.entered), 1) * 1.25]}
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={130}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={{
                    background: '#0c111d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    color: '#e2e8f0',
                    fontSize: '0.8rem'
                  }}
                  formatter={(value) => [`${value} ${t('tooltipApps')}`, t('colEntered')]}
                />
                <Bar dataKey="entered" radius={[0, 6, 6, 0]} barSize={16} fill="#2e75b6">
                  <LabelList dataKey="entered" position="right" offset={8} fill="#f1f5f9" fontSize={12} fontWeight={700} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            <div style={{ overflowX: 'auto', marginTop: '1.2rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: '780px' }}>
                <thead>
                  <tr>
                    {[
                      ['name', t('colOfficer'), 'left'],
                      ['entered', t('colEntered'), 'right'],
                      ['approvedCount', t('colApprovedCount'), 'right'],
                      ['approvedAmount', t('colApprovedAmt'), 'right'],
                      ['rejectedCount', t('colRejectedCount'), 'right'],
                      ['rejectedAmount', t('colRejectedAmt'), 'right'],
                      ['equipmentValue', t('colEquipmentValue'), 'right']
                    ].map(([key, label, align]) => (
                      <th
                        key={key}
                        onClick={() => handleDoSort(key)}
                        style={{
                          textAlign: align,
                          padding: '0.65rem 0.9rem',
                          borderBottom: '1px solid rgba(255,255,255,0.08)',
                          color: doSort.key === key ? '#3b82f6' : '#94a3b8',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        title="Click to sort"
                      >
                        {label}{doSort.key === key ? (doSort.dir === 'desc' ? ' ▼' : ' ▲') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedDoStats.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: '#e2e8f0' }}>{s.name}</td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right' }}>{s.entered}</td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: '#10b981' }}>{s.approvedCount}</td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: '#10b981' }}>{formatLKR(s.approvedAmount)}</td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: '#f43f5e' }}>{s.rejectedCount}</td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: '#f43f5e' }}>{formatLKR(s.rejectedAmount)}</td>
                      <td style={{ padding: '0.65rem 0.9rem', textAlign: 'right', color: '#8b5cf6', fontWeight: 600 }}>{formatLKR(s.equipmentValue)}</td>
                    </tr>
                  ))}
                  <tr style={{ borderTop: '2px solid rgba(255,255,255,0.12)' }}>
                    <td style={{ padding: '0.7rem 0.9rem', fontWeight: 700 }}>Σ Total</td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700 }}>{doTotals.entered}</td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{doTotals.approvedCount}</td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#10b981' }}>{formatLKR(doTotals.approvedAmount)}</td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#f43f5e' }}>{doTotals.rejectedCount}</td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#f43f5e' }}>{formatLKR(doTotals.rejectedAmount)}</td>
                    <td style={{ padding: '0.7rem 0.9rem', textAlign: 'right', fontWeight: 700, color: '#8b5cf6' }}>{formatLKR(doTotals.equipmentValue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* GS Division Breakdown */}
      <div className="glass" style={{ padding: 'clamp(1rem, 3vw, 1.5rem)', marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={18} color="#2e75b6" /> {t('gsChartTitle')}
            </h3>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.78rem', color: '#64748b' }}>{t('gsChartSub')}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {[['all', t('scopeAll')], ['approved', t('scopeApproved')]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setGsScope(key)}
                style={{
                  padding: '0.4rem 0.9rem',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: gsScope === key ? '1px solid #2e75b6' : '1px solid rgba(255,255,255,0.12)',
                  background: gsScope === key ? 'rgba(46,117,182,0.25)' : 'rgba(255,255,255,0.04)',
                  color: '#fff'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {gsBreakdown.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#475569', fontSize: '0.85rem' }}>{t('noData')}</div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, gsBreakdown.length * 30)}>
            <BarChart data={gsBreakdown.slice(0, 20)} layout="vertical" margin={{ top: 0, right: 120, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                domain={maxGsCount > 0 ? [0, maxGsCount * 1.25] : [0, 'auto']}
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="division"
                width={150}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                contentStyle={{
                  background: '#0c111d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#e2e8f0',
                  fontSize: '0.8rem'
                }}
                formatter={(value, name, entry) => [
                  `${value} ${t('tooltipApps')} (${formatLKR(entry.payload.amount)})`,
                  t('totalApplications')
                ]}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                <LabelList dataKey="labelText" position="right" offset={10} fill="#f1f5f9" fontSize={12} fontWeight={700} />
                {gsBreakdown.slice(0, 20).map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.count === maxGsCount ? '#2e75b6' : 'rgba(46,117,182,0.55)'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
