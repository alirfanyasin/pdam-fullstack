const axios = require("axios");

const API_URL = process.env.RAJABILLER_URL;

/**
 * Helper untuk normalisasi respons raw Rajabiller ke format standar Internal API (Soal Poin 4)
 */
function normalizeRajabillerResponse(raw, productCode) {
  if (!raw) {
    return {
      rc: "99",
      ket: "Gagal terhubung ke penyedia layanan",
      data: null,
      raw: {},
    };
  }

  const rc = raw.status || raw.rc || "99";
  const ket =
    raw.keterangan || raw.ket || (rc === "00" ? "sukses" : "Gagal transaksi");

  if (rc !== "00") {
    return {
      rc,
      ket,
      data: null,
      raw,
    };
  }

  const billCount = parseInt(raw.billquantity || "0", 10);
  const dataBill = {};

  for (let i = 1; i <= billCount; i++) {
    let nonAir = 0;
    const miscStr = String(raw[`miscamount${i}`] || "0");
    if (miscStr.includes("|")) {
      const parts = miscStr.split("|");
      nonAir = Number(parts[1] || parts[0] || 0);
    } else {
      nonAir = Number(miscStr || 0);
    }

    dataBill[`blth${i}`] = {
      air: Number(raw[`billamount${i}`] || 0),
      denda: Number(raw[`penalty${i}`] || 0),
      nonair: nonAir,
      meter_awal: Number(raw[`firstmeterread${i}`] || 0),
      meter_akhir: Number(raw[`lastmeterread${i}`] || 0),
      bulan: String(raw[`monthperiod${i}`] || ""),
      tahun: String(raw[`yearperiod${i}`] || ""),
    };
  }

  const nominal = Number(raw.nominal || 0);

  // Admin fee logic: sesuai contoh soal Poin 4 & 8
  let admin = Number(raw.biayaadmin || 0);
  if (productCode === "WASDA") {
    admin = 10800;
  } else if (productCode === "WABONDO") {
    admin = 4500;
  } else if (raw.fee && Number(raw.fee) < 0) {
    admin = Math.abs(Number(raw.fee));
  }

  const totalBayar = nominal + admin;

  return {
    rc,
    ket: "sukses",
    data: {
      idpel: raw.customerid1 || raw.idpelanggan1 || "",
      nometer: raw.customerid2 || raw.idpelanggan2 || "",
      nama: raw.customername || "",
      alamat: raw.customeraddress || "",
      nominal,
      admin,
      total_bayar: totalBayar,
      jumlah_bulan: String(billCount),
      ref1: raw.ref1 || "",
      ref2: raw.ref2 || "",
      pdam_name: raw.pdamname || (productCode === "WABONDO" ? "PDAM BONDOWOSO" : "PDAM SIDOARJO"),
      data_bill: dataBill,
    },
    raw,
  };
}

/**
 * Eksekusi API Inquiry Rajabiller
 */
async function inquiry({ customerId, productCode, ref1 }) {
  const payload = {
    method: "fastpay.inq",
    uid: process.env.RAJABILLER_UID,
    pin: process.env.RAJABILLER_PIN,
    idpel1: customerId,
    idpel2: "",
    idpel3: "",
    kode_produk: productCode,
    ref1: ref1,
  };

  const response = await axios.post(API_URL, payload, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 15000,
  });

  return normalizeRajabillerResponse(response.data, productCode);
}

/**
 * Eksekusi API Payment Rajabiller
 */
async function payment({ customerId, productCode, ref1, nominal, ref2 }) {
  const payload = {
    method: "fastpay.pay",
    uid: process.env.RAJABILLER_UID,
    pin: process.env.RAJABILLER_PIN,
    idpel1: customerId,
    idpel2: "",
    idpel3: "",
    kode_produk: productCode,
    ref1,
    nominal: String(nominal),
    ref2: String(ref2),
    ref3: "",
  };

  const response = await axios.post(API_URL, payload, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    timeout: 15000,
  });

  const raw = response.data;
  const rc = raw.status || raw.rc || "99";
  const ket = raw.keterangan || raw.ket || (rc === "00" ? "sukses" : "Gagal pembayaran");

  return {
    rc,
    ket,
    data: {
      idpel: raw.customerid1 || raw.idpelanggan1 || customerId,
      ref1: raw.ref1 || ref1,
      ref2: raw.ref2 || ref2,
      nominal: Number(raw.nominal || nominal || 0),
      status: rc === "00" ? "SUCCESS" : "FAILED",
    },
    raw,
  };
}

module.exports = {
  inquiry,
  payment,
};
