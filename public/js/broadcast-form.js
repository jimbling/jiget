document.addEventListener('DOMContentLoaded', () => {
  const targetType = document.getElementById('target_type');
  const groupList = document.getElementById('group-list');
  const contactList = document.getElementById('contact-list');

  if (!targetType || !groupList || !contactList) return;

  function toggleTargetList() {
    if (targetType.value === 'group') {
      groupList.classList.remove('hidden');
      contactList.classList.add('hidden');
    } else {
      groupList.classList.add('hidden');
      contactList.classList.remove('hidden');
    }
  }

  // Jalankan sekali saat page load
  toggleTargetList();

  // Jalankan setiap kali pilihan berubah
  targetType.addEventListener('change', toggleTargetList);
});

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form[action='/broadcast']");
  const progressSection = document.createElement("div");
  progressSection.className = "mt-6 p-4 bg-gray-50 border rounded-lg hidden";
  form.parentNode.appendChild(progressSection);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Disable tombol + tampilkan loading
    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Mengirim...`;

    // Kirim form pakai fetch
    const formData = new FormData(form);
    const response = await fetch("/broadcast", {
      method: "POST",
      body: formData,
      headers: { "Accept": "application/json" }
    });

    const result = await response.json();

    if (result.success) {
      progressSection.innerHTML = `
        <h2 class="text-lg font-semibold text-gray-800 mb-2">Progres Pengiriman</h2>
        <div id="log-list" class="space-y-2 text-sm text-gray-700">
          <p class="text-gray-500">Menunggu log pertama...</p>
        </div>
      `;
      progressSection.classList.remove("hidden");

      // Jalankan polling logs
      startPollingLogs(result.broadcast_id);
    } else {
      progressSection.innerHTML = `<p class="text-red-600">Gagal memulai broadcast.</p>`;
      progressSection.classList.remove("hidden");
    }
  });

 async function startPollingLogs(broadcastId) {
  const logList = document.getElementById("log-list");

  async function fetchLogs() {
    const [logsRes, statusRes] = await Promise.all([
      fetch(`/broadcast/${broadcastId}/logs`),
      fetch(`/broadcast/${broadcastId}/status`)
    ]);

    const logsData = await logsRes.json();
    const statusData = await statusRes.json();

    // Update log list
    if (logsData.logs && logsData.logs.length > 0) {
      logList.innerHTML = logsData.logs.map(l => {
        const statusIcon =
          l.status === "sent"
            ? `<span class="text-green-600">✅</span>`
            : `<span class="text-red-600">❌</span>`;

        return `<div class="flex items-center gap-2">
          ${statusIcon}
          <span>${l.contact_name} (${l.phone})</span>
          <span class="ml-auto text-xs text-gray-500">${l.status}</span>
        </div>`;
      }).join("");
    }

    // 🔑 Cek status broadcast
    if (statusData.status === "done") {
      // Delay sedikit biar user lihat semua ✅
      setTimeout(() => {
        window.location.href = "/broadcast";
      }, 1500);
    } else {
      // Lanjut polling jika belum done
      setTimeout(fetchLogs, 2000);
    }
  }

  fetchLogs();
}




});

