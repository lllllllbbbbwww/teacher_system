export function getChartColors() {
  const s = getComputedStyle(document.documentElement);
  return {
    text: s.getPropertyValue('--text').trim() || '#e2e8f0',
    textSub: s.getPropertyValue('--text-sub').trim() || '#94a3b8',
    textMuted: s.getPropertyValue('--text-muted').trim() || '#64748b',
    border: s.getPropertyValue('--el-border-color').trim() || '#3b4c6e',
    borderLight: s.getPropertyValue('--el-border-color-lighter').trim() || '#1e2a40',
    bgOverlay: s.getPropertyValue('--el-bg-color-overlay').trim() || '#151f31',
    bg: s.getPropertyValue('--bg').trim() || '#0f172a',
    panel: s.getPropertyValue('--panel').trim() || '#111827',
  };
}
