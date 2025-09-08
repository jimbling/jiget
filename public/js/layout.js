// public/js/sidebar.js

document.addEventListener("DOMContentLoaded", function () {
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.toggle('-translate-x-full');
        if (overlay) overlay.classList.toggle('hidden');
    }

    // Pasang event listener ke tombol yang memicu toggle
    const toggleBtn = document.querySelector('[data-toggle-sidebar]');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
});
