import { getTranslation } from '../i18n';

const SLUG_TO_I18N_KEY = {
  nvq3: 'nvq3',
  nvq4: 'nvq4',
  degree: 'degree'
};

export function getQualificationValue(training) {
  const t = training || {};
  const raw = t.qualification ?? t.nvqLevel ?? t.degree ?? '';
  return String(raw).trim();
}

export function getQualificationLabel(training, language = 'en') {
  const raw = getQualificationValue(training);
  if (!raw) return '';

  const key = SLUG_TO_I18N_KEY[raw.toLowerCase()];
  if (!key) return raw;

  const label = getTranslation(`application.training.${key}`, language);
  return label.startsWith('application.training.') ? raw : label;
}
