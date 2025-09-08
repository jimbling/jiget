document.addEventListener("DOMContentLoaded", function () {
    // SweetAlert konfirmasi hapus semua
    const deleteAllForm = document.querySelector(".delete-all-form");
    if (deleteAllForm) {
        deleteAllForm.addEventListener("submit", function (e) {
            e.preventDefault();
            Swal.fire({
                title: "Yakin?",
                text: "Semua pesan akan dihapus permanen.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Ya, hapus!",
                cancelButtonText: "Batal",
                confirmButtonColor: "#d33"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const res = await fetch(deleteAllForm.action, { method: "POST" });
                    const data = await res.json();

                    if (data.success) {
                        Swal.fire({
                            toast: true,
                            position: "top-end",
                            icon: "success",
                            title: data.message,
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true
                        });
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        Swal.fire("Gagal", data.message, "error");
                    }
                }
            });
        });
    }

    // SweetAlert konfirmasi hapus per pesan
    document.querySelectorAll(".delete-form").forEach(form => {
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            Swal.fire({
                title: "Hapus Pesan?",
                text: "Pesan ini akan dihapus permanen.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Hapus",
                cancelButtonText: "Batal",
                confirmButtonColor: "#d33"
            }).then(async (result) => {
                if (result.isConfirmed) {
                    const res = await fetch(form.action, { method: "POST" });
                    const data = await res.json();

                    if (data.success) {
                        Swal.fire({
                            toast: true,
                            position: "top-end",
                            icon: "success",
                            title: data.message,
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true
                        });
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        Swal.fire("Gagal", data.message, "error");
                    }
                }
            });
        });
    });
});
