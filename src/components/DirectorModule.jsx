import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { FileText, CheckCircle, XCircle, Eye, Search, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function DirectorModule() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDirectorQueue();
  }, []);

  const fetchDirectorQueue = async () => {
    setLoading(true);
    try {
      // Director sees all applications recommended by DS
      const q = query(
        collection(db, 'applications'),
        where('status', '==', 'pending_director')
      );

      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setApplications(docs);
    } catch (error) {
      console.error("Error fetching Director apps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (appId, newStatus) => {
    const reason = newStatus === 'rejected' ? window.prompt('Enter reason for final rejection:') : null;
    if (newStatus === 'rejected' && reason === null) return;

    try {
      const appRef = doc(db, 'applications', appId);
      const finalStatus = newStatus === 'approved' ? 'approved_by_director' : newStatus;
      await updateDoc(appRef, {
        status: finalStatus,
        directorReview: {
          reviewedBy: auth.currentUser.email,
          reviewedAt: serverTimestamp(),
          comments: reason
        },
        lastUpdated: serverTimestamp()
      });

      alert(`Application ${newStatus === 'approved' ? 'sent to Admin for final dispatch' : 'Rejected'}!`);
      setSelectedApp(null);
      fetchDirectorQueue();
    } catch (error) {
      alert('Error updating status: ' + error.message);
    }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><p>Loading Director's Queue...</p></div>;

  const filteredApps = applications.filter(app => 
    app.personal?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.personal?.nic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ 
        marginBottom: '2rem', 
        display: 'flex', 
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{ flex: '1', minWidth: '250px' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', margin: 0, color: '#fff' }}>Final Approval Panel</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.5rem' }}>Reviewing applications recommended by Divisional Secretaries.</p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: window.innerWidth < 768 ? '100%' : '350px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input 
            type="text" 
            placeholder="Search applicants..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...searchStyle, width: '100%' }}
          />
        </div>
      </div>

      <div className="grid-2">
        {filteredApps.map(app => (
          <div key={app.id} className="glass" style={{ padding: '1.5rem', cursor: 'pointer', border: '1px solid rgba(16, 185, 129, 0.1)' }} onClick={() => setSelectedApp(app)}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
               <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                 <div style={{ padding: '0.6rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px' }}>
                   <ShieldCheck color="#10b981" size={24} />
                 </div>
                 <div>
                   <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>{app.personal?.fullName}</h3>
                   <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended by DS</span>
                 </div>
               </div>
               <div style={{ textAlign: 'right', marginLeft: 'auto' }}>
                 <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>{app.score || 0}</div>
                 <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>TOTAL SCORE</div>
               </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ margin: '0 0 0.5rem', fontSize: '0.85rem' }}><strong>Business:</strong> {app.business?.businessName}</p>
                <p style={{ margin: 0, fontSize: '0.85rem' }}><strong>Grant:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>LKR {(app.equipment?.totalGrant || 0).toLocaleString()}</span></p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction(app.id, 'approved'); }}
                style={{ flexGrow: 2, padding: '0.8rem', background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', minWidth: '180px', fontSize: '0.9rem' }}
              >
                <CheckCircle size={18} /> APPROVE
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleAction(app.id, 'rejected'); }}
                style={{ flexGrow: 1, padding: '0.8rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: '8px', color: '#f43f5e', fontWeight: 600, cursor: 'pointer', minWidth: '80px', fontSize: '0.9rem' }}
              >
                REJECT
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredApps.length === 0 && (
        <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <Clock size={48} style={{ marginBottom: '1rem', opacity: 0.1 }} />
          <h3 style={{ fontSize: '1.2rem' }}>No applications awaiting final approval</h3>
          <p style={{ fontSize: '0.9rem' }}>Everything is up to date.</p>
        </div>
      )}

      {/* Detail Modal */}
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
                 borderRadius: '20px',
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
                    <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>Final Director Review</h2>
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
                    CLOSE
                  </button>
               </div>

               <div className="grid-2">
                  <div>
                    <Section title="Applicant Credentials">
                      <p><strong>Name:</strong> {selectedApp.personal?.fullName}</p>
                      <p><strong>NIC:</strong> {selectedApp.personal?.nic}</p>
                      <p><strong>Division:</strong> {selectedApp.officer?.email?.split('@')[0]}</p>
                    </Section>

                    <Section title="Financial Proposal">
                      <p><strong>Business Sector:</strong> {selectedApp.business?.sector}</p>
                      <p><strong>Est. Income:</strong> LKR {(selectedApp.production?.estimatedIncome || 0).toLocaleString()}</p>
                      <p><strong>Support Ratio:</strong> 50% Matching Grant</p>
                    </Section>

                    <div style={{ marginTop: '1.5rem', padding: '1.2rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.1)', marginBottom: '2rem' }}>
                      <h4 style={{ margin: '0 0 0.8rem', fontSize: '0.75rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 700 }}>DS Recommendation</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.6' }}>{selectedApp.dsReview?.comments || "Recommended for approval based on eligibility scoring."}</p>
                      <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>Reviewed by: {selectedApp.dsReview?.reviewedBy}</p>
                    </div>
                  </div>

                  <div>
                    <Section title="Detailed Score Breakdown">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px' }}>
                        {selectedApp.scoreBreakdown ? (
                          <>
                            <ScoreRow label="Business Stability & Growth" value={selectedApp.scoreBreakdown.businessStability || 0} max={25} />
                            <ScoreRow label="Professional Competency" value={selectedApp.scoreBreakdown.professionalCompetency || 0} max={25} />
                            <ScoreRow label="Household & Social Status" value={selectedApp.scoreBreakdown.householdStatus || 0} max={15} />
                            <ScoreRow label="Economic Contribution" value={selectedApp.scoreBreakdown.economicContribution || 0} max={25} />
                            <ScoreRow label="Special Awards & Recognition" value={selectedApp.scoreBreakdown.specialAwards || 0} max={10} />
                          </>
                        ) : (
                          <>
                            <ScoreRow label="Education & NVQ" value={selectedApp.score > 20 ? 25 : 15} />
                            <ScoreRow label="Business Viability" value={15} />
                            <ScoreRow label="Asset Commitment" value={10} />
                          </>
                        )}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                          <span>FINAL ELIGIBILITY:</span>
                          <span style={{ color: '#10b981' }}>{selectedApp.score || 0} Points</span>
                        </div>
                      </div>
                    </Section>

                    <Section title="Equipment for Procurement">
                       <div style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                          {(selectedApp.equipment?.items || []).map((item, idx) => (
                            <div key={idx} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', marginBottom: '0.6rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                              <p style={{ margin: 0, fontSize: '0.9rem' }}><strong>{item.name}</strong></p>
                              <p style={{ margin: '0.1rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>Cost: LKR {(item.qty * item.unitPrice).toLocaleString()}</p>
                            </div>
                          ))}
                       </div>
                       <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', textAlign: 'right', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                         <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981' }}>TOTAL GRANT PAYABLE:</span>
                         <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>LKR {(selectedApp.equipment?.totalGrant || 0).toLocaleString()}</div>
                       </div>
                    </Section>
                  </div>
               </div>

               <div style={{ 
                 marginTop: '3rem', 
                 paddingTop: '2rem', 
                 borderTop: '1px solid rgba(255,255,255,0.05)', 
                 display: 'flex', 
                 flexWrap: 'wrap', 
                 gap: '1rem' 
               }}>
                  <button 
                    onClick={() => handleAction(selectedApp.id, 'approved')}
                    style={{ flexGrow: 2, padding: '1.2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', minWidth: '240px' }}
                  >
                    CONFIRM & SIGN APPROVAL
                  </button>
                  <button 
                    onClick={() => handleAction(selectedApp.id, 'rejected')}
                    style={{ flexGrow: 1, padding: '1.2rem', background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', border: '1px solid #f43f5e', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem', minWidth: '120px' }}
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

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h4 style={{ margin: '0 0 1rem', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{title}</h4>
      <div style={{ fontSize: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {children}
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
      <span style={{ opacity: 0.7 }}>{label}</span>
      <span>{value}{max ? ` / ${max}` : ''} pts</span>
    </div>
  );
}

const searchStyle = {
  padding: '0.8rem 1.2rem 0.8rem 3rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  width: '350px',
  outline: 'none',
  fontSize: '0.9rem'
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '2rem'
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '1200px',
  maxHeight: '95vh',
  overflowY: 'auto',
  padding: '4rem',
  background: '#0c111d',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '24px'
};

export default DirectorModule;
