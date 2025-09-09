document.addEventListener('DOMContentLoaded', function () {
    const dropdownBtns = document.querySelectorAll('.dropdown-btn');

    dropdownBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const menu = btn.nextElementSibling;
            if (!menu) return;

            // Toggle hidden class saja
            menu.classList.toggle('hidden');

            // Rotate chevron
            const icon = btn.querySelector('i.fa-chevron-down');
            if (icon) icon.classList.toggle('rotate-180');
        });
    });
});
