document.addEventListener('DOMContentLoaded', () => {
  const TOKEN = document.body.dataset.token;
  const form = document.getElementById('textForm');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const number = document.getElementById('number').value;
    const message = document.getElementById('message').value;

    try {
      const res = await fetch('/api/wa/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ number, message })
      });

      const data = await res.json();

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: data.success ? 'success' : 'error',
        title: data.success ? `Pesan berhasil dikirim ke ${data.number}` : `Error: ${data.error}`,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      if (data.success) form.reset();

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
