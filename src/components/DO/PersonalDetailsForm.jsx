import React, { useMemo } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import { getTranslation } from '../../i18n';
import { dsDivisions, gsDivisionsData } from '../../utils/divisions';

function PersonalDetailsForm({ data, onUpdate, onNext, language = 'en' }) {
  const dsDivisionsForDistrict = useMemo(() => dsDivisions[data.district] || [], [data.district]);
  const gsDivisions = useMemo(() => gsDivisionsData[data.dsDivision] || [], [data.dsDivision]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updates = { ...data, [name]: value };
    if (name === 'district') {
      updates.dsDivision = '';
      updates.gsDivision = '';
    }
    if (name === 'dsDivision') {
      updates.gsDivision = '';
    }
    onUpdate(updates);
  };

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        flexWrap: 'wrap', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        gap: '1rem'
      }}>
        <div style={{ minWidth: '200px', flex: '1' }}>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>{getTranslation('application.personal.title', language)}</h2>
          <p style={{ color: '#64748b', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{getTranslation('application.personal.subtitle', language)}</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input 
            type="text" 
            placeholder={getTranslation('application.personal.quickLookup', language)} 
            style={{ 
              padding: '0.6rem 1rem 0.6rem 2.5rem', 
              background: 'rgba(255,255,255,0.03)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '20px',
              color: '#fff',
              fontSize: '0.85rem',
              width: '100%'
            }} 
          />
        </div>
      </div>

      <div 
        className="grid-2"
        style={{
          marginTop: '1.5rem'
        }}
      >
        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.fullName', language)}</label>
          <input type="text" name="fullName" value={data.fullName || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.fullNamePlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.nic', language)}</label>
          <input type="text" name="nic" value={data.nic || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.nicPlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.dob', language)}</label>
          <input type="date" name="dob" value={data.dob || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.gender', language)}</label>
          <select name="gender" value={data.gender || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.personal.selectGender', language)}</option>
            <option value="male">{getTranslation('application.personal.male', language)}</option>
            <option value="female">{getTranslation('application.personal.female', language)}</option>
            <option value="other">{getTranslation('application.personal.other', language)}</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.phone', language)}</label>
          <input type="text" name="phone" value={data.phone || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.phonePlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.whatsapp', language)}</label>
          <input type="text" name="whatsapp" value={data.whatsapp || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.phonePlaceholder', language)} />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{getTranslation('application.personal.address', language)}</label>
          <textarea name="address" value={data.address || ''} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder={getTranslation('application.personal.addressPlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.district', language)}</label>
          <select name="district" value={data.district || 'Badulla'} onChange={handleChange} style={inputStyle}>
            <option value="Badulla">Badulla</option>
            <option value="Monaragala">Monaragala</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.dsDivision', language)}</label>
          <select name="dsDivision" value={data.dsDivision || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.personal.selectDsDivision', language)}</option>
            {dsDivisionsForDistrict.map(ds => (
              <option key={ds} value={ds}>{ds}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.gsDivision', language)}</label>
          <select name="gsDivision" value={data.gsDivision || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.personal.selectGsDivision', language)}</option>
            {gsDivisions.map(gs => (
              <option key={gs} value={gs}>{gs}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.maritalStatus', language)}</label>
          <select name="maritalStatus" value={data.maritalStatus || ''} onChange={handleChange} style={inputStyle}>
            <option value="">{getTranslation('application.personal.selectStatus', language)}</option>
            <option value="single">{getTranslation('application.personal.single', language)}</option>
            <option value="married">{getTranslation('application.personal.married', language)}</option>
            <option value="widowed">{getTranslation('application.personal.widowed', language)}</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.specialConsiderations', language)}</label>
          <select name="specialConsideration" value={data.specialConsideration || 'none'} onChange={handleChange} style={inputStyle}>
            <option value="none">{getTranslation('application.personal.none', language)}</option>
            <option value="disabled">{getTranslation('application.personal.disabled', language)}</option>
            <option value="widow">{getTranslation('application.personal.widow', language)}</option>
          </select>
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.personal.dependants', language)}</label>
          <input type="number" name="dependants" value={data.dependants || ''} onChange={handleChange} style={inputStyle} />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{getTranslation('application.personal.govService', language)}</label>
          <select name="govService" value={data.govService || 'no'} onChange={handleChange} style={inputStyle}>
            <option value="no">{getTranslation('application.personal.no', language)}</option>
            <option value="yes">{getTranslation('application.personal.yes', language)}</option>
          </select>
        </div>

        {data.govService === 'yes' && (
          <>
            <div className="form-group">
              <label style={labelStyle}>{getTranslation('application.personal.institutionName', language)}</label>
              <input type="text" name="govInstitution" value={data.govInstitution || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.institutionPlaceholder', language)} />
            </div>
            <div className="form-group">
              <label style={labelStyle}>{getTranslation('application.personal.positionHeld', language)}</label>
              <input type="text" name="govPosition" value={data.govPosition || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.personal.positionPlaceholder', language)} />
            </div>
          </>
        )}
      </div>

      <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <button 
          onClick={onNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.8rem',
            padding: '1rem 2rem',
            background: 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
            width: window.innerWidth < 768 ? '100%' : 'auto'
          }}
        >
          {getTranslation('application.personal.next', language)}
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
  boxSizing: 'border-box',
  transition: 'border-color 0.2s'
};

export default PersonalDetailsForm;
