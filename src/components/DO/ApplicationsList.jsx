import React, { useEffect, useState } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, where, getDocs, orderBy, updateDoc, doc, serverTimestamp, deleteDoc, getDoc } from 'firebase/firestore';
import { FileText, Clock, CheckCircle, AlertCircle, Eye, Search, Filter, Trash2, Edit3, X, Download, User as UserIcon, Briefcase, GraduationCap, Factory, PenTool, XCircle, Loader2, Image, Printer } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { generateApplicationPDF } from '../../utils/generateApplicationPDF';
import { generateSinhalaApplicationPDF } from '../../utils/generateSinhalaApplicationPDF';

function ApplicationsList({ statusFilter = 'all', onEdit, isCompact = false }) {
  const { userRole, userDivision } = useAuth();
  const normalizedRole = userRole?.toLowerCase();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Fetch applications (Simplified query to avoid Index requirements)
        let q;
        const appRef = collection(db, 'applications');
        
        // Dynamic filtering based on role
        if (normalizedRole === 'divisional_secretary') {
          // DS only sees apps for their assigned division
          if (statusFilter === 'all') {
            q = query(appRef, where('division', '==', userDivision));
          } else {
            q = query(appRef, where('division', '==', userDivision), where('status', '==', statusFilter));
          }
        } else if (normalizedRole === 'director') {
          // Director sees all applications
          if (statusFilter === 'all') {
            q = query(appRef);
          } else {
            q = query(appRef, where('status', '==', statusFilter));
          }
        } else {
          // DO and others only see their own submissions
          const officerQuery = where('officer.uid', '==', auth.currentUser.uid);
          if (statusFilter === 'all') {
            q = query(appRef, officerQuery);
          } else {
            q = query(appRef, officerQuery, where('status', '==', statusFilter));
          }
        }

        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })).sort((a, b) => {
          // Sort by creation date (newest first)
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
        setApplications(docs);
      } catch (error) {
        console.error("Error fetching applications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [statusFilter]);

  const handleAction = async (e, appId, newStatus) => {
    e.stopPropagation();
    const reason = newStatus === 'rejected' ? window.prompt('Enter reason for rejection:') : null;
    if (newStatus === 'rejected' && reason === null) return;
    
    try {
      let finalStatus = newStatus;
      if (newStatus === 'approved' && normalizedRole === 'divisional_secretary') {
        finalStatus = 'pending_director';
        try {
          const flowSnap = await getDoc(doc(db, 'settings', 'approval_flow'));
          if (flowSnap.exists() && flowSnap.data().skipDirectorReview) {
            finalStatus = 'approved_by_director';
          }
        } catch (err) {}
      } else if (newStatus === 'approved' && normalizedRole === 'director') {
        finalStatus = 'approved_by_director';
      }

      const appRef = doc(db, 'applications', appId);
      const updateData = {
        status: finalStatus,
        lastUpdated: serverTimestamp()
      };

      if (normalizedRole === 'divisional_secretary') {
        updateData.dsReview = {
          reviewedBy: auth.currentUser.email,
          reviewedAt: serverTimestamp(),
          comments: reason
        };
      } else if (normalizedRole === 'director') {
        updateData.directorReview = {
          reviewedBy: auth.currentUser.email,
          reviewedAt: serverTimestamp(),
          comments: reason
        };
      }

      await updateDoc(appRef, updateData);
      setApplications(prev => prev.map(app => app.id === appId ? { ...app, status: finalStatus } : app));
      let msg = 'Rejected!';
      if (newStatus === 'approved') {
        if (finalStatus === 'approved_by_director') {
          msg = normalizedRole === 'divisional_secretary' ? 'Forwarded to Admin!' : 'Approved!';
        } else if (finalStatus === 'pending_director') {
          msg = 'Forwarded to Director!';
        }
      }
      alert(`Application ${msg}`);
    } catch (err) {
      alert('Action failed: ' + err.message);
    }
  };

  const handleDelete = async (e, appId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'applications', appId));
        setApplications(prev => prev.filter(app => app.id !== appId));
        alert('Application deleted successfully.');
      } catch (error) {
        console.error("Error deleting application:", error);
        alert('Failed to delete: ' + error.message);
      }
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_ds':
        return <span style={{ ...badgeStyle, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>DS Review</span>;
      case 'pending_director':
        return <span style={{ ...badgeStyle, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>Director Review</span>;
      case 'approved':
        return <span style={{ ...badgeStyle, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>Approved</span>;
      case 'rejected':
        return <span style={{ ...badgeStyle, background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e' }}>Rejected</span>;
      default:
        return <span style={{ ...badgeStyle }}>{status}</span>;
    }
  };

  const filteredApps = applications.filter(app => {
    const search = searchTerm.toLowerCase();
    return (
      (app.personal?.fullName || "").toLowerCase().includes(search) ||
      (app.personal?.nic || "").toLowerCase().includes(search) ||
      (app.business?.businessName || "").toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div style={{ padding: isCompact ? '1rem' : '4rem', textAlign: 'center', color: '#64748b' }}>
         <Loader2 className="animate-spin" size={isCompact ? 20 : 32} style={{ margin: '0 auto 1rem' }} />
         <p>{isCompact ? '...' : 'Loading Applications...'}</p>
      </div>
    );
  }

  if (isCompact) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
        {applications.slice(0, 5).map(app => (
          <div key={app.id} onClick={() => setSelectedApp(app)} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer', transition: 'background 0.2s' }} className="row-hover">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ maxWidth: '70%', overflow: 'hidden' }}>
                   <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{app.personal?.fullName}</div>
                   <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{app.business?.businessName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#10b981' }}>{app.score}</div>
                   <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>Pts</div>
                </div>
             </div>
          </div>
        ))}
        {applications.length === 0 && <p style={{ fontSize: '0.8rem', opacity: 0.5, textAlign: 'center', padding: '1rem' }}>No approved grants yet.</p>}
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ textAlign: 'left', width: '100%' }}>
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
          <h2 style={{ margin: 0, fontSize: 'clamp(1.4rem, 5vw, 1.8rem)' }}>
            {statusFilter === 'approved' ? 'Approved Grants' : 
             statusFilter === 'pending_ds' ? 'DS Pending Review' :
             statusFilter === 'pending_director' ? 'Director Pending Review' :
             statusFilter === 'rejected' ? 'Rejected Applications' : 'All Applications'}
          </h2>
          <p style={{ color: '#64748b', margin: '0.5rem 0 0', fontSize: '0.9rem' }}>
            {statusFilter === 'approved' ? 'Official list of approved SME grants.' : 
             'Track and manage applications across different stages.'}
          </p>
        </div>
        <div style={{ position: 'relative', width: '100%', maxWidth: window.innerWidth < 768 ? '100%' : '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input 
            type="text" 
            placeholder="Search by name or NIC..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ ...searchStyle, width: '100%' }}
          />
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="glass" style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
          <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
          <p>No applications found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredApps.map(app => (
            <div key={app.id} className="glass" style={{ ...cardStyle, marginBottom: '0.5rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', minWidth: '220px', flexGrow: 1 }}>
                  <div style={iconBoxStyle}>
                    <FileText size={20} color="#3b82f6" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{app.personal?.fullName || 'Unnamed Applicant'}</h4>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                      NIC: {app.personal?.nic}
                    </p>
                    <p style={{ margin: '0.1rem 0 0', fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      {app.business?.businessName}
                    </p>
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  alignItems: 'center', 
                  gap: '1.5rem', 
                  justifyContent: 'flex-start',
                  flexGrow: 2,
                  width: window.innerWidth < 768 ? '100%' : 'auto',
                  borderTop: window.innerWidth < 768 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  paddingTop: window.innerWidth < 768 ? '1rem' : '0'
                }}>
                  <div style={{ minWidth: '80px' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Status</p>
                    {getStatusBadge(app.status)}
                  </div>
                  
                  <div style={{ minWidth: '60px' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Points</p>
                    <p style={{ margin: 0, fontWeight: 800, color: app.score > 30 ? '#10b981' : '#3b82f6', fontSize: '1.1rem' }}>
                      {app.score || 0}
                    </p>
                  </div>
 
                  <div style={{ minWidth: '110px' }}>
                    <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Grant Amount</p>
                    <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                      LKR {(app.equipment?.totalGrant || 0).toLocaleString()}
                    </p>
                  </div>
 
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto' }}>
                    {(app.equipment?.items || []).some(i => i.quotationUrl || i.quotationData) && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const firstQuote = (app.equipment.items || []).find(i => i.quotationUrl || i.quotationData);
                          if (firstQuote) {
                            const link = document.createElement('a');
                            link.href = firstQuote.quotationUrl || firstQuote.quotationData;
                            link.target = "_blank";
                            link.download = `preview_${app.id.substring(0,8)}.png`;
                            link.click();
                          }
                        }}
                        style={{ ...iconBtnStyle, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}
                        title="Quick Quotation Preview"
                      >
                         <Image size={18} />
                      </button>
                    )}

                    <button 
                      onClick={() => setSelectedApp(app)}
                      style={{ ...iconBtnStyle, color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}
                      title="View Details"
                    >
                      <Eye size={18} />
                    </button>
                    
                    {normalizedRole === 'development_officer' && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(app); }}
                        style={{ ...iconBtnStyle, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '0.6rem 1rem', gap: '0.4rem' }}
                        title="Edit Application"
                      >
                        <Edit3 size={18} />
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Edit</span>
                      </button>
                    )}
 
                    {normalizedRole === 'divisional_secretary' && app.status === 'pending_ds' && (
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button 
                          onClick={(e) => handleAction(e, app.id, 'approved')}
                          style={{ ...iconBtnStyle, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}
                          title="Forward"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleAction(e, app.id, 'rejected')}
                          style={{ ...iconBtnStyle, color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)' }}
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
 
                    {normalizedRole === 'director' && app.status === 'pending_director' && (
                      <div style={{ display: 'flex', gap: '0.6rem' }}>
                        <button 
                          onClick={(e) => handleAction(e, app.id, 'approved')}
                          style={{ ...iconBtnStyle, color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}
                          title="Final Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          onClick={(e) => handleAction(e, app.id, 'rejected')}
                          style={{ ...iconBtnStyle, color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)' }}
                          title="Reject"
                        >
                          <XCircle size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
 
      {/* Detail Modal */}
      {selectedApp && (
        <div style={modalOverlayStyle} onClick={() => setSelectedApp(null)}>
          <div className="glass animate-fade-in" style={{
            ...modalContentStyle,
            padding: window.innerWidth < 768 ? '1.5rem' : '3rem',
            borderRadius: '16px'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem, 4vw, 1.6rem)' }}>Application Dossier</h2>
                <p style={{ margin: '0.3rem 0 0', color: '#64748b', fontSize: '0.85rem' }}>Ref ID: {selectedApp.id.substring(0, 8).toUpperCase()}</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => generateApplicationPDF(selectedApp)}
                  style={{ 
                    background: 'rgba(59, 130, 246, 0.1)', 
                    border: '1px solid rgba(59, 130, 246, 0.3)', 
                    color: '#3b82f6', 
                    cursor: 'pointer',
                    padding: '0 0.8rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    height: '40px'
                  }}
                  title="Download English PDF"
                >
                  <Download size={16} /> English
                </button>
                <button 
                  onClick={() => generateSinhalaApplicationPDF(selectedApp)}
                  style={{ 
                    background: 'rgba(16, 185, 129, 0.1)', 
                    border: '1px solid rgba(16, 185, 129, 0.3)', 
                    color: '#10b981', 
                    cursor: 'pointer',
                    padding: '0 0.8rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    height: '40px'
                  }}
                  title="සිංහල PDF බාගන්න"
                >
                  <Download size={16} /> සිංහල
                </button>
                <button 
                  onClick={() => setSelectedApp(null)} 
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.1)', 
                    color: '#94a3b8', 
                    cursor: 'pointer',
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <X size={20} />
                </button>
              </div>
            </div>
 
            <div className="grid-2">
              <div>
                <DetailSection icon={<UserIcon size={18}/>} title="Personal Details">
                  <p><strong>Full Name:</strong> {selectedApp.personal?.fullName}</p>
                  <p><strong>NIC:</strong> {selectedApp.personal?.nic}</p>
                  <p><strong>Permanent Address:</strong> {selectedApp.personal?.address}</p>
                  <p><strong>DS Division:</strong> {selectedApp.personal?.dsDivision || 'N/A'}</p>
                  <p><strong>GS Division:</strong> {selectedApp.personal?.gsDivision || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedApp.personal?.phone}</p>
                </DetailSection>
 
                <DetailSection icon={<Briefcase size={18}/>} title="Business Profile">
                  <p><strong>Entity Name:</strong> {selectedApp.business?.businessName}</p>
                  <p><strong>Registration No:</strong> {selectedApp.business?.regNo}</p>
                  <p><strong>Grant Requested:</strong> LKR {(selectedApp.equipment?.totalGrant || 0).toLocaleString()}</p>
                </DetailSection>
              </div>
 
              <div>
                <DetailSection icon={<GraduationCap size={18}/>} title="Eligibility Metrics">
                  <p><strong>NVQ Professional Level:</strong> {selectedApp.training?.nvqLevel || 'N/A'}</p>
                  <p><strong>Educational Degree:</strong> {selectedApp.training?.degree || 'N/A'}</p>
                  <p><strong>System Score:</strong> <span style={{ color: '#10b981', fontWeight: 800 }}>{selectedApp.score || 0} Points</span></p>
                  {selectedApp.scoreBreakdown && (
                    <div style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: '#94a3b8' }}>
                      <p style={{ margin: '0 0 0.4rem 0', fontWeight: 600, color: '#3b82f6' }}>Score Breakdown:</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.3rem' }}>
                        <span>Business Stability & Growth:</span>
                        <strong>{selectedApp.scoreBreakdown.businessStability || 0} / 25</strong>
                        
                        <span>Professional Competency:</span>
                        <strong>{selectedApp.scoreBreakdown.professionalCompetency || 0} / 25</strong>
                        
                        <span>Household Status & Social:</span>
                        <strong>{selectedApp.scoreBreakdown.householdStatus || 0} / 15</strong>
                        
                        <span>Economic Contribution:</span>
                        <strong>{selectedApp.scoreBreakdown.economicContribution || 0} / 25</strong>
                        
                        <span>Special Awards & Recognition:</span>
                        <strong>{selectedApp.scoreBreakdown.specialAwards || 0} / 10</strong>
                      </div>
                    </div>
                  )}
                </DetailSection>
 
                <DetailSection icon={<PenTool size={18}/>} title="Equipment Breakdown">
                  {(selectedApp.equipment?.items || []).map((item, idx) => (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>{item.brand} • {item.model}</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
                        <span style={{ fontSize: '0.9rem', color: '#3b82f6' }}>LKR {(item.unitPrice * item.qty).toLocaleString()}</span>
                        {(item.quotationUrl || item.quotationData) && (
                          <button 
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = item.quotationUrl || item.quotationData;
                              link.download = `quotation_${item.name}.png`;
                              link.click();
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '0.75rem', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                          >
                            <Download size={12} /> Quotation
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </DetailSection>
              </div>
            </div>
 
            {(userRole === 'divisional_secretary' && selectedApp.status === 'pending_ds') || 
             (userRole === 'director' && selectedApp.status === 'pending_director') ? (
              <div style={{ 
                marginTop: '3rem', 
                paddingTop: '2rem', 
                borderTop: '1px solid rgba(255,255,255,0.05)', 
                display: 'flex', 
                flexWrap: 'wrap',
                gap: '1rem' 
              }}>
                <button 
                  onClick={(e) => { handleAction(e, selectedApp.id, 'approved'); setSelectedApp(null); }}
                  style={{ flexGrow: 1, padding: '1.2rem', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', minWidth: '200px' }}
                >
                  APPROVE APPLICATION
                </button>
                <button 
                  onClick={(e) => { handleAction(e, selectedApp.id, 'rejected'); setSelectedApp(null); }}
                  style={{ flexGrow: 1, padding: '1.2rem', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', borderRadius: '12px', color: '#f43f5e', fontWeight: 800, cursor: 'pointer', fontSize: '1rem', minWidth: '200px' }}
                >
                  REJECT & ADD COMMENTS
                </button>
              </div>
            ) : null}
            
            {selectedApp.status === 'rejected' && (selectedApp.dsReview?.comments || selectedApp.directorReview?.comments) && (
              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '14px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                <p style={{ margin: 0, color: '#f43f5e', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 700 }}>Reviewer Comments:</p>
                <p style={{ margin: 0, color: '#fff', lineHeight: '1.5', fontSize: '0.95rem' }}>{selectedApp.directorReview?.comments || selectedApp.dsReview?.comments}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({ icon, title, children }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.2rem', color: '#10b981' }}>
        <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
          {icon}
        </div>
        <h3 style={{ margin: 0, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{title}</h3>
      </div>
      <div style={{ paddingLeft: '0.5rem', fontSize: '0.95rem', color: '#cbd5e1', lineHeight: '1.8' }}>
        {children}
      </div>
    </div>
  );
}

const iconBtnStyle = {
  width: '38px',
  height: '38px',
  borderRadius: '10px',
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.2s'
};

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.85)',
  backdropFilter: 'blur(10px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '1rem',
  boxSizing: 'border-box'
};

const modalContentStyle = {
  width: '100%',
  maxWidth: '960px',
  maxHeight: 'calc(100vh - 2rem)',
  overflowY: 'auto',
  background: '#0c111d',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  margin: 'auto'
};

const cardStyle = {
  padding: '1.5rem',
  transition: 'all 0.2s',
  border: '1px solid rgba(255,255,255,0.05)'
};

const iconBoxStyle = {
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'rgba(59, 130, 246, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const badgeStyle = {
  display: 'inline-block',
  padding: '0.3rem 0.8rem',
  borderRadius: '12px',
  fontSize: '0.7rem',
  fontWeight: 700,
  marginTop: '0.2rem',
  textTransform: 'uppercase',
  letterSpacing: '0.02em'
};

const searchStyle = {
  padding: '0.8rem 1rem 0.8rem 3rem',
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
  outline: 'none',
  fontSize: '0.9rem',
  transition: 'border-color 0.2s'
};



export default ApplicationsList;
