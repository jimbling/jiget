document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ perangkat.js dimuat");

    const deviceId = document.body.dataset.deviceId;
    const isConnected = document.body.dataset.isConnected === "true";
    const qrContainer = document.querySelector('#qr-container');

    /* ------------------------------
     * 1️⃣ Toggle Token Visibility
     * ------------------------------ */
    const toggleTokenBtn = document.getElementById('toggle-token-visibility');
    const tokenInput = document.getElementById('token-input');
    
    if (toggleTokenBtn && tokenInput) {
        toggleTokenBtn.addEventListener('click', () => {
            const isPassword = tokenInput.type === 'password';
            tokenInput.type = isPassword ? 'text' : 'password';
            toggleTokenBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            toggleTokenBtn.setAttribute('title', isPassword ? 'Sembunyikan token' : 'Tampilkan token');
        });
    }

    /* ------------------------------
     * 2️⃣ Refresh QR code otomatis
     * ------------------------------ */
    if (qrContainer && !isConnected) {
        let retryCount = 0;
        const maxRetries = 30;
        let qrInterval;

        const fetchQRCode = async () => {
            if (retryCount >= maxRetries) {
                clearInterval(qrInterval);
                qrContainer.innerHTML = `
                    <div class="text-center text-gray-600 p-4">
                        <i class="fas fa-exclamation-triangle text-2xl text-yellow-500 mb-2"></i>
                        <p class="font-medium">Timeout</p>
                        <p class="text-sm mt-1">Silakan refresh halaman untuk mencoba lagi.</p>
                    </div>
                `;
                return;
            }

            try {
                const res = await fetch(`/device/${deviceId}/qr`);
                const data = await res.json();

                if (data.connected) {
                    qrContainer.innerHTML = `
                        <div class="text-center p-4">
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
                    qrContainer.innerHTML = `<img class="w-full h-full rounded-lg" src="${data.qr}" alt="QR Code WhatsApp" />`;
                    retryCount = 0; // Reset counter jika QR berhasil dimuat
                }

                retryCount++;
            } catch (error) {
                console.error('Error fetching QR:', error);
                retryCount++;
            }
        };

        // Jalankan pertama kali
        fetchQRCode();
        
        // Set interval untuk refresh QR
        qrInterval = setInterval(fetchQRCode, 15000);

        // Tombol refresh QR manual
        const refreshQrBtn = document.querySelector('.refresh-qr-btn');
        if (refreshQrBtn) {
            refreshQrBtn.addEventListener('click', () => {
                retryCount = 0;
                fetchQRCode();
                
                // Tampilkan feedback
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'QR Code diperbarui',
                    showConfirmButton: false,
                    timer: 1500,
                    timerProgressBar: true
                });
            });
        }
    }

    /* ------------------------------
     * 3️⃣ Tombol Salin Token
     * ------------------------------ */
    const copyBtn = document.getElementById('copy-token-btn');

    if (copyBtn && tokenInput) {
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(tokenInput.value);
                
                // Ubah sementara tampilan tombol
                const originalHTML = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check mr-1"></i> Tersalin!';
                copyBtn.classList.remove('bg-whatsapp-500', 'hover:bg-whatsapp-600');
                copyBtn.classList.add('bg-green-500', 'hover:bg-green-600');
                
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Token berhasil disalin!',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
                
                // Kembalikan tampilan tombol setelah 2 detik
                setTimeout(() => {
                    copyBtn.innerHTML = originalHTML;
                    copyBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
                    copyBtn.classList.add('bg-whatsapp-500', 'hover:bg-whatsapp-600');
                }, 2000);
                
            } catch (err) {
                console.error(err);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Gagal menyalin token!',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
            }
        });
    }

    /* ------------------------------
     * 4️⃣ Tombol Putuskan Koneksi
     * ------------------------------ */
    const disconnectButtons = document.querySelectorAll('.disconnect-btn');

    disconnectButtons.forEach((button) => {
        button.addEventListener('click', async (event) => {
            const deviceId = button.dataset.deviceId;
            if (!deviceId) {
                console.error("❌ device-id tidak ditemukan pada tombol:", button);
                return;
            }

            const result = await Swal.fire({
                title: 'Yakin ingin memutuskan perangkat ini?',
                text: 'Tindakan ini akan memutus koneksi WhatsApp dari server.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6B7280',
                confirmButtonText: 'Ya, putuskan',
                cancelButtonText: 'Batal',
                reverseButtons: true
            });

            if (!result.isConfirmed) return;

            const originalHTML = button.innerHTML;
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

                if (data.success) {
                    setTimeout(() => location.reload(), 2000);
                } else {
                    button.innerHTML = originalHTML;
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
                button.innerHTML = originalHTML;
                button.disabled = false;
            }
        });
    });
});