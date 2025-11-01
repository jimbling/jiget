// auto-reply.js
function openModal() {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal-title').innerText = 'Tambah Auto-Reply';
    document.getElementById('form-rule').reset();
    document.getElementById('rule-id').value = '';
}

function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// Tombol Batal
document.getElementById('btnCloseModal').addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
});

document.addEventListener('DOMContentLoaded', () => {
    const autoReplies = JSON.parse(document.getElementById('auto-replies').dataset.json);

    // Edit buttons
    document.querySelectorAll('.btnEditRule').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const rule = autoReplies.find(r => r.id == id);
            if (!rule) return;

            const modal = document.getElementById('modal');
            modal.classList.remove('hidden');
            document.getElementById('modal-title').innerText = 'Edit Auto-Reply';
            document.getElementById('rule-id').value = rule.id;
            document.getElementById('rule-keyword').value = rule.keyword;
            document.getElementById('rule-type').value = rule.type;
            document.getElementById('rule-reply').value = rule.reply_text;
        });
    });

    // Delete buttons
    document.querySelectorAll('.btnDeleteRule').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            if (!confirm('Yakin ingin menghapus rule ini?')) return;
           fetch(`/auto-reply/${id}`, { method: 'DELETE' })
                .then(() => location.reload())
                .catch(err => console.error(err));
        });
    });
});

function toggleCollapse() {
  const content = document.getElementById('collapseContent');
  const icon = document.getElementById('collapseIcon');
  content.classList.toggle('hidden');
  icon.classList.toggle('rotate-180');
}

document.getElementById('form-rule').addEventListener('submit', function(e){
    e.preventDefault();
    const id = document.getElementById('rule-id').value;
    const payload = {
        keyword: document.getElementById('rule-keyword').value,
        type: document.getElementById('rule-type').value,
        reply_text: document.getElementById('rule-reply').value
    };
    const url = id ? `/auto-reply/${id}` : '/auto-reply';
    const method = id ? 'PUT' : 'POST';

    fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(res => location.reload())
    .catch(err => console.error(err));
});

document.addEventListener('DOMContentLoaded', () => {
    const collapseButton = document.getElementById('collapseButton');
    const collapseContent = document.getElementById('collapseContent');
    const collapseIcon = document.getElementById('collapseIcon');

    collapseButton.addEventListener('click', () => {
        collapseContent.classList.toggle('hidden');
        collapseIcon.classList.toggle('rotate-180');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const btnTambahRule = document.getElementById('btnTambahRule');
    const modal = document.getElementById('modal');
    const formRule = document.getElementById('form-rule');

    btnTambahRule.addEventListener('click', () => {
        modal.classList.remove('hidden');
        document.getElementById('modal-title').innerText = 'Tambah Auto-Reply';
        formRule.reset();
        document.getElementById('rule-id').value = '';
    });
});
