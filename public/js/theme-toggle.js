document.addEventListener('DOMContentLoaded', () => {
  
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const root = document.documentElement;

  if (!themeToggle || !themeIcon) return;

  // Set icon awal sesuai tema tersimpan
  const isDark = root.classList.contains('dark');
  themeIcon.classList.toggle('fa-sun', isDark);
  themeIcon.classList.toggle('fa-moon', !isDark);

  // Event toggle klik
  themeToggle.addEventListener('click', () => {
    root.classList.toggle('dark');
    const nowDark = root.classList.contains('dark');
    themeIcon.classList.toggle('fa-sun', nowDark);
    themeIcon.classList.toggle('fa-moon', !nowDark);
    localStorage.setItem('theme', nowDark ? 'dark' : 'light');
  });
});
