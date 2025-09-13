document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('detailModal');
  const detailContent = document.getElementById('detailContent');
  const closeBtnTop = document.getElementById('modalCloseBtn');
  const closeBtnBottom = document.getElementById('modalCloseBtnBottom');

  const openModal = () => modal.classList.remove('hidden');
  const closeModal = () => modal.classList.add('hidden');

  // Tutup modal
  closeBtnTop.addEventListener('click', closeModal);
  closeBtnBottom.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(); // klik area gelap juga menutup modal
  });

  // Event listener tombol detail
  document.querySelectorAll('.btn-detail').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const broadcastId = btn.dataset.id;
      openModal();
      detailContent.innerHTML = `<p class="text-gray-500">⏳ Memuat data...</p>`;

      try {
       const res = await fetch(`/broadcast/${broadcastId}/logs`);
        const data = await res.json();

        if (data.logs.length === 0) {
          detailContent.innerHTML = `<p class="text-gray-500">Belum ada log untuk broadcast ini.</p>`;
          return;
        }

        detailContent.innerHTML = data.logs.map(log => `
          <div class="flex justify-between items-center p-2 border rounded-lg">
            <div>
              <p class="font-medium">${log.contact_name || 'Tanpa Nama'}</p>
              <p class="text-xs text-gray-500">${log.phone}</p>
            </div>
            <span class="
              text-xs font-semibold px-2 py-1 rounded-full
              ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
            ">
              ${log.status === 'sent' ? 'Terkirim' : 'Gagal'}
            </span>
          </div>
        `).join('');
      } catch (err) {
        detailContent.innerHTML = `<p class="text-red-500">Gagal memuat log</p>`;
        console.error('Error load logs:', err);
      }
    });
  });
});


document.addEventListener("DOMContentLoaded", () => {
  const btnDeleteAll = document.getElementById("btn-delete-all");
  if (!btnDeleteAll) return;

  btnDeleteAll.addEventListener("click", async () => {
    const result = await Swal.fire({
      title: 'Apakah Anda yakin?',
      text: "Semua broadcast dan log akan dihapus permanen!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Ya, hapus semua!',
      cancelButtonText: 'Batal'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch('/broadcast/delete-all', { method: 'DELETE' });
        const data = await res.json();

        if (data.success) {
          // SweetAlert2 Toast
          Swal.fire({
            toast: true,
            position: 'top-end', // pojok kanan atas
            icon: 'success',
            title: data.message,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });

          // Reload halaman setelah toast muncul
          setTimeout(() => location.reload(), 2100);
        } else {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'error',
            title: data.message,
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
          });
        }
      } catch (err) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'error',
          title: 'Terjadi kesalahan server',
          showConfirmButton: false,
          timer: 2000,
          timerProgressBar: true
        });
      }
    }
  });
});
