document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('importModal');
  const modalContent = modal.querySelector('div'); // ambil box putih
  const btnOpenModal = document.getElementById('btnOpenImportModal');
  const btnCloseModal = document.getElementById('btnCloseModalImport');
  const fileInput = document.getElementById('fileImport');
  const fileNamePreview = document.getElementById('fileNamePreview');
  const btnSubmitImport = document.getElementById('btnSubmitImport');
  let selectedFile = null;

  function openModal() {
    modal.classList.remove('hidden');
    setTimeout(() => {
      modal.classList.add('flex');
      modalContent.classList.remove('scale-95', 'opacity-0');
      modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
  }

  function closeModal() {
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
      modal.classList.remove('flex');
      modal.classList.add('hidden');
      resetModal();
    }, 200);
  }

  btnOpenModal.addEventListener('click', openModal);
  btnCloseModal.addEventListener('click', closeModal);

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
