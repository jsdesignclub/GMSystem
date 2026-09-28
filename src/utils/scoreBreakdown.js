import { calculateScore } from './calculateScore';

const CAT_ORDER = [
  { key: 'businessStability', max: 25 },
  { key: 'professionalCompetency', max: 25 },
  { key: 'householdStatus', max: 15 },
  { key: 'economicContribution', max: 25 },
  { key: 'specialAwards', max: 10 }
];

const CATEGORY_LABELS = {
  en: {
    businessStability: 'Business Stability & Growth',
    professionalCompetency: 'Professional Competency',
    householdStatus: 'Household Status & Social',
    economicContribution: 'Economic Contribution & Innovation',
    specialAwards: 'Special Awards & Recognition'
  },
  si: {
    businessStability: 'ව්‍යාපාර ස්ථාවරත්වය සහ වර්ධනය',
    professionalCompetency: 'වෘත්තීය නිපුණතාව',
    householdStatus: 'ගෘහස්ථ තත්ත්වය සහ සමාජ',
    economicContribution: 'ආර්ථික දායකත්වය',
    specialAwards: 'විශේෂ සම්මාන සහ පිළිගැනීම්'
  }
};

const ITEM_LABELS = {
  en: {
    'Business Name & Reg': 'Business Name & Reg',
    'Trade License': 'Trade License',
    'Financial Discipline (Bookkeeping)': 'Financial Discipline (Bookkeeping)',
    'Education (NVQ 4 / Degree)': 'Education (NVQ 4 / Degree)',
    'Education (NVQ 3)': 'Education (NVQ 3)',
    'Industry Experience': 'Industry Experience',
    'Youth Entrepreneurship (< 35)': 'Youth Entrepreneurship (< 35)',
    'Special Social Considerations': 'Special Social Considerations',
    'Monthly Income (Development Source)': 'Monthly Income (Development Source)',
    'Job Creation': 'Job Creation',
    'Non-Traditional Industry': 'Non-Traditional Industry',
    'Product Quality/Certification': 'Product Quality/Certification',
    'Regional Award': 'Regional Award',
    'District Award': 'District Award',
    'National Award': 'National Award'
  },
  si: {
    'Business Name & Reg': 'ව්‍යාපාර නම සහ ලියාපදිංචිය',
    'Trade License': 'වෙළඳ බලපත්‍රය',
    'Financial Discipline (Bookkeeping)': 'මූල්‍ය විනය (ගිණුම් තබා ගැනීම)',
    'Education (NVQ 4 / Degree)': 'අධ්‍යාපනය (NVQ 4 / උපාධිය)',
    'Education (NVQ 3)': 'අධ්‍යාපනය (NVQ 3)',
    'Industry Experience': 'කර්මාන්ත පළපුරුද්ද',
    'Youth Entrepreneurship (< 35)': 'තරුණ ව්‍යවසායකත්වය (< 35)',
    'Special Social Considerations': 'විශේෂ සමාජ සලකා බැලීම්',
    'Monthly Income (Development Source)': 'මාසික ආදායම (සංවර්ධන ප්‍රභවය)',
    'Job Creation': 'රැකියා උත්පාදනය',
    'Non-Traditional Industry': 'සම්ප්‍රදායික නොවන කර්මාන්තය',
    'Product Quality/Certification': 'නිෂ්පාදන ගුණාත්මකභාවය/සහතිකය',
    'Regional Award': 'ප්‍රාදේශීය සම්මානය',
    'District Award': 'දිස්ත්‍රික් සම්මානය',
    'National Award': 'ජාතික සම්මානය'
  }
};

export function getScoreBreakdownTable(app, language = 'en') {
  if (!app || !app.scoreBreakdown) return null;
  const { detailed } = calculateScore(app);
  const catLbl = CATEGORY_LABELS[language] || CATEGORY_LABELS.en;
  const itemLbl = ITEM_LABELS[language] || ITEM_LABELS.en;

  return CAT_ORDER.map(({ key, max }) => ({
    key,
    label: catLbl[key] || key,
    total: app.scoreBreakdown[key] || 0,
    max,
    items: ((detailed && detailed[key]) || []).map((it) => ({
      label: itemLbl[it.label] || it.label,
      score: it.score
    }))
  }));
}