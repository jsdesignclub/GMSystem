import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { getTranslation } from '../../i18n';

function BusinessDetailsForm({ data, onUpdate, onPrev, onNext, language = 'en' }) {
  const [sectors, setSectors] = useState(['Manufacturing', 'Services', 'Agriculture', 'Tourism', 'IT & Digital']);
  const [isOther, setIsOther] = useState(false);
  const [newSector, setNewSector] = useState('');

  useEffect(() => {
    const fetchSectors = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'settings_sectors'));
        const customSectors = querySnapshot.docs.map(doc => doc.data().name);
        if (customSectors.length > 0) {
          // Merge default with custom, unique only
          setSectors(prev => [...new Set([...prev, ...customSectors])]);
        }
      } catch (err) {
        console.error("Error fetching sectors:", err);
      }
    };
    fetchSectors();
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === 'other') {
      setIsOther(true);
      onUpdate({ ...data, sector: '' });
    } else {
      setIsOther(false);
      onUpdate({ ...data, [e.target.name]: value });
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>{getTranslation('application.business.title', language)}</h2>
        <p style={{ color: '#64748b', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{getTranslation('application.business.subtitle', language)}</p>
      </div>

      <div 
        className="grid-2"
        style={{
          marginTop: '1.5rem'
        }}
      >
        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.businessName', language)}</label>
          <input type="text" name="businessName" value={data.businessName || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.business.businessNamePlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.regNo', language)}</label>
          <input type="text" name="regNo" value={data.regNo || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.business.regNoPlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.regDate', language)}</label>
          <input type="date" name="regDate" value={data.regDate || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.licenseNo', language)}</label>
          <input type="text" name="licenseNo" value={data.licenseNo || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.licenseDate', language)}</label>
          <input type="date" name="licenseDate" value={data.licenseDate || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.employeeCount', language)}</label>
          <input type="number" name="employeeCount" value={data.employeeCount || ''} onChange={handleChange} style={inputStyle} min="0" />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.bookkeeping', language)}</label>
          <select name="hasBookkeeping" value={data.hasBookkeeping || 'no'} onChange={handleChange} style={inputStyle}>
            <option value="no">{getTranslation('application.business.noRecords', language)}</option>
            <option value="yes">{getTranslation('application.business.yesRecords', language)}</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.avgMonthlyIncome', language)}</label>
          <input type="number" name="avgMonthlyIncome" value={data.avgMonthlyIncome || ''} onChange={handleChange} style={inputStyle} placeholder="50,000" min="0" />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.business.sector', language)}</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
            <select 
              name="sector" 
              value={isOther ? 'other' : (data.sector || '')} 
              onChange={handleChange} 
              style={inputStyle}
            >
              <option value="">{getTranslation('application.business.selectSector', language)}</option>
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              <option value="other">{getTranslation('application.business.otherSector', language)}</option>
            </select>
            
            {isOther && (
              <div className="animate-fade-in" style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  placeholder={getTranslation('application.business.customSector', language)} 
                  value={newSector}
                  onChange={(e) => {
                    setNewSector(e.target.value);
                    onUpdate({ ...data, sector: e.target.value, isNewSector: true });
                  }}
                  style={inputStyle}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between' }}>
        <button 
          onClick={onPrev}
          style={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            padding: '1rem 1.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: '#cbd5e1',
            fontWeight: 700,
            cursor: 'pointer',
            minWidth: '150px'
          }}
        >
          <ArrowLeft size={18} />
          {getTranslation('application.business.back', language)}
        </button>

        <button 
          onClick={onNext}
          style={{
            flexGrow: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            padding: '1rem 1.5rem',
            background: 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            minWidth: '200px'
          }}
        >
          {getTranslation('application.business.next', language)}
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.5rem',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.025em'
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem 1rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '1rem',
  outline: 'none',
  boxSizing: 'border-box'
};

export default BusinessDetailsForm;
