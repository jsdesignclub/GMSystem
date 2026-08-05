import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getTranslation } from '../../i18n';

function ProductionForm({ data, onUpdate, onPrev, onNext, language = 'en' }) {
  const handleChange = (e) => {
    onUpdate({ ...data, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>{getTranslation('application.production.title', language)}</h2>
        <p style={{ color: '#64748b', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{getTranslation('application.production.subtitle', language)}</p>
      </div>

      <div className="grid-2">
        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{getTranslation('application.production.products', language)}</label>
          <input type="text" name="products" value={data.products || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.production.productsPlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.production.productionCost', language)}</label>
          <input type="number" name="productionCost" value={data.productionCost || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.production.productionCostPlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.production.estimatedIncome', language)}</label>
          <input type="number" name="estimatedIncome" value={data.estimatedIncome || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.production.estimatedIncomePlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.production.assetValue', language)}</label>
          <input type="number" name="assetValue" value={data.assetValue || ''} onChange={handleChange} style={inputStyle} placeholder={getTranslation('application.production.assetValuePlaceholder', language)} />
        </div>

        <div className="form-group">
          <label style={labelStyle}>{getTranslation('application.production.qualityCert', language)}</label>
          <select name="hasQualityCert" value={data.hasQualityCert || 'no'} onChange={handleChange} style={inputStyle}>
            <option value="no">{getTranslation('application.production.noCert', language)}</option>
            <option value="yes">{getTranslation('application.production.yesCert', language)}</option>
          </select>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>{getTranslation('application.production.qualitySteps', language)}</label>
          <textarea name="qualitySteps" value={data.qualitySteps || ''} onChange={handleChange} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} placeholder={getTranslation('application.production.qualityStepsPlaceholder', language)} />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label style={{ ...labelStyle, color: '#10b981' }}>{getTranslation('application.production.netProfit', language)}</label>
          <div style={{
            ...inputStyle,
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            color: '#10b981',
            fontWeight: 700,
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            LKR {((Number(data.estimatedIncome) || 0) - (Number(data.productionCost) || 0)).toLocaleString()}
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>{getTranslation('application.production.netProfitHint', language)}</p>
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
          {getTranslation('application.production.next', language)} <ArrowRight size={18} />
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

export default ProductionForm;
