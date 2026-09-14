/**
 * PDAM Payment Gateway - Client Application Logic
 */

// State
let currentInquiryData = null;
let currentReceiptText = "";
let currentReceiptRef1 = "";

const MONTH_NAMES = [
  "",
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

// Utility: Format Rupiah
function formatIDR(num) {
  return "Rp " + Number(num || 0).toLocaleString("id-ID");
}

// Utility: Format Date
function formatDateStr(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Toast Notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `w-full max-w-sm sm:max-w-md px-4 py-3 rounded-xl shadow-lg border text-sm flex items-center justify-between transition-all duration-300 pointer-events-auto transform -translate-y-4 opacity-0 scale-95 ${
    type === "success"
      ? "bg-emerald-100 text-slate-900 border-emerald-200"
      : type === "error"
        ? "bg-rose-50 text-rose-900 border-rose-200"
        : "bg-sky-50 text-sky-900 border-sky-200"
  }`;

  const iconSvg =
    type === "success"
      ? `<svg class="w-5 h-5 text-emerald-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`
      : type === "error"
        ? `<svg class="w-5 h-5 text-rose-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`
        : `<svg class="w-5 h-5 text-sky-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;

  toast.innerHTML = `
    <div class="flex items-center">
      ${iconSvg}
      <span class="font-medium">${message}</span>
    </div>
    <button type="button" class="ml-4 text-slate-400 hover:text-slate-600 p-1 leading-none text-lg" onclick="this.parentElement.remove()">
      &times;
    </button>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.remove("-translate-y-4", "opacity-0", "scale-95");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "-translate-y-4", "scale-95");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Switch Tabs
function switchTab(tab) {
  const tabPayment = document.getElementById("tab-payment");
  const tabHistory = document.getElementById("tab-history");
  const btnPayment = document.getElementById("tab-btn-payment");
  const btnHistory = document.getElementById("tab-btn-history");

  if (tab === "payment") {
    tabPayment.classList.remove("hidden");
    tabHistory.classList.add("hidden");

    btnPayment.className =
      "px-4 py-1.5 rounded-lg transition-all bg-white text-sky-700 shadow-sm font-semibold";
    btnHistory.className =
      "px-4 py-1.5 rounded-lg transition-all text-slate-600 hover:text-slate-900";
  } else {
    tabPayment.classList.add("hidden");
    tabHistory.classList.remove("hidden");

    btnHistory.className =
      "px-4 py-1.5 rounded-lg transition-all bg-white text-sky-700 shadow-sm font-semibold";
    btnPayment.className =
      "px-4 py-1.5 rounded-lg transition-all text-slate-600 hover:text-slate-900";

    loadHistory();
  }
}

// Quick Fill helper
function quickFill(productCode, customerId) {
  document.getElementById("product_code").value = productCode;
  document.getElementById("customer_id").value = customerId;
  showToast(`Form diisi dengan sampel ${productCode}`, "info");
}

// Reset Inquiry Result & Form
function cancelInquiry() {
  currentInquiryData = null;
  document.getElementById("inquiry-result-container").classList.add("hidden");
  document.getElementById("btn-inquiry").disabled = false;
}

function resetAll() {
  cancelInquiry();
  document.getElementById("payment-success-card").classList.add("hidden");
  document.getElementById("customer_id").value = "";
}

// Handle Inquiry Form Submission
async function handleInquiry(e) {
  e.preventDefault();

  const productCode = document.getElementById("product_code").value;
  const customerId = document.getElementById("customer_id").value.trim();

  if (!productCode || !customerId) {
    showToast("Silakan lengkapi produk dan nomor ID Pelanggan", "error");
    return;
  }

  // Loading state
  const btn = document.getElementById("btn-inquiry");
  const iconSearch = document.getElementById("icon-search");
  const iconSpinner = document.getElementById("icon-spinner-inq");

  btn.disabled = true;
  iconSearch.classList.add("hidden");
  iconSpinner.classList.remove("hidden");
  document.getElementById("payment-success-card").classList.add("hidden");
  document.getElementById("inquiry-result-container").classList.add("hidden");

  try {
    const res = await fetch("/api/transactions/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_code: productCode,
        customer_id: customerId,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Inquiry gagal dilakukan");
    }

    currentInquiryData = result.data;
    renderInquiryResult(result.data);
    showToast("Inquiry berhasil!", "success");
  } catch (err) {
    console.error(err);
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    iconSearch.classList.remove("hidden");
    iconSpinner.classList.add("hidden");
  }
}

// Render Inquiry Details
function renderInquiryResult(data) {
  document.getElementById("res-nama").textContent = data.nama || "-";
  document.getElementById("res-meter").textContent =
    `${data.idpel} / ${data.nometer || "-"}`;
  document.getElementById("res-pam").textContent =
    data.pdam_name || data.product_name || "PDAM";
  document.getElementById("res-alamat").textContent = data.alamat || "-";
  document.getElementById("res-alamat").title = data.alamat || "";

  document.getElementById("res-ref1").textContent = data.ref1 || "-";
  document.getElementById("res-ref2").textContent = data.ref2 || "-";

  document.getElementById("res-sum-nominal").textContent = formatIDR(
    data.nominal,
  );
  document.getElementById("res-sum-admin").textContent = formatIDR(data.admin);
  document.getElementById("res-sum-total").textContent = formatIDR(
    data.total_bayar,
  );

  // Render Data Bill table
  const tbody = document.getElementById("res-bill-rows");
  tbody.innerHTML = "";

  const bills = data.data_bill || {};
  const billKeys = Object.keys(bills);
  document.getElementById("res-periode-count").textContent =
    `${billKeys.length} Periode Tagihan`;

  if (billKeys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="px-4 py-4 text-center text-slate-400">Tidak ada rincian tagihan</td></tr>`;
  } else {
    billKeys.forEach((key) => {
      const item = bills[key];
      const mIdx = parseInt(item.bulan, 10);
      const mName = MONTH_NAMES[mIdx] || item.bulan;
      const periodLabel = `${mName} ${item.tahun}`;

      const standMeter =
        item.meter_akhir > 0 ? `${item.meter_awal} - ${item.meter_akhir}` : "-";

      const subtotal =
        Number(item.air || 0) +
        Number(item.denda || 0) +
        Number(item.nonair || 0);

      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-50 transition-colors";
      tr.innerHTML = `
        <td class="px-4 py-3 font-medium text-slate-900">${periodLabel}</td>
        <td class="px-4 py-3 text-right font-mono text-slate-600">${standMeter}</td>
        <td class="px-4 py-3 text-right font-mono text-slate-700">${formatIDR(item.air)}</td>
        <td class="px-4 py-3 text-right font-mono text-rose-600">${formatIDR(item.denda)}</td>
        <td class="px-4 py-3 text-right font-mono text-slate-600">${formatIDR(item.nonair)}</td>
        <td class="px-4 py-3 text-right font-mono font-semibold text-slate-900">${formatIDR(subtotal)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  const container = document.getElementById("inquiry-result-container");
  container.classList.remove("hidden");
  container.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Handle Payment
async function handlePayment() {
  if (!currentInquiryData || !currentInquiryData.ref1) {
    showToast(
      "Data inquiry tidak ditemukan. Silakan periksa tagihan kembali.",
      "error",
    );
    return;
  }

  const btn = document.getElementById("btn-payment");
  const iconPay = document.getElementById("icon-pay");
  const iconSpinner = document.getElementById("icon-spinner-pay");
  const btnLabel = btn.querySelector("span");

  // Langsung aktifkan loading state
  btn.disabled = true;
  if (iconPay) iconPay.classList.add("hidden");
  if (iconSpinner) iconSpinner.classList.remove("hidden");
  if (btnLabel) btnLabel.textContent = "Memproses Pembayaran...";

  try {
    const res = await fetch("/api/transactions/payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref1: currentInquiryData.ref1,
        product_code: document.getElementById("product_code")?.value || "WASDA",
        customer_id: currentInquiryData.idpel || currentInquiryData.customer_id,
        nominal: currentInquiryData.nominal,
        ref2: currentInquiryData.ref2,
      }),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      throw new Error(result.message || "Pembayaran gagal diproses");
    }

    currentReceiptText = result.data.receipt_text || "";
    currentReceiptRef1 = currentInquiryData.ref1;

    // Tampilkan success card
    const resiEl = document.getElementById("succ-resi");
    if (resiEl) {
      resiEl.textContent =
        result.data.ref2 || currentInquiryData.ref2 || result.data.ref1;
    }

    const totalEl = document.getElementById("succ-total");
    if (totalEl) {
      totalEl.textContent = formatIDR(
        currentInquiryData.total_bayar || result.data.total_payment,
      );
    }

    const inqContainer = document.getElementById("inquiry-result-container");
    if (inqContainer) inqContainer.classList.add("hidden");

    const successCard = document.getElementById("payment-success-card");
    if (successCard) {
      successCard.classList.remove("hidden");
      successCard.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    showToast("Pembayaran berhasil diproses!", "success");

    // Otomatis buka preview struk pembayaran
    previewReceipt(currentReceiptText, currentReceiptRef1);
  } catch (err) {
    console.error(err);
    showToast(err.message, "error");
  } finally {
    btn.disabled = false;
    if (iconPay) iconPay.classList.remove("hidden");
    if (iconSpinner) iconSpinner.classList.add("hidden");
    if (btnLabel) btnLabel.textContent = "Konfirmasi & Bayar Sekarang";
  }
}

// Receipt Modal Viewers
function previewReceiptCurrent() {
  if (currentReceiptText) {
    previewReceipt(currentReceiptText, currentReceiptRef1);
  } else if (currentReceiptRef1) {
    viewReceiptByRef(currentReceiptRef1);
  }
}

function downloadReceiptCurrent() {
  if (currentReceiptRef1) {
    downloadReceiptFile(currentReceiptRef1);
  }
}

function previewReceipt(receiptText, ref1) {
  document.getElementById("receipt-content").textContent = receiptText;
  const btnDownload = document.getElementById("modal-btn-download");
  btnDownload.onclick = () => downloadReceiptFile(ref1);
  document.getElementById("receipt-modal").classList.remove("hidden");
}

function closeReceiptModal() {
  document.getElementById("receipt-modal").classList.add("hidden");
}

async function viewReceiptByRef(ref1) {
  try {
    const res = await fetch(`/api/transactions/${ref1}/receipt`);
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Gagal mengambil struk");
    }
    previewReceipt(json.data.receipt_text, ref1);
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function downloadReceiptFile(ref1) {
  const defaultFilename = `struk_${ref1}.txt`;

  // 1. Jika teks struk sudah ada di memori, unduh langsung via Blob
  if (currentReceiptRef1 === ref1 && currentReceiptText) {
    saveTextAsFile(currentReceiptText, defaultFilename);
    return;
  }

  // 2. Ambil konten teks struk via API
  try {
    const res = await fetch(`/api/transactions/${ref1}/receipt`);
    const json = await res.json();
    if (json.success && json.data?.receipt_text) {
      const prod = json.data.transaction?.product_code || "PDAM";
      saveTextAsFile(json.data.receipt_text, `struk_${prod}_${ref1}.txt`);
      return;
    }
  } catch (e) {
    console.error("Gagal mengambil teks struk:", e);
  }

  // 3. Fallback: gunakan link dengan atribut download
  triggerDownloadLink(
    `/api/transactions/${ref1}/receipt?format=txt`,
    defaultFilename,
  );
}

function saveTextAsFile(text, filename) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownloadLink(url, filename);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function triggerDownloadLink(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// History Loader
async function loadHistory() {
  const filterProd = document.getElementById("history-filter-product").value;
  const tbody = document.getElementById("history-table-body");

  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="px-5 py-8 text-center text-slate-400 text-sm">
        <svg class="w-5 h-5 mx-auto animate-spin mb-2 text-slate-400" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
        Memuat data transaksi...
      </td>
    </tr>
  `;

  try {
    let url = "/api/transactions";
    if (filterProd) url += `?product_code=${filterProd}`;

    const res = await fetch(url);
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(json.message || "Gagal memuat history");
    }

    const items = json.data || [];
    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-5 py-8 text-center text-slate-400 text-sm">
            Belum ada data transaksi yang tersimpan.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = "";
    items.forEach((item) => {
      const isPaid = item.status === "PAYMENT_SUCCESS";
      const isInqOk = item.status === "INQUIRY_SUCCESS";
      const isFailed = item.status && item.status.includes("FAILED");

      let badge = "";
      if (isPaid) {
        badge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-emerald-800">Lunas (Paid)</span>`;
      } else if (isInqOk) {
        badge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-amber-600">Inquiry Sukses</span>`;
      } else if (isFailed) {
        badge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-rose-800">Gagal</span>`;
      } else {
        badge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-slate-700">${item.status}</span>`;
      }

      const tr = document.createElement("tr");
      tr.className = "hover:bg-slate-50 transition-colors";
      tr.innerHTML = `
        <td class="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">${formatDateStr(item.created_at)}</td>
        <td class="px-5 py-3 font-medium text-slate-900 whitespace-nowrap">${item.product_name || item.product_code}</td>
        <td class="px-5 py-3">
          <div class="font-medium text-slate-800">${item.customer_name || "-"}</div>
          <div class="text-xs text-slate-400 font-mono">${item.customer_id}</div>
        </td>
        <td class="px-5 py-3 text-right font-mono font-medium text-slate-900 whitespace-nowrap">${formatIDR(item.total_payment)}</td>
        <td class="px-5 py-3 text-center whitespace-nowrap">${badge}</td>
        <td class="px-5 py-3 text-right whitespace-nowrap space-x-2">
          <button type="button" onclick="viewReceiptByRef('${item.ref1}')" class="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-md text-xs font-medium transition-colors border border-sky-200">
            Struk
          </button>
          <button type="button" onclick="downloadReceiptFile('${item.ref1}')" class="px-2.5 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium transition-colors border border-slate-200" title="Unduh file .txt">
            Unduh
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-5 py-6 text-center text-rose-500 text-sm">
          ${err.message}
        </td>
      </tr>
    `;
  }
}

// Initial Load
document.addEventListener("DOMContentLoaded", () => {
  quickFill("WASDA", "01002676");
});
