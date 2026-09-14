function toWords(num) {
  const numbers = Math.floor(Math.abs(Number(num) || 0));
  const satuan = [
    "",
    "SATU",
    "DUA",
    "TIGA",
    "EMPAT",
    "LIMA",
    "ENAM",
    "TUJUH",
    "DELAPAN",
    "SEMBILAN",
    "SEPULUH",
    "SEBELAS",
  ];

  if (numbers < 12) {
    return satuan[numbers];
  } else if (numbers < 20) {
    return `${satuan[numbers - 10]} BELAS`;
  } else if (numbers < 100) {
    const sisa = numbers % 10;
    return `${satuan[Math.floor(numbers / 10)]} PULUH${sisa ? " " + toWords(sisa) : ""}`;
  } else if (numbers < 200) {
    return `SERATUS${numbers - 100 ? " " + toWords(numbers - 100) : ""}`;
  } else if (numbers < 1000) {
    const sisa = numbers % 100;
    return `${satuan[Math.floor(numbers / 100)]} RATUS${sisa ? " " + toWords(sisa) : ""}`;
  } else if (numbers < 2000) {
    return `SERIBU${numbers - 1000 ? " " + toWords(numbers - 1000) : ""}`;
  } else if (numbers < 1000000) {
    const sisa = numbers % 1000;
    return `${toWords(Math.floor(numbers / 1000))} RIBU${sisa ? " " + toWords(sisa) : ""}`;
  } else if (numbers < 1000000000) {
    const sisa = numbers % 1000000;
    return `${toWords(Math.floor(numbers / 1000000))} JUTA${sisa ? " " + toWords(sisa) : ""}`;
  } else if (numbers < 1000000000000) {
    const sisa = numbers % 1000000000;
    return `${toWords(Math.floor(numbers / 1000000000))} MILYAR${sisa ? " " + toWords(sisa) : ""}`;
  }

  return numbers.toString();
}

function terbilang(nominal) {
  const words = toWords(nominal).trim();
  if (!words) return "NOL RUPIAH";
  return `${words} RUPIAH`;
}

module.exports = terbilang;
