document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const root = document.documentElement;

  if (!themeToggle || !themeIcon) return;

  // Cek tema tersimpan di localStorage
  if (localStorage.getItem('theme') === 'dark') {
    root.classList.add('dark');
    themeIcon.classList.replace('fa-moon', 'fa-sun');
  }

  // Event toggle
  themeToggle.addEventListener('click', () => {
    root.classList.toggle('dark');
    const isDark = root.classList.contains('dark');
    themeIcon.classList.toggle('fa-sun', isDark);
    themeIcon.classList.toggle('fa-moon', !isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});
