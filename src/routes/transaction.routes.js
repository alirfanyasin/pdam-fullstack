const express = require("express");

const router = express.Router();

const controller = require("../controllers/transaction.controller");

router.post("/inquiry", controller.inquiry);
router.post("/payment", controller.payment);
router.get("/receipt/:ref1", controller.getReceipt);
router.get("/:ref1/receipt", controller.getReceipt);
router.get("/", controller.history);

module.exports = router;
