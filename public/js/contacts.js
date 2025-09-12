document.addEventListener('DOMContentLoaded', () => {
  const selectAll = document.getElementById('select-all');
  const btnHapus = document.getElementById('btnHapusTerpilih');
  const bulkDeleteForm = document.getElementById("bulk-delete-form");

// ================= Select All =================
if (selectAll) {
  selectAll.addEventListener('change', () => {
    // Ambil semua checkbox saat ini, termasuk yang baru ditambahkan
    const allCheckboxes = document.querySelectorAll('.row-checkbox');
    allCheckboxes.forEach(cb => cb.checked = selectAll.checked);
    toggleBulkButton();
  });
}

// Gunakan event delegation untuk toggleBulkButton
document.addEventListener('change', function(e) {
  if (e.target.classList.contains('row-checkbox')) {
    toggleBulkButton();
  }
});

function toggleBulkButton() {
  const selected = document.querySelectorAll('.row-checkbox:checked');
  if (btnHapus) btnHapus.disabled = selected.length === 0;
}


  // ================= Modal Tambah =================
  const modal = document.getElementById('modalTambah');
  const btnTambah = document.getElementById('btnTambah');
  const btnCloseModal = document.getElementById('btnCloseModal');

  if (btnTambah && modal) {
    btnTambah.addEventListener('click', () => {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    });
  }

  if (btnCloseModal && modal) {
    btnCloseModal.addEventListener('click', () => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    });
  }

  // ================= Tambah Data =================
  const formTambah = document.getElementById('formTambah');
  if (formTambah) {
    formTambah.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(formTambah);

      try {
       const res = await fetch(formTambah.action, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: formTambah.name.value,
    phone_number: formTambah.phone_number.value
  })
});

        const data = await res.json();

        if (data.success) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: data.message,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });

          formTambah.reset();
          if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
          }

          if (data.contact) appendRow(data.contact);
        } else {
          Swal.fire('Gagal', data.message, 'error');
        }

      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'Terjadi kesalahan server', 'error');
      }
    });
  }

  // ================= Bulk Delete =================
  if (bulkDeleteForm) {
    bulkDeleteForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const ids = Array.from(document.querySelectorAll(".row-checkbox:checked"))
        .map(cb => cb.value);

      if (ids.length === 0) {
        Swal.fire("Pilih Kontak", "Tidak ada kontak yang dipilih.", "warning");
        return;
      }

      Swal.fire({
        title: `Hapus ${ids.length} kontak?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Ya, hapus!",
        cancelButtonText: "Batal",
        confirmButtonColor: "#d33"
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const res = await fetch("/contacts/bulk-delete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ ids })
            });

            const data = await res.json();

            if (data.success) {
              Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: data.message,
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
              });

              ids.forEach(id => {
                const row = document.querySelector(`.row-checkbox[value="${id}"]`);
                if (row) row.closest('tr').remove();
              });

              if (selectAll) selectAll.checked = false;
              toggleBulkButton();
            } else {
              Swal.fire("Gagal", data.message, "error");
            }

          } catch (err) {
            console.error(err);
            Swal.fire("Error", "Terjadi kesalahan server", "error");
          }
        }
      });
    });
  }

// ================= Fungsi Tambah Row Baru =================
function appendRow(contact) {
  const tbody = document.querySelector('#contactsTable tbody');
  if (!tbody) return;

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
        <div class="text-sm font-medium text-gray-900">${contact.name || '-'}</div>
      </div>
    </td>
    <td class="py-4 px-6 whitespace-nowrap">
      <div class="text-sm text-gray-900">${contact.phone_number || '-'}</div>
    </td>
    <td class="py-4 px-6 whitespace-nowrap text-center">
      <div class="flex justify-center space-x-2">
        <a href="#" class="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 btnEdit" 
           data-id="${contact.id}"
           data-name="${contact.name}"
           data-phone="${contact.phone_number}">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </a>
        
      </div>
    </td>
  `;

  // Tambah row baru di atas
  tbody.prepend(tr);

  // Bind event checkbox baru
  tr.querySelector('.row-checkbox').addEventListener('change', toggleBulkButton);

  // Bind event tombol edit baru (agar modal edit bisa muncul)
  const btnEdit = tr.querySelector('.btnEdit');
  if (btnEdit) {
    btnEdit.addEventListener('click', (e) => {
      e.preventDefault();
      openEditModal({
        id: btnEdit.dataset.id,
        name: btnEdit.dataset.name,
        phone: btnEdit.dataset.phone
      });
    });
  }
}

document.addEventListener('click', function(e) {
  const btnEdit = e.target.closest('.btnEdit');
  if (!btnEdit) return; // klik bukan tombol edit

  e.preventDefault();

  const id = btnEdit.dataset.id;
  const name = btnEdit.dataset.name;
  const phone = btnEdit.dataset.phone;

  document.getElementById('edit_id').value = id;
  document.getElementById('edit_name').value = name;
  document.getElementById('edit_phone_number').value = phone;

  modalEdit.classList.remove('hidden');
  modalEdit.classList.add('flex');
});


// ================= Modal Edit =================
const modalEdit = document.getElementById('modalEdit');
const btnCloseEditModal = document.getElementById('btnCloseEditModal');
const formEdit = document.getElementById('formEdit');

document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btnEdit')) {
    e.preventDefault();
    const id = e.target.dataset.id;
    const name = e.target.dataset.name;
    const phone = e.target.dataset.phone;

    document.getElementById('edit_id').value = id;
    document.getElementById('edit_name').value = name;
    document.getElementById('edit_phone_number').value = phone;

    modalEdit.classList.remove('hidden');
    modalEdit.classList.add('flex');
  }
});

if (btnCloseEditModal && modalEdit) {
  btnCloseEditModal.addEventListener('click', () => {
    modalEdit.classList.add('hidden');
    modalEdit.classList.remove('flex');
  });
}

// ================= Submit Edit =================
if (formEdit) {
  formEdit.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = formEdit.edit_id.value;
    const name = formEdit.edit_name.value;
    const phone_number = formEdit.edit_phone_number.value;

    try {
      const res = await fetch(`/contacts/${id}`, {
        method: 'POST', // sesuaikan dengan route update
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone_number })
      });

      const data = await res.json();

      if (data.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: data.message,
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });

        // Update row di tabel tanpa reload
        const row = document.querySelector(`.row-checkbox[value="${id}"]`).closest('tr');
        row.children[1].textContent = name;
        row.children[2].textContent = phone_number;

        modalEdit.classList.add('hidden');
        modalEdit.classList.remove('flex');
      } else {
        Swal.fire('Gagal', data.message, 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Terjadi kesalahan server', 'error');
    }
  });
}



});
