const db = require("../config/database");
const rajabiller = require("../services/rajabiller.service");
const generateRef = require("../utils/generateRef");
const { generateReceipt } = require("../utils/receiptGenerator");

const products = {
  WASDA: "PDAM SIDOARJO",
  WABONDO: "PDAM BONDOWOSO",
};

// Controller: Inquiry Tagihan PDAM

exports.inquiry = async (req, res) => {
  try {
    const { product_code, customer_id } = req.body;

    if (!product_code || !customer_id) {
      return res.status(400).json({
        success: false,
        message: "product_code dan customer_id wajib diisi",
      });
    }

    const trimmedCode = String(product_code).trim().toUpperCase();
    const trimmedCustomerId = String(customer_id).trim();

    if (!products[trimmedCode]) {
      return res.status(400).json({
        success: false,
        message: "Produk tidak ditemukan. Gunakan WASDA atau WABONDO",
      });
    }

    const ref1 = generateRef();

    const response = await rajabiller.inquiry({
      customerId: trimmedCustomerId,
      productCode: trimmedCode,
      ref1,
    });

    if (response.rc !== "00") {
      // Simpan log kegagalan inquiry ke database
      await db.execute(
        `
        INSERT INTO transactions
        (
          ref1,
          product_code,
          product_name,
          customer_id,
          inquiry_response,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          ref1,
          trimmedCode,
          products[trimmedCode],
          trimmedCustomerId,
          JSON.stringify(response),
          "INQUIRY_FAILED",
        ],
      );

      return res.status(400).json({
        success: false,
        message: response.ket || "Inquiry gagal",
        data: response,
      });
    }

    const data = response.data || {};

    // Simpan hasil inquiry sukses ke database
    await db.execute(
      `
      INSERT INTO transactions
      (
        ref1,
        ref2,
        product_code,
        product_name,
        customer_id,
        customer_name,
        meter_number,
        address,
        nominal,
        admin,
        total_payment,
        inquiry_response,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        ref1,
        data.ref2 || null,
        trimmedCode,
        products[trimmedCode],
        trimmedCustomerId,
        data.nama || null,
        data.nometer || null,
        data.alamat || null,
        data.nominal || 0,
        data.admin || 0,
        data.total_bayar || 0,
        JSON.stringify(response),
        "INQUIRY_SUCCESS",
      ],
    );

    res.json({
      success: true,
      message: "Inquiry berhasil",
      data: {
        ref1,
        ...data,
      },
    });
  } catch (error) {
    console.error("Inquiry Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat memproses inquiry",
      error: error.message,
    });
  }
};

// Controller: Pembayaran (Payment) Tagihan PDAM
exports.payment = async (req, res) => {
  try {
    let { product_code, customer_id, ref1, nominal, ref2 } = req.body;

    if (!ref1) {
      return res.status(400).json({
        success: false,
        message: "ref1 wajib disertakan untuk melakukan payment",
      });
    }

    // Ambil data inquiry sebelumnya dari database
    const [rows] = await db.execute(
      "SELECT * FROM transactions WHERE ref1 = ? LIMIT 1",
      [ref1],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Data transaksi inquiry dengan ref1 tersebut tidak ditemukan",
      });
    }

    const trx = rows[0];

    // Jika transaksi ini sudah berhasil dibayar sebelumnya, kembalikan data pembayaran dan struk
    if (trx.status === "PAYMENT_SUCCESS") {
      const receiptText = generateReceipt(trx);
      return res.json({
        success: true,
        message: "Tagihan ini sudah berhasil dibayar (Lunas)",
        data: {
          idpel: trx.customer_id,
          ref1: trx.ref1,
          ref2: trx.ref2,
          nominal: Number(trx.nominal),
          status: "SUCCESS",
          customer_name: trx.customer_name,
          total_payment: trx.total_payment,
          receipt_text: receiptText,
        },
      });
    }

    product_code = product_code || trx.product_code;
    customer_id = customer_id || trx.customer_id;
    nominal = nominal !== undefined ? nominal : trx.nominal;
    ref2 = ref2 || trx.ref2;

    const trimmedCode = String(product_code).trim().toUpperCase();
    const trimmedCustomerId = String(customer_id).trim();

    // Hit API Payment Rajabiller
    const response = await rajabiller.payment({
      customerId: trimmedCustomerId,
      productCode: trimmedCode,
      ref1,
      nominal,
      ref2,
    });

    const isSuccess = response.rc === "00";
    const status = isSuccess ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED";

    // Update database
    await db.execute(
      `
      UPDATE transactions
      SET
        ref2 = COALESCE(?, ref2),
        payment_response = ?,
        status = ?
      WHERE ref1 = ?
      `,
      [
        response.data?.ref2 || ref2 || null,
        JSON.stringify(response),
        status,
        ref1,
      ],
    );

    // Ambil updated row
    const [updatedRows] = await db.execute(
      "SELECT * FROM transactions WHERE ref1 = ? LIMIT 1",
      [ref1],
    );
    const updatedTrx = updatedRows[0] || trx;
    const receiptText = generateReceipt(updatedTrx);

    if (!isSuccess) {
      return res.status(400).json({
        success: false,
        message: response.ket || "Pembayaran gagal diproses oleh biller",
        data: response,
      });
    }

    res.json({
      success: true,
      message: "Pembayaran berhasil",
      data: {
        ...response.data,
        customer_name: updatedTrx.customer_name,
        total_payment: updatedTrx.total_payment,
        receipt_text: receiptText,
      },
    });
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server saat memproses payment",
      error: error.message,
    });
  }
};

// Controller: History Transaksi (Riwayat)
exports.history = async (req, res) => {
  try {
    const { product_code, status } = req.query;

    let query = "SELECT * FROM transactions";
    const params = [];
    const conditions = [];

    if (product_code) {
      conditions.push("product_code = ?");
      params.push(product_code.toUpperCase());
    }

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY id DESC";

    const [rows] = await db.execute(query, params);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("History Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal mengambil riwayat transaksi",
      error: error.message,
    });
  }
};

// Controller: Cetak / Download Struk Transaksi
exports.getReceipt = async (req, res) => {
  try {
    const { ref1 } = req.params;
    const { format } = req.query;

    const [rows] = await db.execute(
      "SELECT * FROM transactions WHERE ref1 = ? LIMIT 1",
      [ref1],
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    const trx = rows[0];
    const receiptText = generateReceipt(trx);

    if (format === "txt") {
      const filename = `struk_${trx.product_code}_${trx.ref1}.txt`;
      res.attachment(filename);
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      return res.send(receiptText);
    }

    res.json({
      success: true,
      data: {
        transaction: trx,
        receipt_text: receiptText,
      },
    });
  } catch (error) {
    console.error("Receipt Error:", error);
    res.status(500).json({
      success: false,
      message: "Gagal membuat struk transaksi",
      error: error.message,
    });
  }
};
