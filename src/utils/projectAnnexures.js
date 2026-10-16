const col = (key, labelKey, input = 'text', numeric = false) => ({ key, labelKey, input, numeric });

export const PROJECT_ANNEXURES = [
  {
    id: 'project-maintenance',
    type: 'maintenance',
    titleKey: 'projectMaintenance.title',
    subtitleKey: 'projectMaintenance.subtitle',
    formTitleKey: 'projectMaintenance.formTitle',
    totalKey: 'projectMaintenance.total',
    columns: [
      col('refNo', 'projectMaintenance.colNo'),
      col('institution', 'projectMaintenance.colInstitution'),
      col('nature', 'projectMaintenance.colNature'),
      col('estimate', 'projectMaintenance.colEstimate', 'number', true)
    ]
  },
  {
    id: 'project-building',
    type: 'building',
    titleKey: 'projectBuilding.title',
    subtitleKey: 'projectBuilding.subtitle',
    formTitleKey: 'projectBuilding.formTitle',
    totalKey: 'projectBuilding.total',
    columns: [
      col('refNo', 'projectBuilding.colNo'),
      col('institution', 'projectBuilding.colInstitution'),
      col('nature', 'projectBuilding.colNature'),
      col('estimate', 'projectBuilding.colEstimate', 'number', true)
    ]
  },
  {
    id: 'project-goods',
    type: 'goods',
    titleKey: 'projectGoods.title',
    subtitleKey: 'projectGoods.subtitle',
    formTitleKey: 'projectGoods.formTitle',
    totalKey: 'projectGoods.total',
    columns: [
      col('refNo', 'projectGoods.colNo'),
      col('institution', 'projectGoods.colInstitution'),
      col('details', 'projectGoods.colDetails'),
      col('estimate', 'projectGoods.colEstimate', 'number', true)
    ]
  },
  {
    id: 'project-other',
    type: 'other',
    titleKey: 'projectOther.title',
    subtitleKey: 'projectOther.subtitle',
    formTitleKey: 'projectOther.formTitle',
    totalKey: 'projectOther.total',
    columns: [
      col('refNo', 'projectOther.colNo'),
      col('institution', 'projectOther.colInstitution'),
      col('details', 'projectOther.colDetails'),
      col('estimate', 'projectOther.colEstimate', 'number', true)
    ]
  }
];

export function getAnnexureById(id) {
  return PROJECT_ANNEXURES.find(a => a.id === id) || null;
}
