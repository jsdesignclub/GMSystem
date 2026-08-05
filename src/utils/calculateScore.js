export function calculateScore(data) {
  const breakdown = {
    businessStability: 0,
    professionalCompetency: 0,
    householdStatus: 0,
    economicContribution: 0,
    specialAwards: 0
  };

  const detailed = {
    businessStability: [],
    professionalCompetency: [],
    householdStatus: [],
    economicContribution: [],
    specialAwards: []
  };

  const personal = data.personal || {};
  const business = data.business || {};
  const training = data.training || {};
  const production = data.production || {};

  // --- 1. Business Stability & Growth Potential (Max 25 Marks) ---
  if (business.businessName && business.businessName.trim() !== '' && business.regNo && business.regNo.trim() !== '') {
    breakdown.businessStability += 10;
    detailed.businessStability.push({ label: 'Business Name & Reg', score: 10 });
  }
  if (business.licenseNo && business.licenseNo.trim() !== '') {
    breakdown.businessStability += 5;
    detailed.businessStability.push({ label: 'Trade License', score: 5 });
  }
  const estIncome = Number(production.estimatedIncome) || 0;
  const prodCost = Number(production.productionCost) || 0;
  const netIncome = estIncome - prodCost;
  
  let incomeScore = 0;
  if (netIncome >= 5000 && netIncome <= 10000) incomeScore = 1;
  else if (netIncome > 10000 && netIncome <= 15000) incomeScore = 2;
  else if (netIncome > 15000 && netIncome <= 20000) incomeScore = 3;
  else if (netIncome > 20000 && netIncome <= 30000) incomeScore = 4;
  else if (netIncome > 30000) incomeScore = 5;
  
  if (incomeScore > 0) {
    breakdown.businessStability += incomeScore;
    detailed.businessStability.push({ label: 'Monthly Income', score: incomeScore });
  }

  if (business.hasBookkeeping === 'yes') {
    breakdown.businessStability += 5;
    detailed.businessStability.push({ label: 'Financial Discipline (Bookkeeping)', score: 5 });
  }

  // --- 2. Professional Competency (Max 25 Marks) ---
  const qualification = training.qualification || '';
  if (qualification === 'nvq4' || qualification === 'degree') {
    breakdown.professionalCompetency += 10;
    detailed.professionalCompetency.push({ label: 'Education (NVQ 4 / Degree)', score: 10 });
  } else if (qualification === 'nvq3') {
    breakdown.professionalCompetency += 5;
    detailed.professionalCompetency.push({ label: 'Education (NVQ 3)', score: 5 });
  }

  const exp = Number(training.experienceYears) || 0;
  let expScore = 0;
  if (exp >= 7 && exp <= 10) expScore = 10;
  else if (exp >= 5 && exp < 7) expScore = 7;
  else if (exp >= 1 && exp < 5) expScore = 5;
  else if (exp > 10) expScore = 10;

  if (expScore > 0) {
    breakdown.professionalCompetency += expScore;
    detailed.professionalCompetency.push({ label: 'Industry Experience', score: expScore });
  }

  // --- 3. Household Economic & Social Status (Max 15 Marks) ---
  if (personal.dob) {
    const birthDate = new Date(personal.dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    
    if (age < 35) {
      breakdown.householdStatus += 10;
      detailed.householdStatus.push({ label: 'Youth Entrepreneurship (< 35)', score: 10 });
    }
  }
  
  if (personal.maritalStatus === 'widowed' || personal.specialConsideration === 'disabled') {
    breakdown.householdStatus += 5;
    detailed.householdStatus.push({ label: 'Special Social Considerations', score: 5 });
  }

  // --- 4. Economic Contribution & Innovation (Max 25 Marks) ---
  const employees = Number(business.employeeCount) || 0;
  let empScore = 0;
  if (employees >= 8) empScore = 10;
  else if (employees >= 6) empScore = 7;
  else if (employees >= 1) empScore = 5;

  if (empScore > 0) {
    breakdown.economicContribution += empScore;
    detailed.economicContribution.push({ label: 'Job Creation', score: empScore });
  }

  const sector = (business.sector || '').toLowerCase();
  const isTraditional = sector.includes('tailoring') || sector.includes('garment') || sector.includes('furniture') || sector.includes('wood');
  if (sector && !isTraditional) {
    breakdown.economicContribution += 10;
    detailed.economicContribution.push({ label: 'Non-Traditional Industry', score: 10 });
  }

  if (production.hasQualityCert === 'yes') {
    breakdown.economicContribution += 5;
    detailed.economicContribution.push({ label: 'Product Quality/Certification', score: 5 });
  }

  // --- 5. Special Awards & Recognition (Max 10 Marks) ---
  let awardScore = 0;
  if (training.awardRegional) {
    awardScore += 2;
    detailed.specialAwards.push({ label: 'Regional Award', score: 2 });
  }
  if (training.awardDistrict) {
    awardScore += 3;
    detailed.specialAwards.push({ label: 'District Award', score: 3 });
  }
  if (training.awardNational) {
    awardScore += 5;
    detailed.specialAwards.push({ label: 'National Award', score: 5 });
  }
  
  if (awardScore > 10) awardScore = 10;
  breakdown.specialAwards = awardScore;

  const totalScore = 
    breakdown.businessStability + 
    breakdown.professionalCompetency + 
    breakdown.householdStatus + 
    breakdown.economicContribution + 
    breakdown.specialAwards;

  return { totalScore, breakdown, detailed };
}
