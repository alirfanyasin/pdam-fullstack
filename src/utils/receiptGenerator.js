const terbilang = require("./terbilang");

const MONTH_NAMES = [
  "",
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MEI",
  "JUN",
  "JUL",
  "AGS",
  "SEP",
  "OKT",
  "NOP",
  "DES",
];

function formatRupiah(num) {
  return Number(num || 0).toLocaleString("id-ID");
}

function padRight(str, len) {
  return String(str || "").padEnd(len, " ");
}

function padLeft(str, len) {
  return String(str || "").padStart(len, " ");
}

/**
 * Format tanggal: DD-MM-YYYY HH:mm:ss
 */
function formatDate(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Membuat format struk teks sesuai spesifikasi soal
 */
function generateReceipt(transaction) {
  const inq =
    typeof transaction.inquiry_response === "string"
      ? JSON.parse(transaction.inquiry_response || "{}")
      : transaction.inquiry_response || {};

  const pay =
    typeof transaction.payment_response === "string"
      ? JSON.parse(transaction.payment_response || "{}")
      : transaction.payment_response || {};

  const rawInq = inq.raw || inq;
  const rawPay = pay.raw || pay;

  const isBondowoso = transaction.product_code === "WABONDO";
  const pamName = isBondowoso ? "PDAM BONDOWOSO" : "PDAM SIDOARJO";

  const tanggal = formatDate(
    transaction.created_at || transaction.updated_at,
  );
  const noResi =
    transaction.ref2 || rawPay.ref2 || rawInq.ref2 || transaction.ref1 || "-";
  const noPelanggan = transaction.customer_id;
  const nama = (
    transaction.customer_name ||
    rawInq.customername ||
    "-"
  ).toUpperCase();
  const alamat = (
    transaction.address ||
    rawInq.customeraddress ||
    "-"
  ).toUpperCase();

  // Parsing rincian tagihan bulanan
  const lines = [];
  lines.push(`STRUK PEMBAYARAN ${pamName}`);
  lines.push(`${padRight("TANGGAL", 15)}: ${tanggal}`);
  lines.push(`${padRight("NO. RESI", 15)}: ${noResi}`);
  lines.push(`${padRight("NAMA PAM", 15)}: ${pamName}`);
  lines.push(`${padRight("NO. PELANGGAN", 15)}: ${noPelanggan}`);
  lines.push(`${padRight("NAMA", 15)}: ${nama}`);
  lines.push(`${padRight("ALAMAT", 15)}: ${alamat}`);

  // Hitung pemakaian meter jika Bondowoso
  let totalMeter = 0;
  const billCount = parseInt(rawInq.billquantity || 0, 10);
  for (let i = 1; i <= billCount; i++) {
    const awal = parseInt(rawInq[`firstmeterread${i}`] || 0, 10);
    const akhir = parseInt(rawInq[`lastmeterread${i}`] || 0, 10);
    if (akhir >= awal) {
      totalMeter += akhir - awal;
    }
  }

  if (isBondowoso && totalMeter > 0) {
    lines.push(`${padRight("PEMAKAIAN", 15)}: ${totalMeter} M3`);
  }

  lines.push("RINCIAN TAGIHAN");

  let totalAir = 0;
  let totalDenda = 0;
  let totalBeban = 0;

  // Cek struktur data_bill dari JSON internal (Poin 4) atau rawInq
  const dataBill = inq.data?.data_bill;

  if (dataBill && Object.keys(dataBill).length > 0) {
    Object.keys(dataBill).forEach((key) => {
      const item = dataBill[key];
      const mIdx = parseInt(item.bulan, 10);
      const mName = MONTH_NAMES[mIdx] || item.bulan;
      const periodStr = `${mName} ${item.tahun}`;
      const airAmt = Number(item.air || 0);
      totalAir += airAmt;
      totalDenda += Number(item.denda || 0);
      totalBeban += Number(item.nonair || 0);

      lines.push(
        `  ${padRight(periodStr, 12)}: Rp ${padLeft(formatRupiah(airAmt), 12)}`,
      );
    });
  } else {
    // Fallback baca dari rawInq
    for (let i = 1; i <= (billCount || 6); i++) {
      const mVal = rawInq[`monthperiod${i}`];
      const yVal = rawInq[`yearperiod${i}`];
      const bAmt = Number(rawInq[`billamount${i}`] || 0);
      const pAmt = Number(rawInq[`penalty${i}`] || 0);
      let miscAmt = 0;
      const miscStr = String(rawInq[`miscamount${i}`] || "");
      if (miscStr.includes("|")) {
        miscAmt = Number(miscStr.split("|")[1] || 0);
      } else {
        miscAmt = Number(miscStr || 0);
      }

      if (mVal && yVal) {
        const mIdx = parseInt(mVal, 10);
        const mName = MONTH_NAMES[mIdx] || mVal;
        const periodStr = `${mName} ${yVal}`;
        totalAir += bAmt;
        totalDenda += pAmt;
        totalBeban += miscAmt;

        lines.push(
          `  ${padRight(periodStr, 12)}: Rp ${padLeft(formatRupiah(bAmt), 12)}`,
        );
      }
    }
  }

  // Baris Denda
  if (totalDenda > 0) {
    lines.push(
      `${padRight("DENDA", 15)}: Rp ${padLeft(formatRupiah(totalDenda), 12)}`,
    );
  }

  // Baris Beban jika ada (khususnya Bondowoso)
  if (totalBeban > 0) {
    lines.push(
      `${padRight("BEBAN", 15)}: Rp ${padLeft(formatRupiah(totalBeban), 12)}`,
    );
  }

  // Baris Admin
  const adminFee = Number(transaction.admin || rawInq.biayaadmin || 0);
  lines.push(
    `${padRight("ADMIN", 15)}: Rp ${padLeft(formatRupiah(adminFee), 12)}`,
  );

  lines.push("---------------------------------");

  const totalTagihan = Number(
    transaction.total_payment ||
      totalAir + totalDenda + totalBeban + adminFee,
  );
  lines.push(
    `${padRight("TOTAL TAGIHAN", 15)}: Rp ${padLeft(formatRupiah(totalTagihan), 12)}`,
  );
  lines.push("");
  lines.push("TERBILANG      :");
  lines.push(terbilang(totalTagihan));
  lines.push("");
  lines.push(`${pamName} MENYATAKAN STRUK INI`);
  lines.push("SEBAGAI BUKTI PEMBAYARAN YANG SAH");

  return lines.join("\n");
}

module.exports = {
  generateReceipt,
};
