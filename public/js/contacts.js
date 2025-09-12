document.addEventListener('DOMContentLoaded', () => {
  // ====== Elemen utama ======
  const selectAll = document.getElementById('select-all');
  const btnHapus = document.getElementById('btnHapusTerpilih');
  const bulkDeleteForm = document.getElementById('bulk-delete-form');
  const contactsTbody = document.querySelector('#contactsTable tbody');

  const modalTambah = document.getElementById('modalTambah');
  const btnTambah = document.getElementById('btnTambah');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const formTambah = document.getElementById('formTambah');

  const modalEdit = document.getElementById('modalEdit');
  const btnCloseEditModal = document.getElementById('btnCloseEditModal');
  const formEdit = document.getElementById('formEdit');

  // ====== Utility: toggle tombol hapus ======
  function toggleBulkButton() {
  const selected = document.querySelectorAll('.row-checkbox:checked');
  if (btnHapus) {
    if (selected.length === 0) {
      btnHapus.classList.add('opacity-40', 'cursor-not-allowed');
    } else {
      btnHapus.classList.remove('opacity-40', 'cursor-not-allowed');
    }
  }
}


  // Inisialisasi pertama
  toggleBulkButton();

  // ====== Select All behavior ======
  if (selectAll) {
    selectAll.addEventListener('change', () => {
      const allCheckboxes = document.querySelectorAll('.row-checkbox');
      allCheckboxes.forEach(cb => { cb.checked = selectAll.checked; });
      toggleBulkButton();
    });
  }

  // ====== Delegate checkbox change (checkbox individual) ======
  document.addEventListener('change', (e) => {
    if (e.target && e.target.matches('.row-checkbox')) {
      toggleBulkButton();

      // update status selectAll (checked jika semua checked)
      const all = document.querySelectorAll('.row-checkbox');
      const checked = document.querySelectorAll('.row-checkbox:checked');
      if (selectAll) selectAll.checked = (all.length > 0 && checked.length === all.length);
    }
  });

  // ====== Hapus Terpilih (button) ======
if (btnHapus) {
  btnHapus.addEventListener('click', async (e) => {
    e.preventDefault();

    const selectedCheckboxes = Array.from(document.querySelectorAll('.row-checkbox:checked'));
    const ids = selectedCheckboxes.map(cb => cb.value);

    // Jika tidak ada yang dipilih => peringatan
    if (ids.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Tidak ada kontak yang dipilih",
        text: "Pilih minimal satu kontak untuk dihapus.",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    // Konfirmasi sebelum hapus
    const confirmResult = await Swal.fire({
      title: `Hapus ${ids.length} kontak?`,
      text: "Data yang dihapus tidak bisa dikembalikan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33"
    });

    if (!confirmResult.isConfirmed) return;

    try {
      const res = await fetch("/contacts/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: JSON.stringify({ ids })
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: data.message || "Kontak berhasil dihapus",
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        // Hapus baris di DOM
        ids.forEach(id => {
          const cb = document.querySelector(`.row-checkbox[value="${id}"]`);
          if (cb) cb.closest('tr').remove();
        });

        // Reset select-all checkbox
        const selectAll = document.getElementById('select-all');
        if (selectAll) selectAll.checked = false;

        // Nonaktifkan tombol hapus
        btnHapus.disabled = true;
      } else {
        Swal.fire("Gagal", data.message || "Gagal menghapus kontak", "error");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Terjadi kesalahan server", "error");
    }
  });
}


  // Jika form disubmit (mis. via keyboard), arahkan ke handler tombol supaya konsisten
  if (bulkDeleteForm) {
    bulkDeleteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (btnHapus) btnHapus.click();
    });
  }

  // ====== Modal Tambah ======
  if (btnTambah && modalTambah) {
    btnTambah.addEventListener('click', () => {
      modalTambah.classList.remove('hidden');
      modalTambah.classList.add('flex');
    });
  }
  if (btnCloseModal && modalTambah) {
    btnCloseModal.addEventListener('click', () => {
      modalTambah.classList.add('hidden');
      modalTambah.classList.remove('flex');
    });
  }

  // ====== Tambah Data (AJAX) ======
  if (formTambah) {
    formTambah.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const res = await fetch(formTambah.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({
            name: formTambah.name.value,
            phone_number: formTambah.phone_number.value
          })
        });

        const data = await res.json();

        if (data.success) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 2000, timerProgressBar: true });
          formTambah.reset();
          if (modalTambah) { modalTambah.classList.add('hidden'); modalTambah.classList.remove('flex'); }
          if (data.contact) {
            appendRow(data.contact);
            toggleBulkButton();
          }
        } else {
          Swal.fire('Gagal', data.message, 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Terjadi kesalahan server', 'error');
      }
    });
  }

  // ====== Append Row (safe binding) ======
  function appendRow(contact) {
    if (!contactsTbody) return;

    const tr = document.createElement('tr');
    tr.classList.add('hover:bg-gray-50', 'transition-colors', 'duration-150');

    tr.innerHTML = `
      <td class="py-4 px-6 whitespace-nowrap">
        <input type="checkbox" name="ids[]" value="${contact.id}" class="row-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500">
      </td>
      <td class="py-4 px-6 whitespace-nowrap">
        <div class="flex items-center">
          <div class="h-10 w-10 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            <span class="font-medium text-blue-800">${contact.name ? contact.name.charAt(0).toUpperCase() : '?'}</span>
          </div>
          <div class="text-sm font-medium text-gray-900 name-cell">${contact.name || '-'}</div>
        </div>
      </td>
      <td class="py-4 px-6 whitespace-nowrap">
        <div class="text-sm phone-cell">${contact.phone_number || '-'}</div>
      </td>
      <td class="py-4 px-6 whitespace-nowrap text-center">
        <div class="flex justify-center space-x-2">
          <a href="#" class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 btnEdit" 
             data-id="${contact.id}"
             data-name="${contact.name || ''}"
             data-phone="${contact.phone_number || ''}">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </a>
        </div>
      </td>
    `;

    contactsTbody.prepend(tr);

    // bind checkbox change for newly added checkbox
    const cb = tr.querySelector('.row-checkbox');
    if (cb) cb.addEventListener('change', toggleBulkButton);
  }

  // ====== Delegated click: Edit buttons (single handler) ======
  document.addEventListener('click', (e) => {
    const btnEdit = e.target.closest('.btnEdit');
    if (btnEdit) {
      e.preventDefault();
      const id = btnEdit.dataset.id;
      const name = btnEdit.dataset.name || '';
      const phone = btnEdit.dataset.phone || '';

      // populate edit form (if ada)
      if (formEdit) {
        formEdit.edit_id.value = id;
        formEdit.edit_name.value = name;
        formEdit.edit_phone_number.value = phone;
      }

      if (modalEdit) {
        modalEdit.classList.remove('hidden');
        modalEdit.classList.add('flex');
      }
    }
  });

  // ====== Modal Edit close ======
  if (btnCloseEditModal && modalEdit) {
    btnCloseEditModal.addEventListener('click', () => {
      modalEdit.classList.add('hidden');
      modalEdit.classList.remove('flex');
    });
  }

  // ====== Submit Edit (AJAX) ======
  if (formEdit) {
    formEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = formEdit.edit_id.value;
      const name = formEdit.edit_name.value;
      const phone_number = formEdit.edit_phone_number.value;

      try {
        const res = await fetch(`/contacts/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          body: JSON.stringify({ name, phone_number })
        });

        const data = await res.json();

        if (data.success) {
          Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: data.message, showConfirmButton: false, timer: 2000, timerProgressBar: true });

          // Update row in table
          const cb = document.querySelector(`.row-checkbox[value="${id}"]`);
          if (cb) {
            const row = cb.closest('tr');
            if (row) {
              const nameCell = row.querySelector('.name-cell');
              const phoneCell = row.querySelector('.phone-cell');
              if (nameCell) nameCell.textContent = name || '-';
              if (phoneCell) phoneCell.textContent = phone_number || '-';

              // update data attributes of edit button
              const btn = row.querySelector('.btnEdit');
              if (btn) {
                btn.dataset.name = name;
                btn.dataset.phone = phone_number;
              }
            }
          }

          if (modalEdit) {
            modalEdit.classList.add('hidden');
            modalEdit.classList.remove('flex');
          }
        } else {
          Swal.fire('Gagal', data.message, 'error');
        }
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Terjadi kesalahan server', 'error');
      }
    });
  }

  // ====== AJAX pagination (sisa dari script lama) ======
  document.addEventListener('click', async function (e) {
    const link = e.target.closest('.pagination-link');
    if (!link) return;

    e.preventDefault();
    const page = link.dataset.page;

    try {
      const res = await fetch(`/contacts?page=${page}`, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });

      const data = await res.json();
      if (data.success) {
        const tbody = document.querySelector('#contactsTable tbody');
        tbody.innerHTML = '';
        data.contacts.forEach(contact => appendRow(contact));
        updatePagination(data.pagination.currentPage, data.pagination.totalPages);
      }
    } catch (err) {
      console.error(err);
    }
  });

  function updatePagination(currentPage, totalPages) {
    const container = document.getElementById('paginationContainer');
    if (!container) return;
    container.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const a = document.createElement('a');
      a.href = `?page=${i}`;
      a.dataset.page = i;
      a.className = `pagination-link px-4 py-2 border rounded-lg ${i === currentPage ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`;
      a.textContent = i;
      container.appendChild(a);
    }
  }

}); // end DOMContentLoaded
