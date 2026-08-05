import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, LayoutDashboard, Bell, Search, CheckCircle } from 'lucide-react';
import { auth } from '../firebase';
import DOModule from './DO/DOModule';
import ApplicationsList from './DO/ApplicationsList';
import DSModule from './DSModule';
import DirectorModule from './DirectorModule';
import AccountantModule from './AccountantModule';
import AdminModule from './AdminModule';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { getTranslation } from '../i18n';

function Dashboard({ language = 'en', setLanguage }) {
  const { currentUser, userRole } = useAuth();
  const normalizedRole = userRole?.toLowerCase();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  const handleLogout = () => {
    auth.signOut();
  };

  const renderContent = () => {
    // Role-based defaults
    if (normalizedRole === 'divisional_secretary' && (activeTab === 'overview' || activeTab === 'approval-queue')) {
      return <DSModule />;
    }
    if (normalizedRole === 'director' && (activeTab === 'overview' || activeTab === 'director-queue')) {
      return <DirectorModule />;
    }
    if (normalizedRole === 'accountant' && (activeTab === 'overview' || activeTab === 'procurement')) {
      return <AccountantModule statusFilter="approved" />;
    }
    if (normalizedRole === 'admin' && (['overview', 'users', 'records', 'sectors', 'policy', 'scoring', 'scoring-board', 'dispatch', 'approval-flow'].includes(activeTab))) {
      return <AdminModule activeTab={activeTab} />;
    }

    switch (activeTab) {
      case 'approval-queue':
        return <DSModule />;
      case 'director-queue':
        return <DirectorModule />;
      case 'procurement':
        return <AccountantModule statusFilter="approved" />;
      case 'ordered-app':
        return <AccountantModule statusFilter="ordered" />;
      case 'users':
      case 'records':
      case 'sectors':
      case 'policy':
      case 'scoring':
      case 'scoring-board':
      case 'approval-flow':
      case 'dispatch':
        return <AdminModule activeTab={activeTab} />;
      case 'new-app':
        return <DOModule initialData={editingApp} onComplete={() => setEditingApp(null)} language={language} />;
      case 'pending-app':
        return <ApplicationsList statusFilter="pending_ds" onEdit={(app) => {
          setEditingApp(app);
          setActiveTab('new-app');
        }} />;
      case 'approved-app':
        return <ApplicationsList statusFilter="approved" onEdit={(app) => {
          setEditingApp(app);
          setActiveTab('new-app');
        }} />;
      case 'all-app':
        return <ApplicationsList statusFilter="all" onEdit={(app) => {
          setEditingApp(app);
          setActiveTab('new-app');
        }} />;
      case 'overview':
      default:
        return (
          <div className="animate-fade-in">
            <header style={{ textAlign: 'left', marginBottom: 'clamp(1.5rem, 5vw, 3rem)' }}>
              <h1 style={{ fontSize: 'clamp(1.8rem, 6vw, 2.5rem)', margin: 0 }}>{getTranslation('dashboard.overview', language)}</h1>
              <p style={{ color: '#94a3b8', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>{getTranslation('dashboard.welcome', language)} <strong>{userRole || 'Development Officer'}</strong>.</p>
            </header>

            <div className="grid-2">
              <div className="glass" style={{ padding: 'clamp(1rem, 4vw, 2rem)', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{getTranslation('dashboard.approvedGrants', language)}</h3>
                  <button 
                    onClick={() => setActiveTab('approved-app')}
                    style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {getTranslation('dashboard.viewAll', language)}
                  </button>
                </div>
                {normalizedRole === 'development_officer' ? (
                  <div className="animate-fade-in">
                    <ApplicationsList statusFilter="approved" isCompact={true} />
                  </div>
                ) : (
                  <div style={{ padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                    <LayoutDashboard size={32} style={{ marginBottom: '0.8rem', opacity: 0.3 }} />
                    <p style={{ fontSize: '0.85rem' }}>{getTranslation('dashboard.noData', language)}</p>
                  </div>
                )}
              </div>

              <div className="glass" style={{ padding: 'clamp(1rem, 4vw, 2rem)', textAlign: 'left' }}>
                <h3 style={{ margin: '0 0 1.5rem', fontSize: '1.2rem' }}>{getTranslation('dashboard.recentNotifications', language)}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.8rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{ padding: '0.6rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
                      <CheckCircle size={18} color="#3b82f6" />
                    </div>
                    <div>
                      <p style={{ fontSize: '0.9rem', margin: 0, color: '#e2e8f0', fontWeight: 500 }}>{getTranslation('dashboard.globalGrantActive', language)}</p>
                      <p style={{ fontSize: '0.75rem', margin: '0.2rem 0 0', color: '#64748b' }}>{getTranslation('dashboard.provinceWide', language)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="do-container" style={{ display: 'flex', gap: '2rem', padding: '0' }}>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        userRole={userRole}
        language={language}
      />
      
      <main style={{ 
        flexGrow: 1, 
        paddingTop: '1rem', 
        minWidth: 0,
        padding: '1rem' 
      }}>
        {/* Top bar with user profile */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.6rem',
                borderRadius: '10px',
                color: '#fff',
                cursor: 'pointer'
              }}
              className="mobile-only"
            >
              <Menu size={24} />
            </button>
            <div style={{ position: 'relative', width: 'clamp(200px, 30vw, 400px)' }} className="desktop-only">
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input 
                type="text" 
                placeholder={getTranslation('dashboard.search', language)} 
                style={{
                  width: '100%',
                  padding: '0.7rem 1rem 0.7rem 2.8rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setLanguage('en')}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', border: language === 'en' ? '1px solid #2e75b6' : '1px solid rgba(255,255,255,0.12)', background: language === 'en' ? 'rgba(46,117,182,0.2)' : 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer' }}
              >English</button>
              <button
                onClick={() => setLanguage('si')}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '999px', border: language === 'si' ? '1px solid #2e75b6' : '1px solid rgba(255,255,255,0.12)', background: language === 'si' ? 'rgba(46,117,182,0.2)' : 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer' }}
              >සිංහල</button>
            </div>
            <div className="glass" style={{ 
              padding: '0.5rem 0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.8rem',
              borderRadius: '12px',
              maxWidth: 'fit-content'
            }}>
              <div style={{ textAlign: 'right' }} className="desktop-only">
                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>{currentUser.email}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: '#3b82f6', textTransform: 'uppercase' }}>{userRole || 'Development Officer'}</p>
              </div>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px', 
                background: 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <User color="#fff" size={16} />
              </div>
            </div>
          </div>
        </div>

        {renderContent()}
      </main>
    </div>
  );
}

export default Dashboard;
