document.addEventListener('DOMContentLoaded', () => {
  const groupForm = document.getElementById('groupForm');
  const groupIdInput = document.getElementById('group_id');
  const groupNameInput = document.getElementById('group_name');
  const contactSelect = document.getElementById('contactSelect');
  const groupsTableBody = document.getElementById('groupsTableBody');

  // ================= Tambah / Update Grup =================
if (groupForm) {
  groupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const group_id = groupIdInput.value;
    const name = groupNameInput.value.trim();
    const contact_ids = Array.from(contactSelect.selectedOptions).map(opt => opt.value);

    try {
      const res = await fetch('/groups/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id, name, contact_ids })
      });

      const rawText = await res.text(); // ⬅️ Ambil mentahan dulu
      console.log("📡 [DEBUG] Raw Response dari server:", rawText);

      let data;
      try {
        data = JSON.parse(rawText); // ⬅️ coba parse manual
      } catch (parseErr) {
        console.error("❌ [ERROR] Response bukan JSON, ini yang diterima:", rawText);
        Swal.fire({
          icon: 'error',
          title: 'Response bukan JSON',
          text: 'Cek console untuk melihat detail error dari server.'
        });
        return; // hentikan eksekusi supaya tidak error lagi
      }

      // kalau berhasil parse JSON
      if (data.success) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: data.message,
          showConfirmButton: false,
          timer: 2000
        });

        // Reset form
        groupForm.reset();
        groupIdInput.value = '';

        // Tambah / update row di tabel
        updateOrAppendRow(data.group, data.members);
      } else {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: data.message,
          showConfirmButton: false,
          timer: 2000
        });
      }

    } catch (err) {
      console.error("🔥 [FETCH ERROR]", err);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Terjadi kesalahan server',
        showConfirmButton: false,
        timer: 2000
      });
    }
  });
}


  // ================= Edit Grup =================
  groupsTableBody.addEventListener('click', (e) => {
    const btn = e.target.closest('.editGroupBtn');
    if (!btn) return;

    groupIdInput.value = btn.dataset.id;
    groupNameInput.value = btn.dataset.name;

    const members = btn.dataset.members ? btn.dataset.members.split(',') : [];
    Array.from(contactSelect.options).forEach(opt => {
      opt.selected = members.includes(opt.value);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // ================= Hapus Grup =================
  groupsTableBody.addEventListener('click', async (e) => {
    const btn = e.target.closest('.deleteGroupBtn');
    if (!btn) return;

    const row = btn.closest('tr');
    const groupId = row.dataset.id;

    Swal.fire({
      title: 'Hapus Grup?',
      text: 'Grup ini akan dihapus permanen beserta anggotanya.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus',
      cancelButtonText: 'Batal'
    }).then(async (result) => {
      if (!result.isConfirmed) return;

      try {
        const res = await fetch(`/groups/${groupId}/delete`, { method: 'POST' });
        const data = await res.json();

        if (data.success) {
          row.remove();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: data.message,
            showConfirmButton: false,
            timer: 2000
          });
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: data.message,
            showConfirmButton: false,
            timer: 2000
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Terjadi kesalahan server',
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  });

  // ================= Helper =================
  function updateOrAppendRow(group, members) {
  let row = groupsTableBody.querySelector(`tr[data-id="${group.id}"]`);

  // Buat ulang badge anggota (sesuai style di views)
  const membersHtml = members.length
    ? members
        .map(
          (m) => `
            <span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
              ${m.name}
            </span>
          `
        )
        .join('')
    : `<span class="text-gray-400 italic">Tidak ada anggota</span>`;

  if (row) {
    // Update row yang sudah ada
    row.querySelector('td:nth-child(1)').textContent = group.name;
    row.querySelector('td.group-members').innerHTML = membersHtml;

    const editBtn = row.querySelector('.editGroupBtn');
    editBtn.dataset.name = group.name;
    editBtn.dataset.members = members.map((m) => m.id).join(',');
  } else {
    // Tambahkan row baru dengan markup yang seragam
    const tr = document.createElement('tr');
    tr.dataset.id = group.id;
    tr.className = 'hover:bg-gray-50 transition';

    tr.innerHTML = `
      <td class="px-4 py-3 font-medium text-gray-800">${group.name}</td>
      <td class="px-4 py-3 group-members flex flex-wrap gap-1">${membersHtml}</td>
      <td class="px-4 py-3 text-center space-x-2">
        <button class="editGroupBtn text-blue-600 hover:text-blue-800 transition"
                data-id="${group.id}" 
                data-name="${group.name}" 
                data-members="${members.map((m) => m.id).join(',')}">
          <i class="fa-solid fa-pen-to-square"></i>
        </button>
        <button class="deleteGroupBtn text-red-600 hover:text-red-800 transition">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;

    groupsTableBody.prepend(tr);
  }
}

});
