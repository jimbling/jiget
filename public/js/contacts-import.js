

document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('importModal');
  const btnOpenModal = document.getElementById('btnOpenImportModal');
  const btnCloseModal = document.getElementById('btnCloseModalImport');
  const fileInput = document.getElementById('fileImport');
  const fileNamePreview = document.getElementById('fileNamePreview');
  const btnSubmitImport = document.getElementById('btnSubmitImport');
  let selectedFile = null;

  // Open modal
  btnOpenModal.addEventListener('click', () => {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  });

  // Close modal
  btnCloseModal.addEventListener('click', () => {
    modal.classList.remove('flex');
    modal.classList.add('hidden');
    resetModal();
  });

  // File chosen
  fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
      fileNamePreview.textContent = `📂 File dipilih: ${selectedFile.name}`;
      fileNamePreview.classList.remove('hidden');
      btnSubmitImport.disabled = false;
    } else {
      fileNamePreview.classList.add('hidden');
      btnSubmitImport.disabled = true;
    }
  });

  // Submit Import
  btnSubmitImport.addEventListener('click', async () => {
    if (!selectedFile) return;

    Swal.fire({
      title: 'Mengupload...',
      text: 'Mohon tunggu sementara file sedang diproses',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/contacts/import', { method: 'POST', body: formData });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        Swal.fire('Gagal!', 'Server mengembalikan respon tidak valid.', 'error');
        return;
      }

      const data = await res.json();
      if (data.success) {
        Swal.fire({
          toast: true,
          icon: 'success',
          title: `${data.count} kontak berhasil diimport`,
          position: 'top-end',
          showConfirmButton: false,
          timer: 2500,
          timerProgressBar: true
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        Swal.fire({
          toast: true,
          icon: 'error',
          title: data.message || 'Gagal import',
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000
        });
      }
    } catch (err) {
      console.error('[contacts-import.js] 💥 Import Error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Terjadi kesalahan!',
        text: 'Cek console log untuk detail.',
      });
    }
  });

  function resetModal() {
    fileInput.value = '';
    fileNamePreview.classList.add('hidden');
    btnSubmitImport.disabled = true;
    selectedFile = null;
  }
});
