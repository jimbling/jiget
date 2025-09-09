document.addEventListener('DOMContentLoaded', () => {
  const TOKEN = document.body.dataset.token;
  const mediaForm = document.getElementById('mediaForm');
  const fileInput = document.getElementById('file');

  // Validasi frontend: ekstensi & ukuran
  const allowedExtensions = ['jpg','jpeg','png','gif','mp4','mov','pdf','docx','zip','rar'];
  const maxFileSizeMB = 10;

  mediaForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const number = document.getElementById('number').value;
    const caption = document.getElementById('caption').value;

    if (!fileInput.files.length) {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Pilih file terlebih dahulu',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }

    const file = fileInput.files[0];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(ext)) {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: `Ekstensi file tidak diizinkan: .${ext}`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      return Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: `File terlalu besar. Maksimal ${maxFileSizeMB} MB`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }

    const formData = new FormData();
    formData.append('number', number);
    formData.append('caption', caption);
    formData.append('file', file);

    try {
      const res = await fetch('/api/wa/send-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        body: formData
      });

      const data = await res.json();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: data.success ? 'success' : 'error',
        title: data.success
          ? `Media berhasil dikirim ke ${data.number}`
          : `Error: ${data.error}`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      if (data.success) mediaForm.reset();

    } catch (err) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: `Error: ${err.message}`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });
    }
  });
});
