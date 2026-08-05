import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTranslation } from '../i18n';
import { 
  Home, 
  FileText, 
  PlusCircle, 
  List, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  Settings,
  HelpCircle,
  LogOut,
  X,
  Briefcase,
  Shield
} from 'lucide-react';

function Sidebar({ activeTab, setActiveTab, onLogout, isOpen, onClose, userRole, language = 'en' }) {
  const normalizedRole = userRole?.toLowerCase();
  const [expandedItems, setExpandedItems] = useState(['applications', 'approvals', 'final-actions', 'procurement', 'admin-tools']);
  
  // Dynamic menu based on role
  const menuItems = normalizedRole === 'divisional_secretary' ? [
    { id: 'overview', title: getTranslation('sidebar.dsDashboard', language), icon: <Home size={20} /> },
    { 
      id: 'approvals', 
      title: getTranslation('sidebar.approvals', language), 
      icon: <CheckCircle size={20} />,
      subItems: [
        { id: 'approval-queue', title: getTranslation('sidebar.pendingActions', language), icon: <Clock size={16} /> },
        { id: 'all-app', title: getTranslation('sidebar.processedRecords', language), icon: <List size={16} /> }
      ]
    },
    { id: 'settings', title: getTranslation('sidebar.settings', language), icon: <Settings size={20} /> }
  ] : normalizedRole === 'director' ? [
    { id: 'overview', title: getTranslation('sidebar.directorDashboard', language), icon: <Home size={20} /> },
    { id: 'final-actions', title: getTranslation('sidebar.finalApprovalPanel', language), icon: <CheckCircle size={20} />, subItems: [
      { id: 'director-queue', title: getTranslation('sidebar.pendingApproval', language), icon: <Clock size={16} /> },
      { id: 'approved-app', title: getTranslation('sidebar.approvedGrant', language), icon: <CheckCircle size={16} /> }
    ]},
    { id: 'settings', title: getTranslation('sidebar.settings', language), icon: <Settings size={20} /> }
  ] : normalizedRole === 'accountant' ? [
    { id: 'overview', title: getTranslation('sidebar.accountsDashboard', language), icon: <Home size={20} /> },
    { id: 'procurement', title: getTranslation('sidebar.paymentsOrders', language), icon: <Briefcase size={20} />, subItems: [
      { id: 'approved-app', title: getTranslation('sidebar.processPending', language), icon: <Clock size={16} /> },
      { id: 'ordered-app', title: getTranslation('sidebar.procurementHistory', language), icon: <CheckCircle size={16} /> }
    ]},
    { id: 'settings', title: getTranslation('sidebar.settings', language), icon: <Settings size={20} /> }
  ] : normalizedRole === 'admin' ? [
    { id: 'overview', title: getTranslation('sidebar.systemConsole', language), icon: <Home size={20} /> },
    { id: 'admin-tools', title: getTranslation('sidebar.administration', language), icon: <Settings size={20} />, subItems: [
      { id: 'users', title: getTranslation('sidebar.staffDirectory', language), icon: <PlusCircle size={16} /> },
      { id: 'records', title: getTranslation('sidebar.masterRecords', language), icon: <FileText size={16} /> },
      { id: 'sectors', title: getTranslation('sidebar.divisionalSectors', language), icon: <List size={16} /> },
      { id: 'policy', title: getTranslation('sidebar.grantPolicy', language), icon: <Shield size={16} /> },
      { id: 'scoring', title: getTranslation('sidebar.scoringEngine', language), icon: <Settings size={16} /> },
      { id: 'scoring-board', title: getTranslation('sidebar.masterScoreBoard', language), icon: <List size={16} /> },
      { id: 'approval-flow', title: getTranslation('sidebar.approvalFlow', language), icon: <Settings size={16} /> },
      { id: 'dispatch', title: getTranslation('sidebar.dispatchControl', language), icon: <CheckCircle size={16} /> }
    ]},
    { id: 'settings', title: getTranslation('sidebar.settings', language), icon: <Settings size={20} /> }
  ] : [
    { id: 'overview', title: getTranslation('sidebar.overview', language), icon: <Home size={20} /> },
    { 
      id: 'applications', 
      title: getTranslation('sidebar.applications', language), 
      icon: <FileText size={20} />,
      subItems: [
        { id: 'new-app', title: getTranslation('sidebar.newApplication', language), icon: <PlusCircle size={16} /> },
        { id: 'pending-app', title: getTranslation('sidebar.pendingReview', language), icon: <Clock size={16} /> },
        { id: 'approved-app', title: getTranslation('sidebar.approvedGrants', language), icon: <CheckCircle size={16} /> },
        { id: 'all-app', title: getTranslation('sidebar.allRecords', language), icon: <List size={16} /> }
      ]
    },
    { id: 'settings', title: getTranslation('sidebar.settings', language), icon: <Settings size={20} /> }
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const toggleExpand = (id) => {
    setExpandedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 100
            }}
          />
        )}
      </AnimatePresence>

      <motion.aside 
        className="glass"
        initial={false}
        animate={{ 
          x: isOpen || !isMobile ? 0 : '-100%',
          width: isMobile ? '280px' : '260px'
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          height: isMobile ? '100dvh' : 'calc(100vh - 4rem)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem',
          position: isMobile ? 'fixed' : 'sticky',
          top: isMobile ? 0 : '2rem',
          left: isMobile ? 0 : 'auto',
          zIndex: 101,
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', padding: '0 0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: '#fff' }}>{getTranslation('sidebar.smePortal', language)}</h2>
            <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{getTranslation('sidebar.uvaGovt', language)}</span>
          </div>
          {isMobile && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={24} />
            </button>
          )}
        </div>

      <nav style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {menuItems.map(item => (
          <div key={item.id}>
            <button
              onClick={() => item.subItems ? toggleExpand(item.id) : setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.8rem',
                padding: '0.8rem',
                border: 'none',
                borderRadius: '10px',
                background: (activeTab === item.id && !item.subItems) ? 'rgba(31, 78, 121, 0.2)' : 'transparent',
                color: (activeTab === item.id && !item.subItems) ? '#3b82f6' : '#94a3b8',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontWeight: (activeTab === item.id && !item.subItems) ? 600 : 400
              }}
            >
              <span style={{ color: (activeTab === item.id && !item.subItems) ? '#3b82f6' : '#64748b' }}>
                {item.icon}
              </span>
              <span style={{ flexGrow: 1 }}>{item.title}</span>
              {item.subItems && (
                expandedItems.includes(item.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />
              )}
            </button>

            {item.subItems && (
              <AnimatePresence>
                {expandedItems.includes(item.id) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.2rem', marginTop: '0.2rem' }}
                  >
                    {item.subItems.map(subItem => (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          setActiveTab(subItem.id);
                          if (isMobile) onClose();
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.8rem',
                          padding: '0.6rem 0.8rem',
                          border: 'none',
                          borderRadius: '8px',
                          background: activeTab === subItem.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                          color: activeTab === subItem.id ? '#3b82f6' : '#64748b',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          textAlign: 'left',
                          transition: 'all 0.2s'
                        }}
                      >
                        {subItem.icon}
                        {subItem.title}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            padding: '0.8rem',
            border: 'none',
            background: 'transparent',
            color: '#f87171',
            cursor: 'pointer',
            fontSize: '0.9rem'
          }}
        >
          <LogOut size={20} />
          {getTranslation('sidebar.signOut', language)}
        </button>
      </div>
    </motion.aside>
    </>
  );
}

export default Sidebar;
