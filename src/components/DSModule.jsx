import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { FileText, CheckCircle, XCircle, Eye, Search, AlertCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../context/AuthContext';

function DSModule() {
  const { userDivision } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingApplications();
  }, [userDivision]);

  const fetchPendingApplications = async () => {
    if (!userDivision) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      // DS sees all pending applications for their division
      const q = query(
        collection(db, 'applications'),
        where('status', '==', 'pending_ds'),
        where('division', '==', userDivision)
      );

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(docs);
    } catch (error) {
      console.error("Error fetching DS apps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appId, newStatus) => {
    const reason = newStatus === 'rejected' ? window.prompt('Enter reason for rejection:') : null;
    if (newStatus === 'rejected' && reason === null) return;

    try {
      let nextStatus = newStatus === 'approved' ? 'pending_director' : newStatus;
      if (newStatus === 'approved') {
        try {
          const flowSnap = await getDoc(doc(db, 'settings', 'approval_flow'));
          if (flowSnap.exists() && flowSnap.data().skipDirectorReview) {
            nextStatus = 'approved_by_director';
          }
        } catch (err) {}
      }

      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, {
        status: nextStatus,
        dsReview: {
          reviewedBy: auth.currentUser.email,
          reviewedAt: serverTimestamp(),
          comments: reason
        },
        lastUpdated: serverTimestamp()
      });

      alert(`Application ${newStatus === 'approved' ? (nextStatus === 'approved_by_director' ? 'Forwarded to Admin' : 'Forwarded to Director') : 'Rejected'} successfully!`);
      setSelectedApp(null);
      fetchPendingApplications();
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><p>Loading pending reviews...</p></div>;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', margin: 0 }}>Approval Queue</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>Review and action applications submitted by Development Officers.</p>
      </div>

      <div className="grid-2">
        {applications.map(app => (
          <div key={app.id} className="glass" style={{ padding: '1.2rem', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setSelectedApp(app)}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
                  <FileText color="#3b82f6" size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#fff' }}>{app.personal?.fullName}</h4>
                  <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>NIC: {app.personal?.nic}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 800, color: app.score > 30 ? '#10b981' : '#3b82f6' }}>{app.score || 0} pts</span>
              </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1.2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
               <p style={{ margin: 0, fontSize: '0.8rem', color: '#cbd5e1' }}><strong>Business:</strong> {app.business?.businessName}</p>
               <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#10b981' }}><strong>Grant:</strong> LKR {(app.equipment?.totalGrant || 0).toLocaleString()}</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction(app.id, 'approved'); }}
                style={{ flexGrow: 1, padding: '0.8rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
              >
                <CheckCircle size={16} /> Forward
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction(app.id, 'rejected'); }}
                style={{ flexGrow: 1, padding: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '8px', color: '#f43f5e', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
              >
                <XCircle size={16} /> Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {applications.length === 0 && (
        <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <p>No pending applications in your queue.</p>
        </div>
      )}

      {/* Detailed Review Modal (Reusing/Extending View Logic) */}
      <AnimatePresence>
        {selectedApp && (
          <div style={{
            ...modalOverlayStyle,
            padding: window.innerWidth < 768 ? '1rem' : '2rem'
          }} onClick={() => setSelectedApp(null)}>
             <motion.div 
               className="glass-card" 
               style={{ 
                 ...modalContentStyle, 
                 padding: 0,
                 borderRadius: '16px',
                 overflow: 'hidden'
               }} 
               onClick={e => e.stopPropagation()}
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
             >
                <div style={{ padding: window.innerWidth < 768 ? '1.5rem' : '3rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>Full Review</h2>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>App ID: {selectedApp.id.substring(0, 8)}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedApp(null)} 
                    style={{ 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.1)', 
                      color: '#94a3b8', 
                      cursor: 'pointer',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}>
                    Close
                  </button>
                </div>
                
                <div className="grid-2">
                  {/* Left Column */}
                  <div>
                    <h5 style={sectionHeaderStyle}>Applicant Identity</h5>
                    <div style={infoGridStyle}>
                      <p><strong>Full Name:</strong> {selectedApp.personal?.fullName}</p>
                      <p><strong>NIC:</strong> {selectedApp.personal?.nic}</p>
                      <p><strong>Address:</strong> {selectedApp.personal?.address}</p>
                    </div>

                    <h5 style={sectionHeaderStyle}>Business Validity</h5>
                    <div style={infoGridStyle}>
                      <p><strong>Sector:</strong> {selectedApp.business?.sector}</p>
                      <p><strong>Est. Income:</strong> LKR {(selectedApp.production?.estimatedIncome || 0).toLocaleString()}</p>
                      <p><strong>Production Cost:</strong> LKR {(selectedApp.production?.productionCost || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div>
                    <h5 style={sectionHeaderStyle}>Scoring Breakdown</h5>
                    <div style={{ padding: '1.2rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', marginBottom: '2rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                         <span style={{ fontSize: '0.9rem' }}>Eligibility Score:</span>
                         <span style={{ fontWeight: 800, color: '#3b82f6' }}>{selectedApp.score || 0} Points</span>
                       </div>
                       {selectedApp.scoreBreakdown && (
                         <div style={{ margin: '0.6rem 0', padding: '0.6rem 0', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span>Business Stability:</span>
                             <strong>{selectedApp.scoreBreakdown.businessStability || 0} / 25</strong>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span>Competency:</span>
                             <strong>{selectedApp.scoreBreakdown.professionalCompetency || 0} / 25</strong>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span>Household Status:</span>
                             <strong>{selectedApp.scoreBreakdown.householdStatus || 0} / 15</strong>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span>Contribution:</span>
                             <strong>{selectedApp.scoreBreakdown.economicContribution || 0} / 25</strong>
                           </div>
                           <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                             <span>Awards:</span>
                             <strong>{selectedApp.scoreBreakdown.specialAwards || 0} / 10</strong>
                           </div>
                         </div>
                       )}
                       <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: selectedApp.scoreBreakdown ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingTop: selectedApp.scoreBreakdown ? '0.6rem' : 0 }}>
                         <span style={{ fontSize: '0.9rem' }}>Grant Amount:</span>
                         <span style={{ fontWeight: 800, color: '#10b981' }}>LKR {(selectedApp.equipment?.totalGrant || 0).toLocaleString()}</span>
                       </div>
                    </div>

                    <h5 style={sectionHeaderStyle}>Required Equipment</h5>
                    <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem' }}>
                      {(selectedApp.equipment?.items || []).map((item, idx) => (
                        <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', marginBottom: '0.8rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>{item.name}</strong></p>
                          <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>{item.qty} units @ LKR {item.unitPrice.toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div style={{ 
                  marginTop: '2.5rem', 
                  paddingTop: '2rem', 
                  borderTop: '1px solid rgba(255,255,255,0.05)', 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '1rem' 
                }}>
                  <button 
                    onClick={() => handleAction(selectedApp.id, 'approved')}
                    style={{ flexGrow: 2, padding: '1.2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', minWidth: '220px' }}
                  >
                    APPROVE & FORWARD
                  </button>
                  <button 
                    onClick={() => handleAction(selectedApp.id, 'rejected')}
                    style={{ flexGrow: 1, padding: '1.2rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', borderRadius: '12px', color: '#f43f5e', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', minWidth: '150px' }}
                  >
                    REJECT
                  </button>
                </div>
              </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '960px',
  maxHeight: '92vh',
  overflowY: 'auto',
  background: '#0c111d',
  border: '1px solid rgba(255,255,255,0.08)'
};


const sectionHeaderStyle = {
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  color: '#64748b',
  marginBottom: '1rem'
};

const infoGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '2rem',
  fontSize: '0.9rem'
};

export default DSModule;
