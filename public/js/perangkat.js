document.addEventListener("DOMContentLoaded", function () {
    const qrContainer = document.querySelector('#qr-container');
    const deviceId = document.body.dataset.deviceId;
    const isConnected = document.body.dataset.isConnected === "true";

    if (qrContainer && !isConnected) {
        let retryCount = 0;
        const maxRetries = 30; // 30 detik timeout

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

    // Copy token
    window.copyToken = function () {
        const tokenInput = document.getElementById('token-input');
        tokenInput.select();
        tokenInput.setSelectionRange(0, 99999);

        navigator.clipboard.writeText(tokenInput.value)
            .then(() => showNotification('Token berhasil disalin!', 'green'))
            .catch(() => alert('Gagal menyalin token!'));
    }

    function showNotification(message, color = 'green') {
        const notification = document.createElement('div');
        notification.className = `fixed bottom-4 right-4 bg-${color}-100 text-${color}-700 px-4 py-3 rounded-lg shadow-md flex items-center`;
        notification.innerHTML = `
            <i class="fas fa-check-circle mr-2"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Disconnect
    window.disconnectDevice = async function (event) {
        if (!confirm('Apakah Anda yakin ingin memutuskan perangkat ini?')) return;

        try {
            const button = event.target;
            const originalText = button.innerHTML;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            button.disabled = true;

            const res = await fetch(`/device/${deviceId}/disconnect`, { method: 'POST' });
            const data = await res.json();

            if (data.success) {
                showNotification(data.message, 'green');
                setTimeout(() => location.reload(), 3000);
            } else {
                alert(data.message);
                button.innerHTML = originalText;
                button.disabled = false;
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat memutus perangkat');
            button.innerHTML = originalText;
            button.disabled = false;
        }
    }
});
