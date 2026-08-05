import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Plus, Trash2, Upload, FileCheck, Info, Loader2 } from 'lucide-react';
import { db } from '../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getTranslation } from '../../i18n';

function EquipmentForm({ data, onUpdate, onPrev, onNext, language = 'en' }) {
  const [items, setItems] = useState(data.items || [{ id: Date.now(), name: '', brand: '', model: '', qty: 1, unitPrice: 0, quotationFile: null }]);
  const [policy, setPolicy] = useState({ percentage: 50, maxAmount: 100000 });
  const [loadingPolicy, setLoadingPolicy] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'grant_policy'));
        if (docSnap.exists()) {
          setPolicy(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching policy:", err);
      } finally {
        setLoadingPolicy(false);
      }
    };
    fetchPolicy();
  }, []);

  const updateItems = (newItems) => {
    setItems(newItems);
    onUpdate({ ...data, items: newItems });
  };

  const addItem = () => {
    updateItems([...items, { id: Date.now(), name: '', brand: '', model: '', qty: 1, unitPrice: 0, quotationFile: null }]);
  };

  const removeItem = (id) => {
    if (items.length > 1) {
      updateItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id, field, value) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    updateItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  };

  const calculateGrant = () => {
    const total = calculateTotal();
    const grant = total * (policy.percentage / 100);
    return Math.min(grant, policy.maxAmount);
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>{getTranslation('application.equipment.title', language)}</h2>
        <p style={{ color: '#64748b', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>{getTranslation('application.equipment.subtitle', language)}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {items.map((item, index) => (
          <div key={item.id} className="glass" style={{ 
            padding: '1.5rem', 
            background: 'rgba(255,255,255,0.01)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div className="grid-2">
              <div className="form-group">
                <label style={labelStyle}>{getTranslation('application.equipment.equipmentName', language)}</label>
                <input 
                  type="text" 
                  value={item.name} 
                  onChange={(e) => handleItemChange(item.id, 'name', e.target.value)} 
                  style={inputStyle} 
                  placeholder={getTranslation('application.equipment.equipmentNamePlaceholder', language)} 
                />
              </div>
              <div className="form-group">
                <label style={labelStyle}>{getTranslation('application.equipment.brandName', language)}</label>
                <input 
                  type="text" 
                  value={item.brand} 
                  onChange={(e) => handleItemChange(item.id, 'brand', e.target.value)} 
                  style={inputStyle} 
                  placeholder={getTranslation('application.equipment.brandNamePlaceholder', language)} 
                />
              </div>
              <div className="form-group">
                <label style={labelStyle}>{getTranslation('application.equipment.modelNumber', language)}</label>
                <input 
                  type="text" 
                  value={item.model} 
                  onChange={(e) => handleItemChange(item.id, 'model', e.target.value)} 
                  style={inputStyle} 
                  placeholder={getTranslation('application.equipment.modelPlaceholder', language)} 
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem', alignItems: 'end' }}>
              <div className="form-group">
                <label style={labelStyle}>{getTranslation('application.equipment.qty', language)}</label>
                <input 
                  type="number" 
                  value={item.qty} 
                  onChange={(e) => handleItemChange(item.id, 'qty', parseInt(e.target.value) || 0)} 
                  style={inputStyle} 
                />
              </div>
              <div className="form-group">
                <label style={labelStyle}>{getTranslation('application.equipment.unitPrice', language)}</label>
                <input 
                  type="number" 
                  value={item.unitPrice} 
                  onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} 
                  style={inputStyle} 
                />
              </div>
              
              <div className="form-group">
                <label style={labelStyle}>{getTranslation('application.equipment.quotationUpload', language)}</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="file" 
                    onChange={(e) => handleItemChange(item.id, 'quotationFile', e.target.files[0])}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                  />
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.8rem',
                    background: item.quotationFile ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                    border: item.quotationFile ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: item.quotationFile ? '#10b981' : '#64748b',
                    fontSize: '0.85rem'
                  }}>
                    {item.quotationFile ? <FileCheck size={16} /> : <Upload size={16} />}
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.quotationFile ? item.quotationFile.name : getTranslation('application.equipment.quotation', language)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label style={labelStyle}>{getTranslation('application.equipment.subtotal', language)}</label>
                <div style={{ 
                  padding: '0.8rem', 
                  background: 'rgba(59, 130, 246, 0.1)', 
                  borderRadius: '8px', 
                  color: '#3b82f6', 
                  fontWeight: 600,
                  textAlign: 'right'
                }}>
                  LKR {(item.qty * item.unitPrice).toLocaleString()}
                </div>
              </div>

              <button 
                onClick={() => removeItem(item.id)}
                style={{ 
                  background: 'rgba(244, 63, 94, 0.1)', 
                  border: 'none', 
                  color: '#f43f5e', 
                  cursor: 'pointer',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '48px'
                }}
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={addItem}
        style={{
          marginTop: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.8rem 1.5rem',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '10px',
          color: '#10b981',
          fontWeight: 700,
          cursor: 'pointer',
          width: window.innerWidth < 768 ? '100%' : 'auto',
          justifyContent: 'center'
        }}
      >
        <Plus size={18} /> {getTranslation('application.equipment.addNewEquipment', language)}
      </button>

      <div className="glass" style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column',
        gap: '1.5rem',
        background: 'rgba(59, 130, 246, 0.05)'
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '1.5rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'left', minWidth: '150px', flex: '1' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>{getTranslation('application.equipment.totalProjectValue', language)}</p>
            <h3 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: '#fff' }}>LKR {calculateTotal().toLocaleString()}</h3>
          </div>
          <div style={{ textAlign: 'left', minWidth: '150px', flex: '1' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>{getTranslation('application.equipment.deptGrant', language)} ({policy.percentage}%)</p>
            <h3 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: '#10b981' }}>
              {loadingPolicy ? <Loader2 className="animate-spin" size={20} /> : `LKR ${calculateGrant().toLocaleString()}`}
            </h3>
          </div>
          <div style={{ textAlign: 'left', minWidth: '150px', flex: '1' }}>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>{getTranslation('application.equipment.applicantShare', language)}</p>
            <h3 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.8rem)', color: '#3b82f6' }}>
              {loadingPolicy ? '...' : `LKR ${(calculateTotal() - calculateGrant()).toLocaleString()}`}
            </h3>
          </div>
        </div>
        
        {calculateTotal() * (policy.percentage / 100) > policy.maxAmount && (
          <div style={{ padding: '0.8rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <Info size={18} color="#f59e0b" />
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#f59e0b' }}>{getTranslation('application.equipment.maxGrantReached', language)}</p>
          </div>
        )}
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
          <ArrowLeft size={18} /> {getTranslation('application.equipment.back', language)}
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
          {getTranslation('application.equipment.next', language)} <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  marginBottom: '0.8rem',
  fontSize: '0.7rem',
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const inputStyle = {
  width: '100%',
  padding: '0.8rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '0.9rem',
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

export default EquipmentForm;
