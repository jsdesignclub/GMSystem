import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { FileText, CheckCircle, Package, Eye, Search, Clock, DollarSign, Download, Truck, Printer, Filter, ArrowUpDown, X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const thStyle = { padding: '1.2rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' };
const tdStyle = { padding: '1.2rem 1.5rem', fontSize: '0.9rem' };
const inputStyle = { width: '100%', padding: '0.8rem 1rem 0.8rem 2.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none' };
const selectStyle = { padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', outline: 'none', cursor: 'pointer' };
const viewBtnStyle = { background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 };
const mainBtnStyle = { background: '#3b82f6', color: '#fff', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 };
const secondaryBtnStyle = { background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600 };

function AccountantModule({ statusFilter = 'approved' }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Advanced Filters for Accountant
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [itemNameFilter, setItemNameFilter] = useState('all');
  const [modelFilter, setModelFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [scoreSort, setScoreSort] = useState('desc');
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    fetchApplications();
    fetchDivisions();
  }, [statusFilter]);

  const fetchDivisions = async () => {
     try {
       const snap = await getDocs(collection(db, 'settings_divisions'));
       if (!snap.empty) {
         setDivisions(snap.docs.map(d => d.data().name));
       }
     } catch (err) { console.error(err); }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'applications'),
        where('status', '==', statusFilter)
      );

      const querySnapshot = await getDocs(q);
      let docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // If we are looking for 'approved' apps, only show those dispatched by Admin
      if (statusFilter === 'approved') {
        docs = docs.filter(app => app.adminDispatch);
      }

      setApplications(docs);
    } catch (error) {
      console.error("Error fetching accountant apps:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const appRef = doc(db, 'applications', appId);
      await updateDoc(appRef, {
        status: newStatus,
        procurementUpdate: {
          updatedBy: auth.currentUser.email,
          updatedAt: serverTimestamp(),
          phase: newStatus === 'ordered' ? 'Equipment Ordered' : 'Payment Disbursed'
        },
        lastUpdated: serverTimestamp()
      });

      alert(`Status Updated to: ${newStatus.toUpperCase()}`);
      setSelectedApp(null);
      fetchApplications();
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const getFilteredRecords = () => {
    let filtered = applications.filter(app => {
      const search = searchTerm.toLowerCase();
      const matchesMainSearch = 
        (app.personal?.fullName || "").toLowerCase().includes(search) ||
        (app.business?.businessName || "").toLowerCase().includes(search) ||
        (app.id || "").toLowerCase().includes(search);
      
      const matchesDivision = divisionFilter === 'all' || app.division === divisionFilter;
      
      // Accountant Specific Filters - Check all items
      const items = app.equipment?.items || [];
      const matchesItem = itemNameFilter === 'all' || items.some(item => item.name === itemNameFilter);
      const matchesModel = modelFilter === 'all' || items.some(item => item.model === modelFilter);
      const matchesBrand = brandFilter === 'all' || items.some(item => item.brand === brandFilter);

      return matchesMainSearch && matchesDivision && matchesItem && matchesModel && matchesBrand;
    });

    if (scoreSort === 'asc') {
      filtered.sort((a, b) => (a.score || 0) - (b.score || 0));
    } else if (scoreSort === 'desc') {
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    return filtered;
  };

  // Dynamically extract unique values for filters
  const uniqueDivisions = [...new Set(applications.map(app => app.division).filter(Boolean))].sort();
  const uniqueItems = [...new Set(applications.flatMap(app => (app.equipment?.items || []).map(i => i.name)).filter(Boolean))].sort();
  const uniqueBrands = [...new Set(applications.flatMap(app => (app.equipment?.items || []).map(i => i.brand)).filter(Boolean))].sort();
  const uniqueModels = [...new Set(applications.flatMap(app => (app.equipment?.items || []).map(i => i.model)).filter(Boolean))].sort();

  const exportCSV = () => {
    const filtered = getFilteredRecords();
    if (filtered.length === 0) return alert("No records to export");

    const headers = [
      "No", "ID", "Name", "Business", "Phone", "Division", "DO", "Item", "Model", "Brand", "Cost", "Grant"
    ];
    
    const csvData = filtered.map((app, i) => {
      const equip = app.equipment?.items?.[0] || {};
      return [
        i + 1,
        `"${app.id.substring(0,8)}"`,
        `"${app.personal?.fullName || ''}"`,
        `"${app.business?.businessName || ''}"`,
        `"${app.personal?.phone || ''}"`,
        `"${app.division || ''}"`,
        `"${app.officer?.email || ''}"`,
        `"${equip.name || ''}"`,
        `"${equip.model || ''}"`,
        `"${equip.brand || ''}"`,
        app.equipment?.totalGrant * 2 || 0,
        app.equipment?.totalGrant || 0
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + csvData.map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `accountant_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const filtered = getFilteredRecords();
    if (filtered.length === 0) return alert("No records to export");

    const doc = new jsPDF('l', 'mm', 'a3');
    doc.setFontSize(22);
    doc.setTextColor(31, 78, 121);
    doc.text("Procurement & Payment Authorization Registry", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Report Type: ${statusFilter.toUpperCase()}`, 14, 30);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 35);

    const tableData = filtered.map((app, i) => {
      const equip = app.equipment?.items?.[0] || {};
      return [
        (i + 1).toString(),
        app.id.substring(0,8),
        app.personal?.fullName || "N/A",
        app.business?.businessName || "N/A",
        app.division || "-",
        equip.name || "-",
        equip.model || "-",
        equip.brand || "-",
        (app.score || 0).toString(),
        `LKR ${(app.equipment?.totalGrant * 2 || 0).toLocaleString()}`,
        `LKR ${(app.equipment?.totalGrant || 0).toLocaleString()}`
      ];
    });

    autoTable(doc, {
      startY: 45,
      head: [["#", "ID", "Applicant", "Business", "Division", "Item", "Model", "Brand", "Score", "Total Cost", "Grant Amount"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [31, 78, 121], textColor: [255, 255, 255], fontSize: 8 },
      styles: { fontSize: 7 }
    });

    doc.save(`accountant_procurement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}><p>Loading procurement registry...</p></div>;

  return (
    <div className="animate-fade-in procurement-module">
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2.2rem', margin: 0 }}>Procurement Console</h2>
          <p style={{ color: '#94a3b8', margin: '0.4rem 0 0' }}>Manage authorization and equipment distribution for {statusFilter} applications.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={exportCSV} style={secondaryBtnStyle}><Download size={16} /> CSV</button>
          <button onClick={exportPDF} style={mainBtnStyle}><Printer size={16} /> Export PDF</button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="glass" style={{ padding: '1.5rem', borderRadius: '15px', marginBottom: '2rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
          <input 
            type="text" 
            placeholder="Search Applicant or Business..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={inputStyle}
          />
        </div>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select value={divisionFilter} onChange={e => setDivisionFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Divisions</option>
            {uniqueDivisions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={itemNameFilter} onChange={e => setItemNameFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Items</option>
            {uniqueItems.map(i => <option key={i} value={i}>{i}</option>)}
          </select>

          <select value={modelFilter} onChange={e => setModelFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Models</option>
            {uniqueModels.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} style={selectStyle}>
            <option value="all">All Brands</option>
            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>

          <select value={scoreSort} onChange={e => setScoreSort(e.target.value)} style={selectStyle}>
            <option value="desc">Score: High to Low</option>
            <option value="asc">Score: Low to High</option>
          </select>
        </div>
      </div>

      <div className="glass" style={{ padding: '1rem', borderRadius: '15px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1600px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
              <th style={thStyle}>No</th>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Full Name</th>
              <th style={thStyle}>Business</th>
              <th style={thStyle}>Division</th>
              <th style={thStyle}>Equipment</th>
              <th style={thStyle}>Model</th>
              <th style={thStyle}>Brand</th>
              <th style={thStyle}>Score</th>
              <th style={thStyle}>Total Cost</th>
              <th style={thStyle}>Grant</th>
              <th style={thStyle}>Quotation</th>
              <th style={thStyle} className="no-print">Actions</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredRecords().map((app, idx) => {
              const item = app.equipment?.items?.[0] || {};
              return (
                <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="row-hover">
                  <td style={tdStyle}>{idx + 1}</td>
                  <td style={tdStyle}><code style={{ fontSize: '0.7rem', color: '#3b82f6' }}>{app.id.substring(0,8)}</code></td>
                  <td style={tdStyle}><div style={{ fontWeight: 600 }}>{app.personal?.fullName}</div></td>
                  <td style={tdStyle}>{app.business?.businessName}</td>
                  <td style={tdStyle}>{app.division}</td>
                  <td style={tdStyle}>{item.name || 'N/A'}</td>
                  <td style={tdStyle}>{item.model || '-'}</td>
                  <td style={tdStyle}>{item.brand || '-'}</td>
                  <td style={tdStyle}><div style={{ color: '#10b981', fontWeight: 800 }}>{app.score || 0}</div></td>
                  <td style={tdStyle}>LKR {(app.equipment?.totalGrant * 2 || 0).toLocaleString()}</td>
                  <td style={tdStyle}><div style={{ color: '#10b981', fontWeight: 700 }}>LKR {(app.equipment?.totalGrant || 0).toLocaleString()}</div></td>
                  <td style={tdStyle}>
                    {app.equipment?.quotationUrl ? (
                      <a href={app.equipment.quotationUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                        <FileText size={14} /> PDF
                      </a>
                    ) : '-'}
                  </td>
                  <td style={tdStyle} className="no-print">
                    <button onClick={() => setSelectedApp(app)} style={viewBtnStyle}>
                      <Eye size={16} /> Manage
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {getFilteredRecords().length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
            <Clock size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
            <p>No procurement records found for this phase.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedApp && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="glass" 
               style={{ width: '100%', maxWidth: '700px', padding: '2.5rem', borderRadius: '24px', position: 'relative' }}
             >
                <button onClick={() => setSelectedApp(null)} style={{ position: 'absolute', right: '1.5rem', top: '1.5rem', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X /></button>
                
                <h3 style={{ margin: '0 0 1.5rem' }}>Procurement Authorization</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '15px' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', opacity: 0.6 }}>BENEFICIARY</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>{selectedApp.personal?.fullName}</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>{selectedApp.business?.businessName}</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', opacity: 0.8 }}>{selectedApp.division} Section | DS: {selectedApp.personal?.dsDivision || 'N/A'}</p>
                    <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', opacity: 0.8 }}>GS Branch: {selectedApp.personal?.gsDivision || 'N/A'}</p>
                  </div>
                  <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', color: '#10b981' }}>AUTHORIZED GRANT</p>
                    <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>LKR {selectedApp.equipment?.totalGrant?.toLocaleString()}</p>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem' }}>Covering 50% of asset cost</p>
                  </div>
                </div>

                <div style={{ marginBottom: '2.5rem' }}>
                   <p style={{ fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 600 }}>Update Status:</p>
                   <div style={{ display: 'flex', gap: '1rem' }}>
                     <button 
                       onClick={() => handleUpdateStatus(selectedApp.id, 'ordered')} 
                       style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontWeight: 700 }}
                     >
                       <Truck size={20} /> Equipment Ordered
                     </button>
                     <button 
                       onClick={() => handleUpdateStatus(selectedApp.id, 'completed')} 
                       style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontWeight: 700 }}
                     >
                       <DollarSign size={20} /> Payment Released
                     </button>
                   </div>
                </div>

                {selectedApp.equipment?.quotationUrl && (
                  <div style={{ marginBottom: '2rem' }}>
                    <a href={selectedApp.equipment.quotationUrl} target="_blank" rel="noopener noreferrer" style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#fff', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
                      <ExternalLink size={18} /> Review Original Quotation
                    </a>
                  </div>
                )}
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default AccountantModule;
