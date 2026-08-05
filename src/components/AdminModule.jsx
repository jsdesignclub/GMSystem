import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, getDoc, doc, updateDoc, setDoc, addDoc, serverTimestamp, query, orderBy, where } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { UserPlus, Shield, MapPin, Search, Trash2, Mail, X, CheckCircle, Settings, Eye, FileText, ArrowUpDown, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Filter, List } from 'lucide-react';
import { calculateScore } from '../utils/calculateScore';

const thStyle = { padding: '1.2rem 1.5rem', textAlign: 'left', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' };
const tdStyle = { padding: '1.2rem 1.5rem' };
const labelStyle = { display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#94a3b8' };
const inputStyle = { width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', boxSizing: 'border-box' };
const selectStyle = { padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#fff' };
const addBtnStyle = { background: 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)', color: '#fff', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, cursor: 'pointer' };
const searchStyle = { width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none' };
const avatarStyle = { width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' };
const modalOverlayStyle = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { width: '100%', maxWidth: '500px', padding: '3rem', background: '#0c111d', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' };

function AdminModule({ activeTab: externalTab }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'development_officer', division: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scoringPolicy, setScoringPolicy] = useState({
    businessStability: { nameReg: 10, tradeLicense: 5, incomeMax: 5, bookkeeping: 5 },
    professionalCompetency: { nvq3: 5, nvq4Degree: 10, exp1to5: 5, exp5to7: 7, exp7to10: 10 },
    householdStatus: { youngEntrepreneur: 10, specialNeeds: 5 },
    economicContribution: { emp1to5: 5, emp5to7: 7, empOver7: 10, nonTraditional: 10, qualityValueAdd: 5 },
    specialAwards: { regional: 2, district: 3, national: 5 }
  });
  const [activeSubTab, setActiveSubTab] = useState('users'); 
  const [grantPolicy, setGrantPolicy] = useState({ percentage: 50, maxAmount: 100000 });
  const [policyLoading, setPolicyLoading] = useState(false);
  const [approvalFlow, setApprovalFlow] = useState({ skipDsReview: false, skipDirectorReview: false });
  const [approvalFlowLoading, setApprovalFlowLoading] = useState(false);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [newDivName, setNewDivName] = useState('');
  const [divisions, setDivisions] = useState([
    'Badulla', 'Bandarawela', 'Ella', 'Haldummulla', 'Hali-Ela',
    'Haputale', 'Kandaketiya', 'Lunugala', 'Mahiyanganaya',
    'Meegahakivula', 'Passara', 'Rideemaliyadda', 'Soranathota',
    'Uva Paranagama', 'Welimada',
    'Badalkumbura', 'Bibile', 'Buttala', 'Kataragama', 'Madulla',
    'Medagama', 'Moneragala', 'Sevanagala', 'Siyambalanduwa',
    'Thanamalwila', 'Wellawaya'
  ]);
  const [gsDivisions, setGsDivisions] = useState([]);
  const [newGsName, setNewGsName] = useState('');
  const [selectedGsDs, setSelectedGsDs] = useState('');
  const [seedingGs, setSeedingGs] = useState(false);

  const roles = [
    { id: 'development_officer', label: 'Development Officer' },
    { id: 'divisional_secretary', label: 'Divisional Secretary' },
    { id: 'director', label: 'Director' },
    { id: 'accountant', label: 'Accountant' },
    { id: 'admin', label: 'System Admin' }
  ];

  const [approvedApps, setApprovedApps] = useState([]);
  const [allApps, setAllApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  
  const [dispatchQueue, setDispatchQueue] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [recordSearch, setRecordSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [scoreSort, setScoreSort] = useState('desc'); 

  useEffect(() => {
    fetchUsers();
    fetchGrantPolicy();
    fetchDivisions();
    fetchGsDivisions();
    fetchScoringPolicy();
    fetchApprovedApps();
    fetchAllApps();
    fetchDispatchQueue();
    fetchApprovalFlow();
  }, []);

  const exportCSV = () => {
    const filtered = getFilteredRecords();
    const dataToExport = selectedIds.length > 0 
      ? filtered.filter(app => selectedIds.includes(app.id))
      : filtered;

    if (dataToExport.length === 0) return alert("No records to export");

    const headers = [
      "No", "Application ID", "Applicant Name", "Business Name", "Phone", 
      "Address", "Divisional Secretariat", "GS Division", "Development Officer", 
      "Equipment Requested", "Model No", "Brand", "Process Status", "Viability Score", "Total Asset Cost", "Approved Grant Amount"
    ];
    
    const csvData = dataToExport.map((app, i) => {
      const equip = app.equipment?.items?.[0] || {};
      return [
        i + 1,
        `"${app.id}"`,
        `"${app.personal?.fullName || ''}"`,
        `"${app.business?.businessName || ''}"`,
        `"${app.personal?.phone || ''}"`,
        `"${app.personal?.address || ''}"`,
        `"${app.division || ''}"`,
        `"${app.personal?.gsDivision || ''}"`,
        `"${app.officer?.email || ''}"`,
        `"${equip.name || ''}"`,
        `"${equip.model || ''}"`,
        `"${equip.brand || ''}"`,
        `"${app.status === 'approved' ? 'Authorized' : app.status}"`,
        app.score || 0,
        app.equipment?.totalGrant * 2 || 0,
        app.equipment?.totalGrant || 0
      ];
    });

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + csvData.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${activeSubTab}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    const filtered = getFilteredRecords();
    const dataToExport = selectedIds.length > 0 
      ? filtered.filter(app => selectedIds.includes(app.id))
      : filtered;

    if (dataToExport.length === 0) return alert("No records to export");

    try {
      const doc = new jsPDF('l', 'mm', 'a3'); 
      
      doc.setFontSize(22);
      doc.setTextColor(31, 78, 121);
      doc.text(`SME Grant System - ${activeSubTab === 'dispatch' ? 'Final Dispatch List' : 'Master Records'}`, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`District/Province: Uva Provincial Government`, 14, 28);
      doc.text(`Report Date: ${new Date().toLocaleString()}`, 14, 33);
      doc.text(`Record Count: ${dataToExport.length} Applications`, 14, 38);

      const tableData = dataToExport.map((app, i) => {
        const equip = app.equipment?.items?.[0] || {};
        return [
          (i + 1).toString(),
          app.id.substring(0,6),
          app.personal?.fullName || "N/A",
          app.business?.businessName || "N/A",
          app.personal?.phone || "-",
          app.division || "-",
          app.personal?.gsDivision || "-",
          app.officer?.email?.split('@')[0] || "-",
          equip.name || "-",
          app.status === 'approved' ? 'Authorized' : app.status,
          (app.score || 0).toString(),
          (app.equipment?.totalGrant * 2 || 0).toLocaleString(),
          (app.equipment?.totalGrant || 0).toLocaleString()
        ];
      });

      autoTable(doc, {
        startY: 45,
        head: [["#", "ID", "Name", "Business", "Phone", "Division", "GS Div", "DO", "Equipment", "Phase", "Score", "Total Cost", "Grant"]],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [31, 78, 121], textColor: [255, 255, 255], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 }
      });

      doc.save(`${activeSubTab}_report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Error generating PDF.");
    }
  };


  const getFilteredRecords = () => {
    const sourceData = activeSubTab === 'dispatch' ? dispatchQueue : (activeSubTab === 'records' ? approvedApps : []);
    
    let filtered = sourceData.filter(app => {
      const search = recordSearch.toLowerCase();
      const matchesSearch = 
        (app.personal?.fullName || "").toLowerCase().includes(search) ||
        (app.business?.businessName || "").toLowerCase().includes(search) ||
        (app.id || "").toLowerCase().includes(search);
      
      const matchesDivision = divisionFilter === 'all' || app.division === divisionFilter;
      
      return matchesSearch && matchesDivision;
    });

    // Apply Sorting
    if (scoreSort === 'asc') {
      filtered.sort((a, b) => (a.score || 0) - (b.score || 0));
    } else if (scoreSort === 'desc') {
      filtered.sort((a, b) => (b.score || 0) - (a.score || 0));
    }

    return filtered;
  };

  // Sync with external sidebar tab
  useEffect(() => {
    if (externalTab && externalTab !== 'overview' && externalTab !== 'admin-tools') {
      setActiveSubTab(externalTab);
    } else if (externalTab === 'overview') {
      setActiveSubTab('users');
    }
  }, [externalTab]);

  const fetchApprovedApps = async () => {
    setAppsLoading(true);
    try {
      // Fetch all applications that are Approved and beyond (Ordered, Completed)
      const q = query(
        collection(db, 'applications'), 
        where('status', 'in', ['approved', 'ordered', 'completed'])
      );
      const snap = await getDocs(q);
      setApprovedApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setAppsLoading(false); }
  };

  const fetchAllApps = async () => {
    try {
      const q = query(collection(db, 'applications'));
      const snap = await getDocs(q);
      setAllApps(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const fetchDispatchQueue = async () => {
    setAppsLoading(true);
    try {
      const q = query(
        collection(db, 'applications'),
        where('status', 'in', ['approved_by_director', 'approved'])
      );
      const snap = await getDocs(q);
      const apps = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // We show both pending and already dispatched items in this view
      // But we filter out items that have moved further (ordered/completed)
      setDispatchQueue(apps.filter(app => app.status !== 'ordered' && app.status !== 'completed'));
    } catch (err) { console.error(err); }
    finally { setAppsLoading(false); }
  };

  const handleRecallFromAccount = async (appId) => {
    const reason = window.prompt("Reason for recalling from accounts:");
    if (reason === null) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: 'approved_by_director', // Move back to director approved state
        adminDispatch: null, // Remove the dispatch authorization
        recallLog: {
          recalledBy: auth.currentUser.email,
          recalledAt: serverTimestamp(),
          reason: reason
        },
        lastUpdated: serverTimestamp()
      });
      alert("Application recalled from Accounts department.");
      fetchDispatchQueue();
    } catch (err) {
      alert("Recall Error: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForwardToAccount = async () => {
    if (selectedIds.length === 0) return alert("Please select applications to forward.");
    
    if (!window.confirm(`Forward ${selectedIds.length} applications to the Accounts Department?`)) return;

    setIsSubmitting(true);
    try {
      const promises = selectedIds.map(id => 
        updateDoc(doc(db, 'applications', id), {
          status: 'approved', // Accountant looks for 'approved'
          adminDispatch: {
            dispatchedBy: auth.currentUser.email,
            dispatchedAt: serverTimestamp()
          },
          lastUpdated: serverTimestamp()
        })
      );
      await Promise.all(promises);
      alert("Applications forwarded to Accounts successfully!");
      setSelectedIds([]);
      fetchDispatchQueue();
      fetchApprovedApps();
    } catch (err) {
      alert("Error forwarding: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const filtered = getFilteredRecords();
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(a => a.id));
    }
  };


  const fetchScoringPolicy = async () => {
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'scoring_policy'));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setScoringPolicy(prev => ({
          ...prev,
          ...data,
          businessStability: { ...prev.businessStability, ...data.businessStability },
          professionalCompetency: { ...prev.professionalCompetency, ...data.professionalCompetency },
          householdStatus: { ...prev.householdStatus, ...data.householdStatus },
          economicContribution: { ...prev.economicContribution, ...data.economicContribution },
          specialAwards: { ...prev.specialAwards, ...data.specialAwards }
        }));
      }
    } catch (err) { console.error(err); }
  };

  const updateScoringPolicy = async () => {
    // Basic validation check
    setScoringLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'scoring_policy'), {
        ...scoringPolicy,
        updatedAt: serverTimestamp()
      });
      alert("Scoring rubric updated successfully!");
    } catch (err) { alert(err.message); }
    finally { setScoringLoading(false); }
  };

  const recalculateAllScores = async () => {
    if (!confirm('Recalculate scores for ALL applications? This will overwrite existing scores.')) return;
    setRecalculating(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'applications'));
      let updated = 0, failed = 0;
      const updates = [];
      querySnapshot.forEach(docSnap => {
        const appData = docSnap.data();
        const { totalScore, breakdown } = calculateScore(appData);
        if (totalScore !== undefined) {
          updates.push(updateDoc(doc(db, 'applications', docSnap.id), {
            score: totalScore,
            scoreBreakdown: breakdown
          }));
        }
      });
      await Promise.all(updates);
      updated = updates.length;
      alert(`Recalculation complete!\nUpdated: ${updated} applications\nFailed: ${failed}`);
      loadApplications();
    } catch (err) {
      alert('Error recalculating scores: ' + err.message);
      console.error(err);
    } finally {
      setRecalculating(false);
    }
  };

  const fetchDivisions = async () => {
     try {
       const snap = await getDocs(collection(db, 'settings_divisions'));
       if (!snap.empty) {
         setDivisions(snap.docs.map(d => d.data().name));
       }
     } catch (err) {
       console.error(err);
     }
  };

  const handleAddDivision = async () => {
    if (!newDivName) return;
    try {
      await addDoc(collection(db, 'settings_divisions'), { name: newDivName, createdAt: serverTimestamp() });
      setDivisions(prev => [...prev, newDivName]);
      setNewDivName('');
      alert("Division added successfully");
    } catch (err) { alert(err.message); }
  };

  const fetchGsDivisions = async () => {
    try {
      const snap = await getDocs(collection(db, 'settings_gs_divisions'));
      setGsDivisions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error('Error fetching GS divisions:', err);
    }
  };

  const handleAddGsDivision = async () => {
    if (!newGsName || !selectedGsDs) return;
    try {
      await addDoc(collection(db, 'settings_gs_divisions'), { name: newGsName, dsDivision: selectedGsDs, createdAt: serverTimestamp() });
      setGsDivisions(prev => [...prev, { name: newGsName, dsDivision: selectedGsDs }]);
      setNewGsName('');
      alert('GS Division added successfully');
    } catch (err) { alert(err.message); }
  };

  const gsSeedData = {
    Badulla: ['Andeniya (79A)','Badulla Central (78D)','Badulla East (78B)','Badulla North (78A)','Badulla South (78)','Badulla West (78C)','Badulupitiya (78J)','Damanwara (80F)','Glen Alpin (80H)','Hegoda (79)','Hindagoda (78K)','Hingurugamuwa (78E)','Hinnarangolla (81A)','Ilukthenna (80B)','Kailagoda (78G)','Kanupelella (78F)','Katupelella (78H)','Kendagolla (81)','Malangamuwa (80G)','Medapathana (78M)','Pitawelagama (78L)','Rambukpotha (80)','Sirimalgoda (80A)','Thelbedda Estate (81B)','Udawela (80D)','Vineethagama (80C)','Viyadiguna (80E)','Welibissa (80I)','Wewessa (80J)'],
    Bandarawela: ['Ambadandegama (70B)','Ambegoda (67C)','Bambaragama (70)','Bandarawela East (65G)','Bandarawela West (65B)','Beddearawa (70C)','Beddekumbura (65D)','Bindunuwewa (67B)','Creig Watta (67I)','Darahitawanagoda (66H)','Diganathenna (67H)','Dulgolla (66C)','Egodagama (66E)','Etthalapitiya (67)','Gediyaroda (67K)','Icelab Watta (67N)','Inikambedda (65E)','Karagahawela (65C)','Kebillawela North (67D)','Kebillawela South (65A)','Kinigama (66)','Kirioruwa (67E)','Konthahela (67A)','Liyangahawela (70A)','Liyangahawela Watta (70D)','Mahaulpatha (66D)','Makulella (66A)','Mathetilla (67J)','Nayabedda Estate (65H)','Obadella (65F)','Thanthiriya (66G)','Udaperuwa (66B)','Watagamuwa (67F)','Weheragalathenna (66F)','Wewathenna (67G)'],
    Ella: ['Ballaketuwa (72B)','Beddewela (72H)','Demodara (68I)','Dodamgolla (71B)','Dowa (69D)','Ella (68B)','Galtanhena (72E)','Gawarawela (72)','Govussa (71A)','Halpe (68)','Heeloya (69B)','Hettipola (69G)','Idamegama (68F)','Ilukpelessa (71)','Karandagolla (69A)','Kirinda (68D)','Kithalella (69E)','Madhuragama (68C)','Medawela West (72G)','Millagama (68G)','Namunukula (72B1)','Naulla (68A)','Nawela East (72A)','Nawela West (72F)','Newberg (68J)','Palleperuwa (69C)','Piyarapandowa (68H)','Pupula (72C)','Pupula West (72D)','Rawanaella (69F)','Udu Kumbalwela (69)','Yahalewela (68E)'],
    Haldummulla: ['Akkaraseeya (155F)','Amilagama (157E)','Ampitiyathenna (155K)','Bambarapokuna (154C)','Beragala (157B)','Divulgasmulla (154B)','Gampaha (154)','Haldummulla (157A)','Harankahawa (158B)','Kalupahana (158)','Kelipanawela (155M)','Kirawanagama (156)','Kithulgahaarawa (158E)','Kolongasthenna (154A)','Kosgama (158A)','Koslanda (155A)','Kotabakma (155D)','Lemasthota (155C)','Mahakanda (155N)','Mahalanda (155G)','Manthenna (156B)','Marangahawela (158F)','Medawela (157F)','Moraketiya (155E)','Nikapotha East (155)','Nikapotha West (155L)','Poonagalla (155P)','Ranasinghegama (155H)','Ranwanguhawa (156A)','Seelathenna (158D)','Soragune (157)','Uvathenna (158C)','Viharagala (157G)','Walhaputhenna (157H)','Watagamuwa (157K)','Weeliya (157C)','Weerakongama (158G)','Welanwita (155B)','Welibissa (157D)'],
    'Hali-Ela': ['Anthuduwawela (74D)','Beddegama (85)','Bogahamaditta (74B)','Bogoda (76)','Bulathwatta (86A)','Deegalla (75A)','Dehiwinna (56)','Dematawelhinna (82B)','Dikwella (74)','Etampitiya (55)','Gawela (55C)','Godegama (84B)','Haliela (74A)','Hapuwalakumbura (73A)','Hethekma (75)','Hinnaranagolla (55E)','Imbulgoda (82)','Jangulla (77B)','Kandana (86)','Katugaha (57F)','Ketawala (75C)','Kirinda (73D)','Kokatiyamaluwa (77A)','Kottagoda (82D)','Kudumahuwela (57D)','Kurukude (57C)','Landewela (76A)','Mahathenna (57E)','Mahawattagama (82C)','Maligathenna (57H)','Malitta (57)','Medagama (84)','Medapitigama (74E)','Morethota (56A)','Mugunumatha East (73B)','Mugunumatha West (73C)','Neludanda (56D)','Neluwa (56C)','Niliathugoda (56E)','Pahamunuthota (55D)','Pallegama (55A)','Panakanniya (75E)','Pattipola (75B)','Perahettiya (57A)','Samagipura (74C)','Springvalley (85B)','Springvalley Estate (86B)','Udagama (75D)','Udakohovila (74F)','Uduwara (73)','Unagolla (84A)','Uva Mahawela (56B)','Warakadanda (57G)','Wegama (77)','Welikemulla (82A)','Wepassawela (57B)','Wewelhinna (85A)'],
    Haputale: ['Aluthwela (63D)','Bingethenna (64G)','Dambethenna (63O)','Diyathalawa (63B)','Dodamwatta (63G)','Ellagama (63K)','Eranawela (64B)','Galkanda (64E)','Glananor Watta (64F)','Haputala Town (63A)','Haputhalegama (63C)','Hela Kadurugamuwa (63I)','Horadorowwa (63E)','Jayaminipura (64H)','Kahagolla (64)','Kahathewela (64A)','Kolathenna (63T)','Magiripura (63L)','Pahala Kadurugamuwa (63)','Panketiya (63M)','Pitarathamale (64D)','Ranjallawa (64C)','Thotalagala (63N)','Umankandura (63H)','Viharakele (63F)','Welanhinna (63J)'],
    Kandaketiya: ['Badulluoya West (31A)','Baduluoya East (30A)','Beramada (35A)','Bogahakumbura (33)','Bokanoruwa (35B)','Bopitiya (33A)','Dikkumbura (32B)','Galauda (35)','Godunna (32)','Hapathgamuwa (32C)','Hevandana (31C)','Kandakepu Ulpotha (31D)','Kandaketiya (31B)','Kirivehera (31H)','Kivulegedara (31G)','Mahakele (31F)','Mahathenna (30C)','Maliyadda (30)','Mudagamuwa (32A)','Narangala (35D)','Pallewela (31)','Thalakumbura (35E)','Thetilla (35C)','Wasanagama (32D)','Welaoya (31E)','Wewathenna (30B)'],
    Lunugala: ['Alakolagala (94E)','Arawakumbura (94C)','Attanagolla (94F)','Batawatta (18D)','Ekiriya (17)','Gallulla (18B)','Galwelagama (18C)','Hopton (94H)','Janathapura (95)','Janathapura North (95A)','Janathapura South (95B)','Kottalbedda (93)','Lunugala Town (94A)','Madulsima (89C)','Maduwatta (90C)','Mahadowa (89J)','Metigahathenna (18)','Millabedda (90A)','Pallekiruwa (92)','Peessagama (94I)','Rendapola (94J)','Sooriyagoda (94D)','Sumudugama (94G)','Udakiruwa (92A)','Udapanguwa (94)','Weragoda (92B)','Wewabedda (18A)','Yapamma (94B)'],
    Mahiyanganaya: ['Aluttarama (1H)','Aluyatawala (1I)','Bathalayaya (1)','Belaganwewa (1G)','Beligalla (7)','Dambagolla (4C)','Dambana (7A)','Dambarawa (3)','Dehigolla (3B)','Divulapelessa (1C)','Elewela (3C)','Galporuyaya (1B)','Ginnoruwa (1J)','Girandurukotte (1F)','Haddattawa (2A)','Hebarawa (1A)','Hobariyawa (1N)','Kukulapola (8)','Mahiyangana Town (3A)','Mapakadawewa (4A)','Medayaya (4B)','Meegahahena (1K)','Millattawa (1P)','Pahala Rathkinda (1D)','Pangaragammana (4)','Poojanagaraya (3D)','Rotalawela (1M)','Senanigama (4D)','Sorabora (2B)','Thalangamuwa (2C)','Theldeniyaya (1L)','Ulhitiya (1R)','Wewatta (8A)','Wewgampaha (2)','Wiranegama (1E)'],
    Meegahakivula: ['Aggalaulpotha (22C)','Akurukaduwa (22G)','Balagolla (22A)','Ellanda (16C)','Hunuketapitiya (23B)','Kalugahakandura (16)','Karametiya (22D)','Karandagahamada (22B)','Ketawatta (21A)','Kohana (23C)','Komarika (22F)','Meegahakivula (22)','Morahela (21)','Pitamaruwa (16A)','Polgahaarawa (22E)','Polwatta (16D)','Roberiya (18F)','Thaldena (23)','Watagommana (16E)','Wewathenna (16B)'],
    Passara: ['Ambathenna (88F)','Ambathenna West (88M)','Bibilegama East (87E)','Bibilegama West (87B)','Dambakote (20A)','Dambewela (88E)','Demodara (20)','Gerandiella (89F)','Gonagala East (88I)','Gonagala West (88C)','Kahataruppa (19A)','Kanahela (88A)','Kanawerella (87)','Kanawerella East (87D)','Kanawerella West (87C)','Kudugala Pathana (90D)','Madugasthalawa North (19)','Madugasthalawa South (19C)','Maligathenna (89E)','Maussagolla East (87F)','Maussagolla West (87A)','Medawelagama (89)','Meedumpitiya (90B)','Meeriyabedda (88)','Nikebedda (89H)','Palagolla (88H)','Palawatta (20B)','Pallegama (88G)','Paramahankada (89I)','Passara Town East (88L)','Passara Town North (88B)','Passara Town South (88K)','Pelgahathenna (89G)','Puhulwatta (88J)','Supuroda (89B)','Thalagahagedara (19B)','Thennuge (88D)','Tholabolawatta (90)','Udagama (89A)','Welgolla (89D)','Wewekele (87G)'],
    Rideemaliyadda: ['Abhayapura (2H)','Aluketiyawa (6)','Andaulapatha (5A)','Aralupitiya (9C)','Arawa (15)','Arawatta (2L)','Bubula (13B)','Deekirigolla (14A)','Dehigama (9A)','Dikkendayaya (6D)','Dikyaya (15A)','Diyakombala (11D)','Ekiriyankumbura (9)','Gamakumbura North (6E)','Gamakumbura South (6F)','Ikiriyagoda (2G)','Kandegama (12A)','Kandubedda (9D)','Keselpotha North (2B)','Keselpotha South (2F)','Kooralewela (6C)','Kotathalawa (5)','Kudalunuka (10A)','Kuruvithenna (13A)','Mahagama (13)','Mahalunuka (10)','Morana (9B)','Nagadeepa (6B)','Orubendiwewa (2D)','Pahalaoyagama (5B)','Pethiyagoda (11A)','Pinnagolla (14)','Rideemaliyadda North (11)','Rideemaliyadda South (11B)','Ritigahaarawa (12)','Sangabopura (2K)','Senewigama (2J)','Serana (2C)','Uraniya (11C)','Uva Gemunupura (2A)','Uva Thissapura (6A)','Welampele (2E)'],
    Soranathota: ['Ambagasdowa (25C)','Angoda (25)','Boliyadda (23A)','Budugekanda (29A)','Dikpitiya (34A)','Egodawela (24)','Idamegama (27B)','Idamepanguwa (34)','Kandegedara Town (27A)','Ketakellagama (25B)','Kirioruwa (27)','Kithulwattagama (26B)','Kohowila (26)','Kosgolla (25D)','Kuttiyagolla (25A)','Ledger Watta (27C)','Moragolla (29)','Pallekanda (29B)','Pathanegedara (24B)','Pussellakanda (28A)','Pussellawa (23AA)','Rideepana (26C)','Soranathota (28)','Wattekele (24A)','Yatilellagama (26A)'],
    'Uva Paranagama': ['Alagolla (42B)','Ambagasdowa (47A)','Balagala (45B)','Bambarapana (39)','Beraliyapola (41E)','Busdulla (45A)','Dangamuwa (47B)','Daragala (47D)','Dimbulana (38A)','Downside (53G)','Ellanda (37D)','Ethkandawaka (42A)','Galahagama (46B)','Gampaha (38C)','Hangiliella (53A)','Hangunnawa (43B)','Hathkinda (38B)','Idamegama (43C)','Ilukwela (38D)','Karagahaulpatha (46C)','Kendagolla (53D)','Kerklis (38E)','Ketagoda (47E)','Kindigoda (37B)','Kirawanagama (41)','Kodakumbura (43F)','Kohilegama (37C)','Korandekumbura (44C)','Kotawara Udagama (53E)','Kotawera Pahalagama (53F)','Kumarapattiya (45)','Kurundugolla (45C)','Lunuwatta (41B)','Malapolagama (44A)','Malwatte Gama (39A)','Maspanna (37)','Medagoda Gama (46D)','Medawela (46A)','Medipokuna (39B)','Metiwalalanda (53)','Mudanawa (43D)','Pallewela (45D)','Panagoda (40A)','Pannalagama (47F)','Pannalawela (41A)','Paranagama (43)','Perawella (46)','Pitiyakumbura (39C)','Rahupola (41D)','Ranhawadi Gama (43E)','Rathamba (47C)','Ritikumbura (37F)','Sapugolla (42)','Thawalampola (43A)','Thelhawadigama (46E)','Thuppitiya (40)','Udaperuwa (54)','Uduhawara (44)','Ulugala (53B)','Uma Ela (47)','Unapana (41C)','Vondmar (43G)','Welamedagama (44B)','Weliulla (54A)','Wethalawa (37A)','Wewegama (38)','Yahala Arawa (53C)','Yalagamuwa (37E)'],
    Welimada: ['Alakolagala (49D)','Alawathugoda (51D)','Alugolla (61B)','Ambagahakumbura (48)','Ambewela (50A)','Bibiligamuwa (50J)','Bogahakumbura (51)','Boragas (49A)','Boralanda (62B)','Dambawenna (59A)','Dayabarawatta (58D)','Dikkapitiya (58)','Dimuthugama (50H)','Divithotawela (59D)','Divurumgama (48A)','Erabadda (50E)','Galedanda (62C)','Gavarammana (49E)','Girambe (48B)','Guruthalawa (61)','Helayalkumbura (62H)','Hewanakumbura (50F)','Himbiliyagolla (50G)','Hingurugamuwa (60E)','Hinnarangolla (62E)','Hulankapolla (49C)','Idamegama (51B)','Kabillegama (52D)','Kalubululanda (51A)','Kandepuhulpola (51C)','Karagasthenna (61A)','Keppetipola (50D)','Ketakella (58A)','Koskanuwegama (58C)','Kotakithula (60C)','Landegama (52B)','Mahathenna (61C)','Maligathenna (62G)','Malpotha (60A)','Mawithikumbura (52C)','Medagedaragama (59C)','Merahawatta (60)','Nawela (59)','Nedungamuwa (52)','Ohiya (62A)','Ohiya Watta (62K)','Pahala Yalkumbura (59E)','Palugama Ella (50C)','Palugama Town (50)','Pitapola (62I)','Puhulpola (58B)','Puranwela (50I)','Rahangala (62F)','Rathkarawwa (62)','Silmiyapura (49B)','Thennakonwela (50B)','Udakandagolla (62J)','Udupeella (60D)','Vidurupola (49)','Wangiyakumbura (62D)','Welikadagama (60B)','Welimada Town (52A)','Welimadawatta (48C)','Yalpathwela (59B)']
  };

  const handleSeedGsDivisions = async () => {
    if (!confirm('This will add all GS divisions from the official GN list. Continue?')) return;
    setSeedingGs(true);
    let count = 0;
    try {
      for (const [ds, gsList] of Object.entries(gsSeedData)) {
        for (const gs of gsList) {
          await addDoc(collection(db, 'settings_gs_divisions'), { name: gs, dsDivision: ds, createdAt: serverTimestamp() });
          count++;
        }
      }
      alert(`Successfully added ${count} GS divisions!`);
      fetchGsDivisions();
    } catch (err) {
      alert('Error seeding: ' + err.message);
    } finally {
      setSeedingGs(false);
    }
  };

  const fetchGrantPolicy = async () => {
    try {
      const docRef = doc(db, 'settings', 'grant_policy');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setGrantPolicy(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching policy:", error);
    }
  };

  const updateGrantPolicy = async () => {
    setPolicyLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'grant_policy'), {
        ...grantPolicy,
        lastUpdated: serverTimestamp(),
        updatedBy: auth.currentUser?.email
      });
      alert("Grant policy updated successfully!");
    } catch (error) {
      alert("Error updating policy: " + error.message);
    } finally {
      setPolicyLoading(false);
    }
  };

  const fetchApprovalFlow = async () => {
    try {
      const docRef = doc(db, 'settings', 'approval_flow');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setApprovalFlow(docSnap.data());
      }
    } catch (error) {
      console.error("Error fetching approval flow:", error);
    }
  };

  const saveApprovalFlow = async () => {
    setApprovalFlowLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'approval_flow'), {
        ...approvalFlow,
        lastUpdated: serverTimestamp(),
        updatedBy: auth.currentUser?.email
      });
      alert("Approval flow settings updated successfully!");
    } catch (error) {
      alert("Error saving approval flow: " + error.message);
    } finally {
      setApprovalFlowLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const userList = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setUsers(userList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      await setDoc(doc(db, 'users', res.user.uid), {
        email: newUser.email,
        role: newUser.role,
        division: newUser.division,
        status: 'active',
        createdAt: serverTimestamp()
      });
      alert(`User created! System will reload.`);
      setIsModalOpen(false);
      window.location.reload(); 
    } catch (error) {
      alert("Creation Error: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (uid, newRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
      alert("Role updated");
    } catch (error) { alert(error.message); }
  };

  const handleUpdateDivision = async (uid, newDiv) => {
    try {
      await updateDoc(doc(db, 'users', uid), { division: newDiv });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, division: newDiv } : u));
      alert("Division updated");
    } catch (error) { alert(error.message); }
  };

  const handleToggleUserStatus = async (uid, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    const confirmMsg = newStatus === 'deactivated' 
      ? "Deactivating this user will block their system access but preserve all their previous records (applications, approvals, etc.). Proceed?"
      : "Reactivate this user?";
    
    if (!window.confirm(confirmMsg)) return;

    try {
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
      alert(`User account ${newStatus} successfully.`);
    } catch (error) { alert(error.message); }
  };

  if (loading) return <div style={{ padding: '4rem', textAlign: 'center' }}>Loading Governance Console...</div>;

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.5rem)', margin: 0 }}>System Governance</h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', marginTop: '0.4rem' }}>
            {activeSubTab === 'users' ? 'Staff Directory & Access Control' : 
             activeSubTab === 'records' ? 'Approved Grant Master Records' :
             activeSubTab === 'sectors' ? 'Regional Sector & Division Management' :
             activeSubTab === 'policy' ? 'Financial Granting Policies' : 
             activeSubTab === 'approval-flow' ? 'Approval Flow Configuration' :
             activeSubTab === 'dispatch' ? 'Final Dispatch & Account Authorization' : 'Scoring Rubric Configuration'}
          </p>
        </div>
        {activeSubTab === 'users' && (
          <button onClick={() => setIsModalOpen(true)} style={addBtnStyle}>
            <UserPlus size={20} /> Add Staff Member
          </button>
        )}
      </div>

           {(activeSubTab === 'records' || activeSubTab === 'dispatch') && (
        <div className="animate-fade-in">
          <div className="glass" style={{ padding: '2rem', borderRadius: '20px', overflowX: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '2rem', flexWrap: 'wrap' }}>
               <div>
                  <h3 style={{ margin: 0 }}>{activeSubTab === 'dispatch' ? 'Awaiting Dispatch to Accounts' : 'Approved Grant Master Records'}</h3>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    {activeSubTab === 'dispatch' 
                      ? 'Select applications to authorize and forward to the procurement/accounts department.' 
                      : 'Comprehensive list of all approved and processed applications.'}
                  </p>
               </div>
               <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                 {activeSubTab === 'dispatch' && selectedIds.length > 0 && (
                    <button 
                      onClick={handleForwardToAccount} 
                      disabled={isSubmitting}
                      style={{ ...addBtnStyle, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
                    >
                      <CheckCircle size={18} /> Forward {selectedIds.length} to Accounts
                    </button>
                 )}
                 <button onClick={exportCSV} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '0.6rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                   <Download size={18} /> {selectedIds.length > 0 ? `Export Selected (${selectedIds.length}) CSV` : 'Export CSV'}
                 </button>
                 <button onClick={exportPDF} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid rgba(168, 85, 247, 0.2)', padding: '0.6rem 1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}>
                   <FileText size={18} /> {selectedIds.length > 0 ? `Export Selected (${selectedIds.length}) PDF` : 'Export PDF'}
                 </button>
               </div>
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', flexWrap: 'wrap', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
               <div style={{ position: 'relative', flexGrow: 1, minWidth: '250px' }}>
                 <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                 <input 
                   type="text" 
                   placeholder="Search name, business or ID..." 
                   value={recordSearch} 
                   onChange={e => setRecordSearch(e.target.value)} 
                   style={{ ...searchStyle, background: 'rgba(0,0,0,0.2)' }} 
                 />
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '200px' }}>
                 <Filter size={18} color="#94a3b8" />
                 <select 
                   value={divisionFilter} 
                   onChange={e => setDivisionFilter(e.target.value)}
                   style={{ ...selectStyle, width: '100%', height: '45px' }}
                 >
                   <option value="all">All Divisions</option>
                   {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                 </select>
               </div>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '180px' }}>
                 <ArrowUpDown size={18} color="#94a3b8" />
                 <select 
                   value={scoreSort} 
                   onChange={e => setScoreSort(e.target.value)}
                   style={{ ...selectStyle, width: '100%', height: '45px' }}
                 >
                   <option value="desc">Score: High to Low</option>
                   <option value="asc">Score: Low to High</option>
                 </select>
               </div>

               <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.4rem 1.5rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center' }}>
                 {getFilteredRecords().length} APPLICATIONS
               </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1800px' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <th style={{ ...thStyle, width: '50px' }}>
                     <input 
                       type="checkbox" 
                       checked={selectedIds.length === getFilteredRecords().length && getFilteredRecords().length > 0} 
                       onChange={toggleSelectAll}
                     />
                  </th>
                  <th style={thStyle}>No</th>
                  <th style={thStyle}>ID No</th>
                  <th style={thStyle}>Full Name</th>
                  <th style={thStyle}>Business Name</th>
                  <th style={thStyle}>Phone</th>
                  <th style={thStyle}>Division</th>
                  <th style={thStyle}>DO Name</th>
                  <th style={thStyle}>Equipment</th>
                  <th style={thStyle}>Phase</th>
                  <th style={thStyle}>Score</th>
                  <th style={thStyle}>Total Cost</th>
                  <th style={thStyle}>Grant</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredRecords().map((app, idx) => {
                  const firstItem = app.equipment?.items?.[0] || {};
                  return (
                    <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="row-hover">
                      <td style={tdStyle}>
                         <input 
                           type="checkbox" 
                           checked={selectedIds.includes(app.id)} 
                           onChange={() => toggleSelect(app.id)} 
                         />
                      </td>
                      <td style={tdStyle}>{idx + 1}</td>
                      <td style={tdStyle}><code style={{ fontSize: '0.75rem', color: '#3b82f6' }}>{app.id.substring(0, 8)}</code></td>
                      <td style={tdStyle}><div style={{ fontWeight: 600 }}>{app.personal?.fullName}</div></td>
                      <td style={tdStyle}>{app.business?.businessName}</td>
                      <td style={tdStyle}>{app.personal?.phone}</td>
                      <td style={tdStyle}>{app.division}</td>
                      <td style={tdStyle}><div style={{ fontSize: '0.8rem', opacity: 0.7 }}>{app.officer?.email?.split('@')[0] || 'System'}</div></td>
                      <td style={tdStyle}>{firstItem.name || 'N/A'}</td>
                      <td style={tdStyle}>
                        <div style={{ 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontSize: '0.65rem', 
                          fontWeight: 700,
                          textAlign: 'center',
                          background: app.adminDispatch ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                          color: app.adminDispatch ? '#10b981' : '#3b82f6',
                          border: `1px solid ${app.adminDispatch ? '#10b981' : '#3b82f6'}`,
                          textTransform: 'uppercase'
                        }}>
                          {app.adminDispatch ? 'Sent to Accounts' : 'Awaiting Dispatch'}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 800, color: '#10b981' }}>{app.score}</span>
                      </td>
                      <td style={tdStyle}>LKR {(app.equipment?.totalGrant * 2 || 0).toLocaleString()}</td>
                      <td style={tdStyle}><div style={{ fontWeight: 800, color: '#10b981' }}>LKR {(app.equipment?.totalGrant || 0).toLocaleString()}</div></td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => setSelectedApp(app)}
                            style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#3b82f6', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600 }}
                          >
                            <Eye size={16} /> View
                          </button>
                          {app.adminDispatch && (
                             <button 
                               onClick={() => handleRecallFromAccount(app.id)}
                               style={{ background: '#f43f5e', border: 'none', color: '#fff', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(244, 63, 94, 0.2)' }}
                             >
                               Recall from Accounts
                             </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {getFilteredRecords().length === 0 && !appsLoading && (
              <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#64748b', background: 'rgba(255,255,255,0.01)', borderRadius: '15px' }}>
                <Search size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                <h3 style={{ margin: '0 0 0.5rem', color: '#94a3b8' }}>Queue is Empty</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>
                  {activeSubTab === 'dispatch' 
                    ? "Currently, no applications are awaiting final dispatch authorization." 
                    : "No records match your selected filters."}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'users' && (
        <div className="animate-fade-in">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ position: 'relative', maxWidth: '500px' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
              <input type="text" placeholder="Search staff..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={searchStyle} />
            </div>
          </div>
          <div className="glass" style={{ overflowX: 'auto', borderRadius: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                   <th style={thStyle}>Staff Member</th>
                   <th style={thStyle}>System Role</th>
                   <th style={thStyle}>Assigned Sector</th>
                   <th style={thStyle}>Control</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredUsers.map(user => (
                   <tr key={user.uid} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                     <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <div style={avatarStyle}><Mail size={16} /></div>
                          <div><div style={{ fontWeight: 600 }}>{user.email}</div></div>
                        </div>
                     </td>
                     <td style={tdStyle}>
                       <select value={user.role || ''} onChange={e => handleUpdateRole(user.uid, e.target.value)} style={selectStyle}>
                         {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                       </select>
                     </td>
                     <td style={tdStyle}>
                       <select value={user.division || ''} onChange={e => handleUpdateDivision(user.uid, e.target.value)} style={selectStyle}>
                         <option value="">Global/None</option>
                         {divisions.map(d => <option key={d} value={d}>{d}</option>)}
                       </select>
                     </td>
                     <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            fontSize: '0.65rem', 
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            background: user.status === 'deactivated' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: user.status === 'deactivated' ? '#f43f5e' : '#10b981',
                            border: `1px solid ${user.status === 'deactivated' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                            textTransform: 'uppercase'
                          }}>
                            {user.status || 'Active'}
                          </span>
                          <button 
                            onClick={() => handleToggleUserStatus(user.uid, user.status || 'active')}
                            style={{ 
                              background: 'transparent', 
                              border: 'none', 
                              color: user.status === 'deactivated' ? '#10b981' : '#f43f5e', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              fontSize: '0.75rem',
                              fontWeight: 600
                            }}
                          >
                            {user.status === 'deactivated' ? <CheckCircle size={14} /> : <X size={14} />} 
                            {user.status === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                          </button>
                        </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'sectors' && (
        <div className="animate-fade-in glass" style={{ padding: '3rem' }}>
           <h3>Regional Sector Management</h3>
           <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
             <input type="text" style={{ ...inputStyle, flexGrow: 1 }} placeholder="New division name..." value={newDivName} onChange={e => setNewDivName(e.target.value)} />
             <button onClick={handleAddDivision} style={addBtnStyle}>Add Sector</button>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
              {divisions.map(d => (
                <div key={d} className="glass" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                     <MapPin size={16} color="#3b82f6" />
                     <span style={{ fontWeight: 600 }}>{d}</span>
                   </div>
                   <button style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.5 }}><X size={16} /></button>
                </div>
              ))}
           </div>

           <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '3rem 0' }} />

           <h3>GS Division Management</h3>
           <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
             <select style={{ ...inputStyle, maxWidth: '250px' }} value={selectedGsDs} onChange={e => setSelectedGsDs(e.target.value)}>
               <option value="">Select DS Division</option>
               {divisions.map(d => <option key={d} value={d}>{d}</option>)}
             </select>
             <input type="text" style={{ ...inputStyle, flexGrow: 1, maxWidth: '300px' }} placeholder="New GS division name..." value={newGsName} onChange={e => setNewGsName(e.target.value)} />
             <button onClick={handleAddGsDivision} style={addBtnStyle}>Add GS Division</button>
           </div>
           <div style={{ marginBottom: '2rem' }}>
             <button onClick={handleSeedGsDivisions} disabled={seedingGs} style={{ ...addBtnStyle, background: seedingGs ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}>
               {seedingGs ? 'Seeding...' : 'Seed All GS Divisions from Official List'}
             </button>
           </div>
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {divisions.map(ds => {
                const gsList = gsDivisions.filter(g => g.dsDivision === ds);
                if (gsList.length === 0) return null;
                return (
                  <div key={ds} className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)' }}>
                    <h4 style={{ margin: '0 0 1rem', color: '#3b82f6', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={16} /> {ds}
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {gsList.map(gs => (
                        <span key={gs.name || gs.id} style={{ fontSize: '0.85rem', color: '#94a3b8', padding: '0.3rem 0.5rem', borderRadius: '4px', background: 'rgba(255,255,255,0.03)' }}>
                          {gs.name}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      )}

      {activeSubTab === 'policy' && (
        <div className="animate-fade-in">
          <div className="glass" style={{ padding: '2rem', borderRadius: '20px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="#3b82f6" /> Global Granting Policy
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', alignItems: 'flex-end' }}>
              <div>
                <label style={labelStyle}>Grant Percentage (%)</label>
                <input 
                  type="number" 
                  style={inputStyle} 
                  value={grantPolicy.percentage} 
                  onChange={e => setGrantPolicy({...grantPolicy, percentage: Number(e.target.value)})} 
                />
              </div>
              <div>
                <label style={labelStyle}>Maximum Grant Amount (LKR)</label>
                <input 
                  type="number" 
                  style={inputStyle} 
                  value={grantPolicy.maxAmount} 
                  onChange={e => setGrantPolicy({...grantPolicy, maxAmount: Number(e.target.value)})} 
                />
              </div>
              <button 
                onClick={updateGrantPolicy} 
                disabled={policyLoading}
                style={{ ...addBtnStyle, background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', height: '45px', justifyContent: 'center' }}
              >
                {policyLoading ? 'Updating...' : 'Save Policy Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'scoring' && (
        <div className="animate-fade-in glass" style={{ padding: '3rem' }}>
           <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={20} color="#a855f7" /> Detailed Scoring Rubric</h3>
           <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Configure the points awarded for each criterion based on the official selection criteria.</p>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
              {/* 1. Business Stability */}
              <div className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(59,130,246,0.15)' }}>
                <h4 style={{ margin: '0 0 0.3rem', color: '#3b82f6' }}>1. Business Stability & Growth</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Max 25 Points</p>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Business Name Registration</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.businessStability.nameReg} onChange={e => setScoringPolicy({...scoringPolicy, businessStability: {...scoringPolicy.businessStability, nameReg: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Trade License</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.businessStability.tradeLicense} onChange={e => setScoringPolicy({...scoringPolicy, businessStability: {...scoringPolicy.businessStability, tradeLicense: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Monthly Income (Max)</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.businessStability.incomeMax} onChange={e => setScoringPolicy({...scoringPolicy, businessStability: {...scoringPolicy.businessStability, incomeMax: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Bookkeeping / Financial Discipline</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.businessStability.bookkeeping} onChange={e => setScoringPolicy({...scoringPolicy, businessStability: {...scoringPolicy.businessStability, bookkeeping: Number(e.target.value)}})} />
                </div>
              </div>

              {/* 2. Professional Competency */}
              <div className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <h4 style={{ margin: '0 0 0.3rem', color: '#10b981' }}>2. Professional Competency</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Max 25 Points</p>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>NVQ 3 / Recognized Certificate</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.professionalCompetency.nvq3} onChange={e => setScoringPolicy({...scoringPolicy, professionalCompetency: {...scoringPolicy.professionalCompetency, nvq3: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>NVQ 4 / Degree</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.professionalCompetency.nvq4Degree} onChange={e => setScoringPolicy({...scoringPolicy, professionalCompetency: {...scoringPolicy.professionalCompetency, nvq4Degree: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Experience 1-5 Years</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.professionalCompetency.exp1to5} onChange={e => setScoringPolicy({...scoringPolicy, professionalCompetency: {...scoringPolicy.professionalCompetency, exp1to5: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Experience 5-7 Years</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.professionalCompetency.exp5to7} onChange={e => setScoringPolicy({...scoringPolicy, professionalCompetency: {...scoringPolicy.professionalCompetency, exp5to7: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Experience 7-10 Years</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.professionalCompetency.exp7to10} onChange={e => setScoringPolicy({...scoringPolicy, professionalCompetency: {...scoringPolicy.professionalCompetency, exp7to10: Number(e.target.value)}})} />
                </div>
              </div>

              {/* 3. Household Status */}
              <div className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(245,158,11,0.15)' }}>
                <h4 style={{ margin: '0 0 0.3rem', color: '#f59e0b' }}>3. Household Social Status</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Max 15 Points</p>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Young Entrepreneur (&lt; 35 Years)</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.householdStatus.youngEntrepreneur} onChange={e => setScoringPolicy({...scoringPolicy, householdStatus: {...scoringPolicy.householdStatus, youngEntrepreneur: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Special Needs (Widow/Disabled)</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.householdStatus.specialNeeds} onChange={e => setScoringPolicy({...scoringPolicy, householdStatus: {...scoringPolicy.householdStatus, specialNeeds: Number(e.target.value)}})} />
                </div>
              </div>

              {/* 4. Economic Contribution */}
              <div className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <h4 style={{ margin: '0 0 0.3rem', color: '#8b5cf6' }}>4. Economic Contribution</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Max 25 Points</p>
                <div style={{ marginBottom: '0.5rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Job Creation (Excl. Owner)</label>
                   <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                     <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', opacity: 0.5 }}>1–5 Employees</label>
                       <input type="number" style={inputStyle} value={scoringPolicy.economicContribution.emp1to5} onChange={e => setScoringPolicy({...scoringPolicy, economicContribution: {...scoringPolicy.economicContribution, emp1to5: Number(e.target.value)}})} />
                     </div>
                     <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', opacity: 0.5 }}>5–7 Employees</label>
                       <input type="number" style={inputStyle} value={scoringPolicy.economicContribution.emp5to7} onChange={e => setScoringPolicy({...scoringPolicy, economicContribution: {...scoringPolicy.economicContribution, emp5to7: Number(e.target.value)}})} />
                     </div>
                     <div style={{ flex: 1 }}><label style={{ fontSize: '0.7rem', opacity: 0.5 }}>7+ Employees</label>
                       <input type="number" style={inputStyle} value={scoringPolicy.economicContribution.empOver7} onChange={e => setScoringPolicy({...scoringPolicy, economicContribution: {...scoringPolicy.economicContribution, empOver7: Number(e.target.value)}})} />
                     </div>
                   </div>
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Non-Traditional Industry</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.economicContribution.nonTraditional} onChange={e => setScoringPolicy({...scoringPolicy, economicContribution: {...scoringPolicy.economicContribution, nonTraditional: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Quality / Value Addition</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.economicContribution.qualityValueAdd} onChange={e => setScoringPolicy({...scoringPolicy, economicContribution: {...scoringPolicy.economicContribution, qualityValueAdd: Number(e.target.value)}})} />
                </div>
              </div>

              {/* 5. Special Awards */}
              <div className="glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(244,63,94,0.15)' }}>
                <h4 style={{ margin: '0 0 0.3rem', color: '#f43f5e' }}>5. Special Awards & Achievements</h4>
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Max 10 Points</p>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>Regional Level Award</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.specialAwards.regional} onChange={e => setScoringPolicy({...scoringPolicy, specialAwards: {...scoringPolicy.specialAwards, regional: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>District / Provincial Award</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.specialAwards.district} onChange={e => setScoringPolicy({...scoringPolicy, specialAwards: {...scoringPolicy.specialAwards, district: Number(e.target.value)}})} />
                </div>
                <div style={{ marginBottom: '0.8rem' }}>
                   <label style={{ fontSize: '0.8rem', opacity: 0.7 }}>National Level Award</label>
                   <input type="number" style={inputStyle} value={scoringPolicy.specialAwards.national} onChange={e => setScoringPolicy({...scoringPolicy, specialAwards: {...scoringPolicy.specialAwards, national: Number(e.target.value)}})} />
                </div>
              </div>
           </div>

           <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', flexWrap: 'wrap' }}>
               <button 
                 onClick={recalculateAllScores}
                 disabled={recalculating}
                 style={{ ...addBtnStyle, background: '#eab308', padding: '1rem 2rem' }}
               >
                 {recalculating ? 'Recalculating...' : 'Recalculate All Scores'}
               </button>
               <button 
                 onClick={updateScoringPolicy} 
                 disabled={scoringLoading}
                 style={{ ...addBtnStyle, background: '#a855f7', padding: '1rem 3rem' }}
               >
                 {scoringLoading ? 'Applying Changes...' : 'Save Scoring Rubric'}
               </button>
            </div>
        </div>
      )}

      {activeSubTab === 'scoring-board' && (
        <div className="animate-fade-in glass" style={{ padding: '3rem', overflowX: 'auto' }}>
           <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <List size={20} color="#3b82f6" /> Master Score Board
           </h3>
           <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>Detailed breakdown of scores for every application.</p>

           {(() => {
             const skipBoth = approvalFlow.skipDsReview && approvalFlow.skipDirectorReview;
             const skipEither = approvalFlow.skipDsReview || approvalFlow.skipDirectorReview;
             const filtered = skipEither
               ? allApps
               : allApps.filter(app => !['pending_ds', 'pending_director'].includes(app.status));

             return (
               <>
                 {!skipEither && (
                   <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                     Showing only applications that have passed DS or Director review. 
                     <a href="#" onClick={(e) => { e.preventDefault(); setActiveSubTab('approval-flow'); }} style={{ color: '#3b82f6', marginLeft: '0.5rem' }}>Change approval flow settings</a>
                   </p>
                 )}
                 <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1200px' }}>
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <th style={thStyle}>No</th>
                        <th style={thStyle}>ID No</th>
                        <th style={thStyle}>Full Name</th>
                        <th style={thStyle}>Business Name</th>
                        <th style={thStyle}>Bus. Stability (25)</th>
                        <th style={thStyle}>Prof. Competency (25)</th>
                        <th style={thStyle}>Household Status (15)</th>
                        <th style={thStyle}>Econ. Contribution (25)</th>
                        <th style={thStyle}>Special Awards (10)</th>
                        <th style={thStyle}>Total Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((app, idx) => {
                        return (
                          <tr key={app.id} onClick={() => setSelectedApp(app)} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', cursor: 'pointer' }} className="row-hover">
                            <td style={tdStyle}>{idx + 1}</td>
                            <td style={tdStyle}><code style={{ fontSize: '0.75rem', color: '#3b82f6' }}>{app.id.substring(0, 8)}</code></td>
                            <td style={tdStyle}>{app.personal?.fullName || 'N/A'}</td>
                            <td style={tdStyle}>{app.business?.businessName || 'N/A'}</td>
                            <td style={tdStyle}>{app.scoreBreakdown?.businessStability || 0}</td>
                            <td style={tdStyle}>{app.scoreBreakdown?.professionalCompetency || 0}</td>
                            <td style={tdStyle}>{app.scoreBreakdown?.householdStatus || 0}</td>
                            <td style={tdStyle}>{app.scoreBreakdown?.economicContribution || 0}</td>
                            <td style={tdStyle}>{app.scoreBreakdown?.specialAwards || 0}</td>
                            <td style={tdStyle}><span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.2rem' }}>{app.score || 0}</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                 </table>
                 {filtered.length === 0 && (
                    <div style={{ padding: '6rem 2rem', textAlign: 'center', color: '#64748b' }}>
                      No applications found.
                    </div>
                 )}
               </>
             );
           })()}
        </div>
      )}

      {activeSubTab === 'approval-flow' && (
        <div className="animate-fade-in glass" style={{ padding: '2.5rem', maxWidth: '700px' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} color="#3b82f6" /> Approval Flow Configuration
          </h3>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>
            Configure which approval stages to skip. When a stage is skipped, applications bypass that review step automatically.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Skip DS Review</h4>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Applications go directly to Director review after DO submission.
                </p>
              </div>
              <button
                onClick={() => setApprovalFlow(prev => ({ ...prev, skipDsReview: !prev.skipDsReview }))}
                style={{
                  width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: approvalFlow.skipDsReview ? '#10b981' : '#334155',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '3px',
                  left: approvalFlow.skipDsReview ? '27px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem' }}>Skip Director Review</h4>
                <p style={{ margin: '0.3rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Applications go directly to Admin dispatch after DS approval.
                </p>
              </div>
              <button
                onClick={() => setApprovalFlow(prev => ({ ...prev, skipDirectorReview: !prev.skipDirectorReview }))}
                style={{
                  width: '52px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: approvalFlow.skipDirectorReview ? '#10b981' : '#334155',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0
                }}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '3px',
                  left: approvalFlow.skipDirectorReview ? '27px' : '3px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </div>

          <button
            onClick={saveApprovalFlow}
            disabled={approvalFlowLoading}
            style={{
              padding: '0.8rem 2rem', background: 'linear-gradient(135deg, #1f4e79 0%, #2e75b6 100%)',
              color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            {approvalFlowLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div style={modalOverlayStyle} onClick={() => setIsModalOpen(false)}>
            <motion.div className="glass" style={modalContentStyle} onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <h3 style={{ margin: 0 }}>Enroll New Staff</h3>
                  <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X /></button>
               </div>
               <form onSubmit={handleCreateUser}>
                  <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Email</label><input type="email" required style={inputStyle} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} /></div>
                  <div style={{ marginBottom: '1.5rem' }}><label style={labelStyle}>Password</label><input type="password" required minLength={6} style={inputStyle} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                    <div><label style={labelStyle}>Role</label><select style={inputStyle} value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>{roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}</select></div>
                    <div><label style={labelStyle}>Sector</label><select style={inputStyle} value={newUser.division} onChange={e => setNewUser({...newUser, division: e.target.value})}><option value="">Select Division</option>{divisions.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  </div>
                  <button type="submit" disabled={isSubmitting} style={{ width: '100%', padding: '1rem', background: '#3b82f6', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{isSubmitting ? 'Processing...' : 'Create Account'}</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin App Preview Modal */}
      <AnimatePresence>
        {selectedApp && (
          <div style={modalOverlayStyle} onClick={() => setSelectedApp(null)}>
            <motion.div 
               className="glass" 
               style={{ ...modalContentStyle, maxWidth: '800px', padding: '2.5rem' }} 
               onClick={e => e.stopPropagation()} 
               initial={{ opacity: 0, y: 30 }} 
               animate={{ opacity: 1, y: 0 }} 
               exit={{ opacity: 0, y: 30 }}
            >
               <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Application Dossier</h3>
                    <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem', opacity: 0.6 }}>ID: {selectedApp.id}</p>
                  </div>
                  <button onClick={() => setSelectedApp(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X /></button>
               </div>

               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <h4 style={{ color: '#3b82f6', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Applicant Information</h4>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Name:</strong> {selectedApp.personal?.fullName}</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>NIC:</strong> {selectedApp.personal?.nic}</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Phone:</strong> {selectedApp.personal?.phone}</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Address:</strong> {selectedApp.personal?.address}</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>DS Division:</strong> {selectedApp.personal?.dsDivision || 'N/A'}</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>GS Division:</strong> {selectedApp.personal?.gsDivision || 'N/A'}</p>
                  </div>
                  <div>
                    <h4 style={{ color: '#3b82f6', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Business & Scoring</h4>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Business:</strong> {selectedApp.business?.businessName}</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Sector:</strong> {selectedApp.business?.sector}</p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Final Score:</strong> <span style={{ color: '#10b981', fontWeight: 800 }}>{selectedApp.score} Pts</span></p>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.5rem' }}><strong>Division:</strong> {selectedApp.division}</p>
                    {(() => {
                      const { detailed } = calculateScore(selectedApp);
                      return selectedApp.scoreBreakdown && (
                        <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: '#94a3b8' }}>
                          <p style={{ margin: '0 0 0.4rem 0', fontWeight: 600, color: '#3b82f6' }}>Detailed Score Breakdown:</p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
                            
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem', marginBottom: '0.3rem' }}>
                                <span>Business Stability & Growth:</span>
                                <strong>{selectedApp.scoreBreakdown.businessStability || 0} / 25</strong>
                              </div>
                              {detailed?.businessStability?.map((d, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8, paddingLeft: '1rem' }}><span>- {d.label}</span><span>+{d.score}</span></div>)}
                            </div>
                            
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem', marginBottom: '0.3rem' }}>
                                <span>Professional Competency:</span>
                                <strong>{selectedApp.scoreBreakdown.professionalCompetency || 0} / 25</strong>
                              </div>
                              {detailed?.professionalCompetency?.map((d, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8, paddingLeft: '1rem' }}><span>- {d.label}</span><span>+{d.score}</span></div>)}
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem', marginBottom: '0.3rem' }}>
                                <span>Household Status & Social:</span>
                                <strong>{selectedApp.scoreBreakdown.householdStatus || 0} / 15</strong>
                              </div>
                              {detailed?.householdStatus?.map((d, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8, paddingLeft: '1rem' }}><span>- {d.label}</span><span>+{d.score}</span></div>)}
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem', marginBottom: '0.3rem' }}>
                                <span>Economic Contribution:</span>
                                <strong>{selectedApp.scoreBreakdown.economicContribution || 0} / 25</strong>
                              </div>
                              {detailed?.economicContribution?.map((d, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8, paddingLeft: '1rem' }}><span>- {d.label}</span><span>+{d.score}</span></div>)}
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.2rem', marginBottom: '0.3rem' }}>
                                <span>Special Awards & Recognition:</span>
                                <strong>{selectedApp.scoreBreakdown.specialAwards || 0} / 10</strong>
                              </div>
                              {detailed?.specialAwards?.map((d, i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.8, paddingLeft: '1rem' }}><span>- {d.label}</span><span>+{d.score}</span></div>)}
                            </div>

                          </div>
                        </div>
                      );
                    })()}
                  </div>
               </div>

                <div style={{ marginTop: '2rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                      <h4 style={{ color: '#3b82f6', margin: 0 }}>Equipment & Grant Details</h4>
                      {(selectedApp.equipment?.quotationUrl || selectedApp.equipment?.items?.[0]?.quotationUrl || selectedApp.equipment?.items?.[0]?.quotationData) && (
                        <a 
                          href={selectedApp.equipment.quotationUrl || selectedApp.equipment.items[0].quotationUrl || selectedApp.equipment.items[0].quotationData} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none', background: 'rgba(16, 185, 129, 0.1)', padding: '0.3rem 0.8rem', borderRadius: '6px' }}
                        >
                          <ExternalLink size={14} /> View Quotation
                        </a>
                      )}
                   </div>
                  <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '10px' }}>
                    {(selectedApp.equipment?.items || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <span>
                          {item.name} ({item.brand} {item.model}) x {item.qty}
                          {(item.quotationUrl || item.quotationData) && (
                            <a href={item.quotationUrl || item.quotationData} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', marginLeft: '10px', fontSize: '0.75rem' }}>[View Attachment]</a>
                          )}
                        </span>
                        <span>LKR {(item.qty * item.unitPrice).toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span>APPROVED GRANT AMOUNT:</span>
                      <span style={{ color: '#10b981' }}>LKR {(selectedApp.equipment?.totalGrant || 0).toLocaleString()}</span>
                    </div>
                  </div>
               </div>

               <button 
                  onClick={() => setSelectedApp(null)}
                  style={{ width: '100%', marginTop: '2rem', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', cursor: 'pointer' }}
               >
                 Close Preview
               </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


export default AdminModule;
