require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");

const transactionRoutes = require("./routes/transaction.routes");

const app = express();

app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.static(path.join(__dirname, "../public")));

app.use("/api/transactions", transactionRoutes);

app.get("/api", (req, res) => {
  res.json({
    message: "PDAM Payment API",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
