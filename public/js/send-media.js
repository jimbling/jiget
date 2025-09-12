document.addEventListener('DOMContentLoaded', () => {
  const TOKEN = document.body.dataset.token;
  const mediaForm = document.getElementById('mediaForm');
  const fileInput = document.getElementById('file');
  const dropZone = document.getElementById('dropZone');
  const preview = document.getElementById('preview');
  const progressWrapper = document.getElementById('progressWrapper');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');

  const allowedExtensions = ['jpg','jpeg','png','gif','mp4','mov','pdf','docx','zip','rar'];
  const maxFileSizeMB = 10;

  // Drop zone events
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-green-400', 'bg-green-50');
  });
  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-green-400', 'bg-green-50');
  });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileInput.files = e.dataTransfer.files;
    showPreview(fileInput.files[0]);
    dropZone.classList.remove('border-green-400', 'bg-green-50');
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length) showPreview(fileInput.files[0]);
  });

  function showPreview(file) {
    preview.innerHTML = '';
    preview.classList.remove('hidden');
    const ext = file.name.split('.').pop().toLowerCase();
    if (['jpg','jpeg','png','gif'].includes(ext)) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.className = "max-h-40 mx-auto rounded-lg shadow";
      preview.appendChild(img);
    } else {
      preview.innerHTML = `<p class="text-sm text-gray-600">${file.name} (${(file.size/1024/1024).toFixed(2)} MB)</p>`;
    }
  }

  mediaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!fileInput.files.length) return Swal.fire({ icon: 'error', title: 'Pilih file terlebih dahulu', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

    const file = fileInput.files[0];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) return Swal.fire({ icon: 'error', title: `Ekstensi file tidak diizinkan: .${ext}`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    if (file.size > maxFileSizeMB * 1024 * 1024) return Swal.fire({ icon: 'error', title: `File terlalu besar. Maksimal ${maxFileSizeMB} MB`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

    const formData = new FormData(mediaForm);

    try {
      btnText.textContent = 'Mengirim...';
      btnSpinner.classList.remove('hidden');
      progressWrapper.classList.remove('hidden');
      progressBar.style.width = '0%';

      const res = await fetch('/api/wa/send-media', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        body: formData
      });

      const data = await res.json();
      Swal.fire({ icon: data.success ? 'success' : 'error', title: data.success ? `Media berhasil dikirim!` : `Error: ${data.error}`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });

      if (data.success) {
        mediaForm.reset();
        preview.classList.add('hidden');
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: `Error: ${err.message}`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } finally {
      btnText.textContent = 'Kirim Media';
      btnSpinner.classList.add('hidden');
      progressWrapper.classList.add('hidden');
    }
  });
});
