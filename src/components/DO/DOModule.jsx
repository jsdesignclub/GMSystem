import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Briefcase, GraduationCap, Factory, PenTool, History, CheckCircle2, Send, Loader2 } from 'lucide-react';
import PersonalDetailsForm from './PersonalDetailsForm';
import BusinessDetailsForm from './BusinessDetailsForm';
import TrainingForm from './TrainingForm';
import ProductionForm from './ProductionForm';
import EquipmentForm from './EquipmentForm';
import { db, auth, storage } from '../../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { calculateScore as computeAutomatedScore } from '../../utils/calculateScore';
import { useAuth } from '../../context/AuthContext';
import { getTranslation } from '../../i18n';

function DOModule({ initialData, onComplete, language = 'en' }) {
  const steps = [
    { id: 'personal', title: getTranslation('application.steps.personal', language), icon: <User size={20} /> },
    { id: 'business', title: getTranslation('application.steps.business', language), icon: <Briefcase size={20} /> },
    { id: 'training', title: getTranslation('application.steps.training', language), icon: <GraduationCap size={20} /> },
    { id: 'production', title: getTranslation('application.steps.production', language), icon: <Factory size={20} /> },
    { id: 'equipment', title: getTranslation('application.steps.equipment', language), icon: <PenTool size={20} /> },
    { id: 'history', title: getTranslation('application.steps.history', language), icon: <History size={20} /> }
  ];
  const { userDivision } = useAuth();
  const [activeStep, setActiveStep] = useState('personal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [formData, setFormData] = useState(initialData || {
    personal: {},
    business: {},
    training: {},
    production: {},
    equipment: {},
    history: {},
    comment: ''
  });

  // Auto-populate DS Division and District based on user's assigned division
  React.useEffect(() => {
    if (!initialData && userDivision && !formData.personal.dsDivision) {
      const badullaDivs = [
        'Badulla', 'Bandarawela', 'Ella', 'Haldummulla', 'Hali-Ela', 
        'Haputale', 'Kandaketiya', 'Lunugala', 'Mahiyanganaya', 
        'Meegahakivula', 'Passara', 'Rideemaliyadda', 'Soranathota', 
        'Uva Paranagama', 'Welimada'
      ];
      const monaragalaDivs = [
        'Badalkumbura', 'Bibile', 'Buttala', 'Kataragama', 'Madulla', 
        'Medagama', 'Moneragala', 'Sevanagala', 'Siyambalanduwa', 
        'Thanamalwila', 'Wellawaya'
      ];
      
      let detectedDistrict = '';
      if (badullaDivs.includes(userDivision)) {
        detectedDistrict = 'Badulla';
      } else if (monaragalaDivs.includes(userDivision)) {
        detectedDistrict = 'Monaragala';
      }

      if (detectedDistrict) {
        setFormData(prev => ({
          ...prev,
          personal: {
            ...prev.personal,
            dsDivision: userDivision,
            district: detectedDistrict
          }
        }));
      }
    }
  }, [userDivision, initialData]);

  const updateFormData = (step, data) => {
    setFormData(prev => ({
      ...prev,
      [step]: data
    }));
  };

  const uploadQuotationToStorage = (file, itemId) => {
    return new Promise((resolve, reject) => {
      if (!auth.currentUser) return reject(new Error('Not authenticated.'));
      const safeName = (file.name || 'quotation').replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `quotations/${auth.currentUser.uid}/${Date.now()}_${itemId}_${safeName}`;
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        () => {},
        reject,
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  const calculateScore = (data) => {
    if (!data.personal || !data.business || !data.training || !data.production) {
      return { totalScore: 0, breakdown: {} };
    }
    return computeAutomatedScore(data);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      alert("You must be logged in to submit an application.");
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('Initializing...');

    try {
      const updatedItems = [];
      const items = formData.equipment.items || [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.quotationFile instanceof File) {
          setSubmissionStatus(`Uploading ${item.name} quotation...`);
          try {
            const url = await uploadQuotationToStorage(item.quotationFile, item.id);
            updatedItems.push({ 
              ...item, 
              quotationUrl: url,
              quotationData: null,
              quotationFile: null
            });
          } catch (err) {
            console.error("Upload error:", err);
            throw new Error(`Failed to upload the quotation for ${item.name}. Please try again or use a smaller file.`);
          }
        } else {
          updatedItems.push({ ...item, quotationFile: null });
        }
      }

      setSubmissionStatus('Calculating score...');
      const { totalScore, breakdown } = calculateScore(formData);
      
      let policy = { percentage: 50, maxAmount: 100000 };
      try {
        const policySnap = await getDoc(doc(db, 'settings', 'grant_policy'));
        if (policySnap.exists()) policy = policySnap.data();
      } catch (err) {}

      setSubmissionStatus('Finalizing...');

      let initialStatus = 'pending_ds';
      try {
        const flowSnap = await getDoc(doc(db, 'settings', 'approval_flow'));
        if (flowSnap.exists()) {
          const flow = flowSnap.data();
          if (flow.skipDsReview && flow.skipDirectorReview) {
            initialStatus = 'approved_by_director';
          } else if (flow.skipDsReview) {
            initialStatus = 'pending_director';
          }
        }
      } catch (err) {}

      const sanitizedData = JSON.parse(JSON.stringify({
        ...formData,
        equipment: {
          ...formData.equipment,
          items: updatedItems,
          totalGrant: Math.min((updatedItems).reduce((sum, i) => sum + (Number(i.qty) * Number(i.unitPrice)), 0) * (policy.percentage / 100), policy.maxAmount)
        }
      }));

      const finalSubmission = {
        ...sanitizedData,
        score: totalScore,
        scoreBreakdown: breakdown,
        status: initialStatus,
        division: userDivision || 'General',
        officer: {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email
        },
        dsReview: null,
        comment: (formData.comment || '').trim(),
        lastUpdated: serverTimestamp(),
        createdAt: initialData ? (initialData.createdAt || serverTimestamp()) : serverTimestamp()
      };

      if (!initialData) {
        await addDoc(collection(db, 'applications'), finalSubmission);
      } else {
        await updateDoc(doc(db, 'applications', initialData.id), finalSubmission);
      }

      // Add to global sectors if new
      if (formData.business.isNewSector && formData.business.sector) {
        try {
          await addDoc(collection(db, 'settings_sectors'), {
            name: formData.business.sector,
            addedBy: auth.currentUser.email,
            createdAt: serverTimestamp()
          });
        } catch (e) {}
      }
      
      alert('Application submitted successfully!');
      window.location.reload(); 
    } catch (error) {
      console.error("Detailed Submission Error:", error);
      alert('Submission Failed: ' + error.message);
    } finally {
      setIsSubmitting(false);
      setSubmissionStatus('');
    }
  };

  const renderStep = () => {
    switch (activeStep) {
      case 'personal':
        return <PersonalDetailsForm data={formData.personal} onUpdate={(data) => updateFormData('personal', data)} onNext={() => setActiveStep('business')} language={language} />;
      case 'business':
        return <BusinessDetailsForm data={formData.business} onUpdate={(data) => updateFormData('business', data)} onPrev={() => setActiveStep('personal')} onNext={() => setActiveStep('training')} language={language} />;
      case 'training':
        return <TrainingForm data={formData.training} onUpdate={(data) => updateFormData('training', data)} onPrev={() => setActiveStep('business')} onNext={() => setActiveStep('production')} language={language} />;
      case 'production':
        return <ProductionForm data={formData.production} onUpdate={(data) => updateFormData('production', data)} onPrev={() => setActiveStep('training')} onNext={() => setActiveStep('equipment')} language={language} />;
      case 'equipment':
        return <EquipmentForm data={formData.equipment} onUpdate={(data) => updateFormData('equipment', data)} onPrev={() => setActiveStep('production')} onNext={() => setActiveStep('history')} language={language} />;
      case 'history':
        return (
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: 'clamp(1.4rem, 5vw, 1.8rem)', marginBottom: '1rem' }}>{getTranslation('application.review.title', language)}</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>{getTranslation('application.review.description', language)}</p>
            
            <div className="glass" style={{ padding: '1.5rem', marginBottom: '2.5rem', border: '1px dashed rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#10b981' }}>
                <CheckCircle2 size={32} style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{getTranslation('application.review.readyTitle', language)}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8 }}>{getTranslation('application.review.readyDescription', language)}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.5rem' }}>
                {getTranslation('application.review.commentLabel', language)}
              </label>
              <textarea
                value={formData.comment || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                placeholder={getTranslation('application.review.commentPlaceholder', language)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(0,0,0,0.2)',
                  color: '#e2e8f0',
                  fontSize: '0.95rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none'
                }}
              />
            </div>

            <button 
              style={{
                width: '100%',
                padding: '1.2rem',
                background: isSubmitting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: 'clamp(1rem, 4vw, 1.2rem)',
                fontWeight: 700,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)',
                marginBottom: '2rem'
              }}
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  <span style={{ fontSize: '0.9rem' }}>{submissionStatus}</span>
                </>
              ) : (
                <>
                  <Send size={24} />
                  {getTranslation('application.review.submit', language)}
                </>
              )}
            </button>
          </div>
        );
      default:
        return (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <p>Module section "{activeStep}" implementation in progress...</p>
          </div>
        );
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Mobile Step Navigation */}
      <div className="mobile-only steps-container" style={{ marginBottom: '1.5rem', padding: '0.5rem' }}>
        {steps.map(step => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '20px',
              background: activeStep === step.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
              color: activeStep === step.id ? '#3b82f6' : '#94a3b8',
              border: `1px solid ${activeStep === step.id ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
              fontSize: '0.85rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {step.icon}
            {step.title}
          </button>
        ))}
      </div>

      <div className="do-container" style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
        {/* Sidebar Navigation - only visible on desktop/tablet usually */}
        <aside 
          className="desktop-only"
          style={{ width: '280px', flexShrink: 0 }}
        >
          <div className="glass" style={{ padding: '1rem', position: 'sticky', top: '2rem' }}>
            <h3 style={{ padding: '0 1rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{getTranslation('application.steps.title', language)}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {steps.map(step => (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(step.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.8rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: activeStep === step.id ? 'rgba(46, 117, 182, 0.15)' : 'transparent',
                    color: activeStep === step.id ? '#3b82f6' : '#94a3b8',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    fontWeight: activeStep === step.id ? 600 : 400
                  }}
                >
                  <span style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: activeStep === step.id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                    color: activeStep === step.id ? '#3b82f6' : '#475569'
                  }}>
                    {step.icon}
                  </span>
                  {step.title}
                  {formData[step.id] && Object.keys(formData[step.id]).length > 0 && (
                    <CheckCircle2 size={16} style={{ marginLeft: 'auto', color: '#10b981' }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Form Area */}
        <main style={{ flexGrow: 1 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
              className="glass"
              style={{ padding: '2.5rem', minHeight: '600px' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export default DOModule;
