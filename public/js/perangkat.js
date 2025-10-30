document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ perangkat.js dimuat");

    const disconnectBtn = document.querySelector('.disconnect-btn');
    console.log("Hasil querySelector:", disconnectBtn);

    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', () => {
            console.log("✅ Tombol disconnect diklik");
        });
    }
});


document.addEventListener("DOMContentLoaded", function () {
    const qrContainer = document.querySelector('#qr-container');
    const deviceId = document.body.dataset.deviceId;
    const isConnected = document.body.dataset.isConnected === "true";

    // ===== QR Refresh =====
    if (qrContainer && !isConnected) {
        let retryCount = 0;
        const maxRetries = 30;

        const qrInterval = setInterval(async () => {
            if (retryCount >= maxRetries) {
                clearInterval(qrInterval);
                qrContainer.innerHTML = `
                    <div class="text-center text-gray-600">
                        <i class="fas fa-exclamation-triangle text-2xl text-yellow-500 mb-2"></i>
                        <p>Timeout. Silakan refresh halaman untuk mencoba lagi.</p>
                    </div>
                `;
                return;
            }

            try {
                const res = await fetch(`/device/${deviceId}/qr`);
                const data = await res.json();

                if (data.connected) {
                    qrContainer.innerHTML = `
                        <div class="text-center">
                            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <i class="fas fa-check text-2xl text-green-600"></i>
                            </div>
                            <p class="text-green-600 font-medium">Berhasil terhubung!</p>
                            <p class="text-sm text-gray-600 mt-1">Mengalihkan...</p>
                        </div>
                    `;
                    clearInterval(qrInterval);
                    setTimeout(() => location.reload(), 2000);
                } else if (data.qr) {
                    qrContainer.innerHTML = `<img class="w-full h-full" src="${data.qr}" alt="QR Code WhatsApp" />`;
                }

                retryCount++;
            } catch (error) {
                console.error('Error fetching QR:', error);
                retryCount++;
            }
        }, 1000);
    }

    // ===== Copy Token =====
    const copyBtn = document.getElementById('copy-token-btn');
    const tokenInput = document.getElementById('token-input');
    if (copyBtn && tokenInput) {
        copyBtn.addEventListener('click', () => {
            tokenInput.select();
            tokenInput.setSelectionRange(0, 99999);

            navigator.clipboard.writeText(tokenInput.value)
                .then(() => {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'success',
                        title: 'Token berhasil disalin!',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                })
                .catch(() => {
                    Swal.fire({
                        toast: true,
                        position: 'top-end',
                        icon: 'error',
                        title: 'Gagal menyalin token!',
                        showConfirmButton: false,
                        timer: 2000,
                        timerProgressBar: true
                    });
                });
        });
    }

    // ===== Disconnect Button (Event Binding) =====
const disconnectBtn = document.querySelector('.disconnect-btn');
if (disconnectBtn) {
    disconnectBtn.addEventListener('click', async (event) => {
  const result = await Swal.fire({
    title: 'Yakin ingin memutuskan perangkat ini?',
    text: 'Tindakan ini akan memutus koneksi WhatsApp dari server.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya, putuskan',
    cancelButtonText: 'Batal'
  });

  if (!result.isConfirmed) return;

  const button = event.currentTarget;
  const deviceId = button.dataset.deviceId;
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
  button.disabled = true;

  try {
    const res = await fetch(`/device/${deviceId}/disconnect`, { method: 'POST' });
    const data = await res.json();

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: data.success ? 'success' : 'error',
      title: data.message,
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

    if (data.success) setTimeout(() => location.reload(), 2000);
    else {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Terjadi kesalahan saat memutus perangkat',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });
    button.innerHTML = originalText;
    button.disabled = false;
  }
});

}

});
