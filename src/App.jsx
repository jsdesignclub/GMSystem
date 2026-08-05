import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { motion } from 'framer-motion';
import { getCurrentLanguage, setCurrentLanguage, getTranslation } from './i18n';

function AppContent() {
  const { currentUser, loading } = useAuth();
  const [language, setLanguage] = useState(getCurrentLanguage());

  useEffect(() => {
    setCurrentLanguage(language);
  }, [language]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
        <div className="animate-fade-in" style={{ color: '#2e75b6', fontWeight: 600 }}>{getTranslation('app.loading', 'en')}</div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ 
      minHeight: '100vh',
      display: !currentUser ? 'flex' : 'block',
      flexDirection: 'column',
      justifyContent: !currentUser ? 'center' : 'stretch'
    }}>
      {!currentUser ? (
        <div style={{ 
          padding: '1.5rem', 
          width: '100%', 
          maxWidth: '1200px', 
          margin: '0 auto', 
          textAlign: 'center',
          overflowX: 'hidden'
        }}>
          <header style={{ marginBottom: '2.5rem' }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span style={{ 
                color: '#2e75b6', 
                fontWeight: 600, 
                letterSpacing: '0.1em',
                fontSize: 'clamp(0.7rem, 3vw, 0.9rem)',
                display: 'block',
                marginBottom: '0.5rem'
              }}>UVA PROVINCIAL INDUSTRIES DEPARTMENT</span>
              <h1>{getTranslation('app.title', language)}</h1>
              <p className="subtitle">{getTranslation('app.subtitle', language)}</p>
            </motion.div>
          </header>
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => setLanguage('en')}
                style={{ padding: '0.5rem 0.8rem', borderRadius: '999px', border: language === 'en' ? '1px solid #2e75b6' : '1px solid rgba(255,255,255,0.15)', background: language === 'en' ? 'rgba(46,117,182,0.2)' : 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer' }}
              >English</button>
              <button
                onClick={() => setLanguage('si')}
                style={{ padding: '0.5rem 0.8rem', borderRadius: '999px', border: language === 'si' ? '1px solid #2e75b6' : '1px solid rgba(255,255,255,0.15)', background: language === 'si' ? 'rgba(46,117,182,0.2)' : 'rgba(255,255,255,0.04)', color: '#fff', cursor: 'pointer' }}
              >සිංහල</button>
            </div>
            <Login language={language} />
          </div>
          <footer style={{ marginTop: '4rem', color: '#475569', fontSize: '0.8rem', padding: '1rem' }}>
            <p>{getTranslation('app.footer', language)}</p>
          </footer>
        </div>
      ) : (
        <Dashboard language={language} setLanguage={setLanguage} />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
