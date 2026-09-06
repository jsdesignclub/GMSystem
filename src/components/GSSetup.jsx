import React, { useMemo, useState } from 'react';
import { MapPin, CheckCircle } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { dsDivisions, gsDivisionsData } from '../utils/divisions';

function GSSetup({ onDone, onSkip }) {
  const { currentUser, userDivision, userGsDivision, refreshUserData } = useAuth();
  const [saving, setSaving] = useState(false);

  const allDs = [...dsDivisions.Badulla, ...dsDivisions.Monaragala];
  const [dsDivision, setDsDivision] = useState(allDs.includes(userDivision) ? userDivision : '');
  const [gsDivision, setGsDivision] = useState(userGsDivision || '');

  const gsOptions = useMemo(() => (dsDivision && gsDivisionsData[dsDivision]) || [], [dsDivision]);

  const districtOf = (ds) => (dsDivisions.Badulla.includes(ds) ? 'Badulla' : dsDivisions.Monaragala.includes(ds) ? 'Monaragala' : '');

  const handleSave = async () => {
    if (!currentUser || !gsDivision) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        gsDivision,
        division: dsDivision || undefined
      });
      await refreshUserData();
      if (onDone) onDone();
    } catch (error) {
      alert('Could not save your GS Division: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1200,
      padding: '1rem'
    }}>
      <div className="glass" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ padding: '0.7rem', background: 'rgba(59, 130, 246, 0.12)', borderRadius: '12px' }}>
            <MapPin size={22} color="#3b82f6" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Set Your GS Division</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>One-time setup to unlock your GS approval dashboard.</p>
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>DS Division</label>
        <select
          value={dsDivision}
          onChange={(e) => { setDsDivision(e.target.value); setGsDivision(''); }}
          style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
        >
          <option value="">Select DS Division</option>
          {Object.keys(dsDivisions).map(dist => (
            <optgroup key={dist} label={dist}>
              {dsDivisions[dist].map(ds => <option key={ds} value={ds}>{ds}</option>)}
            </optgroup>
          ))}
        </select>

        <label style={{ display: 'block', margin: '1.2rem 0 0.4rem', fontSize: '0.85rem', color: '#94a3b8' }}>GS Division</label>
        <select
          value={gsDivision}
          onChange={(e) => setGsDivision(e.target.value)}
          disabled={!dsDivision}
          style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box' }}
        >
          <option value="">{dsDivision ? 'Select GS Division' : 'Select DS Division first'}</option>
          {gsOptions.map(gs => <option key={gs} value={gs}>{gs}</option>)}
        </select>

        <button
          onClick={handleSave}
          disabled={!gsDivision || saving}
          style={{
            width: '100%', marginTop: '2rem', padding: '1rem',
            background: gsDivision ? 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)' : 'rgba(255,255,255,0.05)',
            border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700,
            cursor: gsDivision ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}
        >
          <CheckCircle size={18} /> {saving ? 'Saving...' : 'Save & Continue'}
        </button>

        <button
          onClick={() => { localStorage.setItem('gs_setup_skipped', '1'); if (onSkip) onSkip(); }}
          style={{ width: '100%', marginTop: '0.8rem', padding: '0.7rem', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

export default GSSetup;
