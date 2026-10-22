/* زبان و تم پیش از رندر (بدون اسکریپت درون‌خطی تا CSP سخت‌گیرانه بماند) */
// Pre-hydration lang and theme setup to prevent layout/theme flash
try {
  const savedLang = localStorage.getItem('hg_lang') || 'fa';
  document.documentElement.lang = savedLang;
  document.documentElement.dir = savedLang === 'fa' ? 'rtl' : 'ltr';
  // 'system' (یا مقدار نامعتبر) باید پیش از رندر به light/dark واقعی تبدیل شود.
  const storedTheme = localStorage.getItem('hg_theme');
  const preference = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'system';
  const effectiveTheme = preference === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : preference;
  document.documentElement.setAttribute('data-theme', effectiveTheme);
  document.documentElement.style.colorScheme = effectiveTheme;
} catch (e) {}
