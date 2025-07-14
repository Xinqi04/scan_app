document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = "https://rizaaf-scan-barcode.hf.space";
    const API_URL = `${API_BASE}/barcodes`;

    const mainPage = document.getElementById('main-page');
    const formPage = document.getElementById('form-page');
    const scannerPage = document.getElementById('scanner-page');

    const barcodeList = document.getElementById('barcode-list');
    const loadingIndicator = document.getElementById('loading-indicator');

    const form = document.getElementById('barcode-form');
    const formTitle = document.getElementById('form-title');
    const nameInput = document.getElementById('name');
    const codeInput = document.getElementById('code');
    const priceInput = document.getElementById('price');
    const editCodeInput = document.getElementById('edit-code');

    const showAddFormBtn = document.getElementById('show-add-form-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const scanBtn = document.getElementById('scan-btn');
    const closeScannerBtn = document.getElementById('close-scanner-btn');

    let html5QrCode;

    const showPage = (pageToShow) => {
        [mainPage, formPage, scannerPage].forEach(p => p.classList.add('hidden'));
        pageToShow.classList.remove('hidden');
    };

    const fetchBarcodes = async () => {
        loadingIndicator.classList.remove('hidden');
        barcodeList.innerHTML = '';
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Gagal mengambil data');
            const data = await response.json();
            renderBarcodes(data);
        } catch (error) {
            barcodeList.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        } finally {
            loadingIndicator.classList.add('hidden');
        }
    };

    const renderBarcodes = (barcodes) => {
        if (barcodes.length === 0) {
            barcodeList.innerHTML = '<p>Belum ada item. Silakan tambahkan.</p>';
            return;
        }
        barcodes.forEach(barcode => {
            const li = document.createElement('li');
            li.className = 'barcode-item';
            li.innerHTML = `
                <div class="item-info">
                    <p><strong>${barcode.name}</strong></p>
                    <p>Kode: ${barcode.code}</p>
                    <p>Harga: Rp ${parseInt(barcode.price).toLocaleString('id-ID')}</p>
                </div>
                <div class="item-actions">
                    <button class="btn btn-secondary edit-btn" data-code="${barcode.code}">Edit</button>
                    <button class="btn btn-danger delete-btn" data-code="${barcode.code}">Hapus</button>
                </div>
            `;
            barcodeList.appendChild(li);
        });
    };

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const barcodeData = {
            name: nameInput.value,
            code: codeInput.value,
            price: parseFloat(priceInput.value)
        };
        const editCode = editCodeInput.value;

        try {
            const response = await fetch(editCode ? `${API_URL}/${editCode}` : API_URL, {
                method: editCode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(barcodeData)
            });

            if (!response.ok) throw new Error('Gagal menyimpan data');

            form.reset();
            editCodeInput.value = '';
            showPage(mainPage);
            fetchBarcodes();
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    });

    barcodeList.addEventListener('click', async (e) => {
        const target = e.target;
        const code = target.dataset.code;

        if (target.classList.contains('edit-btn')) {
            try {
                const response = await fetch(`${API_URL}/${code}`);
                if (!response.ok) throw new Error('Item tidak ditemukan');
                const barcode = await response.json();
                nameInput.value = barcode.name;
                codeInput.value = barcode.code;
                priceInput.value = barcode.price;
                editCodeInput.value = barcode.code;
                formTitle.textContent = 'Edit Item';
                showPage(formPage);
            } catch (error) {
                alert(`Error: ${error.message}`);
            }
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm(`Yakin hapus item dengan kode ${code}?`)) {
                try {
                    const response = await fetch(`${API_URL}/${code}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error('Gagal menghapus item');
                    fetchBarcodes();
                } catch (error) {
                    alert(`Error: ${error.message}`);
                }
            }
        }
    });

    const onScanSuccess = (decodedText) => {
        codeInput.value = decodedText;
        stopScanner();
        showPage(formPage);
        alert(`Barcode terdeteksi: ${decodedText}`);
    };

    const startScanner = () => {
        showPage(scannerPage);
        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess,
            () => {} // error callback
        ).catch(err => {
            alert("Tidak bisa akses kamera. Cek izin atau gunakan HTTPS.");
            console.error(err);
            showPage(formPage);
        });
    };

    const stopScanner = () => {
        if (html5QrCode && html5QrCode.isScanning) {
            html5QrCode.stop().then(() => {
                console.log("Scanner stopped.");
            }).catch(console.error);
        }
    };

    showAddFormBtn.addEventListener('click', () => {
        form.reset();
        editCodeInput.value = '';
        formTitle.textContent = 'Tambah Item Baru';
        showPage(formPage);
    });

    cancelBtn.addEventListener('click', () => {
        form.reset();
        editCodeInput.value = '';
        showPage(mainPage);
    });

    scanBtn.addEventListener('click', startScanner);
    closeScannerBtn.addEventListener('click', () => {
        stopScanner();
        showPage(formPage);
    });

    fetchBarcodes();
});
