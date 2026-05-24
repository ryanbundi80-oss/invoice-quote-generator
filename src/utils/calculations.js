export function calculateTotals(items, taxRate, withholdingRate = 0) {
  const subtotal = items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);

  const tax = subtotal * ((Number(taxRate) || 0) / 100);
  const withholding = subtotal * ((Number(withholdingRate) || 0) / 100);
  const total = subtotal + tax - withholding;

  return { subtotal, tax, withholding, total };
}
