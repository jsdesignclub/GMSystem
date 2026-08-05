import React from 'react';
import { ArrowLeft, ArrowRight, Award, GraduationCap } from 'lucide-react';
import { getTranslation } from '../../i18n';

function TrainingForm({ data, onUpdate, onPrev, onNext, language = 'en' }) {
  const handleChange = (e) => {
    onUpdate({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>{getTranslation('application.training.title', language)}</h2>
        <p style={{ color: '#64748b', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{getTranslation('application.training.subtitle', language)}</p>
      </div>

      <div className="grid-2" style={{
        marginTop: '1.5rem'
      }}>
        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.training.qualification', language)}</label>
          <select name="qualification" value={data.qualification || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.training.selectQualification', language)}</option>
            <option value="nvq3">{getTranslation('application.training.nvq3', language)}</option>
            <option value="nvq4">{getTranslation('application.training.nvq4', language)}</option>
            <option value="degree">{getTranslation('application.training.degree', language)}</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.training.experienceYears', language)}</label>
          <input type="number" name="experienceYears" value={data.experienceYears || ''} onChange={handleChange} style={inputStyle} min="0" />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{getTranslation('application.training.awardsTitle', language)}</label>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                name="awardRegional" 
                checked={!!data.awardRegional} 
                onChange={(e) => onUpdate({ ...data, awardRegional: e.target.checked })} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              {getTranslation('application.training.regionalAward', language)}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                name="awardDistrict" 
                checked={!!data.awardDistrict} 
                onChange={(e) => onUpdate({ ...data, awardDistrict: e.target.checked })} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              {getTranslation('application.training.districtAward', language)}
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input 
                type="checkbox" 
                name="awardNational" 
                checked={!!data.awardNational} 
                onChange={(e) => onUpdate({ ...data, awardNational: e.target.checked })} 
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              {getTranslation('application.training.nationalAward', language)}
            </label>
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
            minWidth: '120px'
          }}
        >
          <ArrowLeft size={18} /> Back
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
          {getTranslation('application.training.next', language)} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.8rem',
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

const primaryBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  padding: '0.8rem 2rem',
  background: 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)',
  border: 'none',
  borderRadius: '8px',
  color: '#fff',
  fontWeight: 600,
  cursor: 'pointer'
};

const secondaryBtn = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.8rem',
  padding: '0.8rem 2rem',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#cbd5e1',
  fontWeight: 600,
  cursor: 'pointer'
};

export default TrainingForm;
