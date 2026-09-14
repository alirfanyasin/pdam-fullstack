function generateRef() {
  return `TRX-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

module.exports = generateRef;
