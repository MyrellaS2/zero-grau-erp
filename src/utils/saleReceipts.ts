export function buildReceiptEntries(receipts: any[], sales: any[]) {
  const salesById = new Map(sales.map((sale) => [String(sale.id), sale]))

  return receipts.flatMap((receipt) => {
    const sale = salesById.get(String(receipt.sale_id))
    if (!sale) return []

    const amount = Number(receipt.amount || 0)
    const saleValue = Number(sale.total || 0)
    const share = saleValue > 0 ? amount / saleValue : 0
    const allocatedCost = Array.isArray(sale.products)
      ? sale.products.reduce((sum: number, product: any) =>
          sum + Number(product.purchasePrice || 0) * Number(product.quantity || 0), 0) * share
      : 0
    const allocatedFee = Number(sale.delivery_fee || 0) * share

    return [{
      ...sale,
      id: `receipt-${receipt.id}`,
      receipt_id: receipt.id,
      is_initial_payment: String(receipt.id).startsWith("initial-"),
      original_sale_id: sale.id,
      is_receipt_entry: true,
      payment: receipt.payment_method,
      status: "Pago",
      date: receipt.created_at,
      received_at: receipt.created_at,
      received_cash_register_id: receipt.cash_register_id,
      received_payment: receipt.payment_method,
      received_total: amount,
      amount_received: amount,
      delivery_fee: allocatedFee,
      total: amount,
      products: Array.isArray(sale.products)
        ? sale.products.map((product: any) => ({
            ...product,
            purchasePrice: Number(product.purchasePrice || 0) * share,
          }))
        : sale.products,
      profit: amount - allocatedCost - allocatedFee,
    }]
  })
}

export function getReceiptSaleIds(receipts: any[]) {
  return new Set(receipts.map((receipt) => String(receipt.sale_id)))
}

export function buildInitialPaymentEntries(sales: any[], receiptSaleIds: Set<string>, cashRegisterId?: number) {
  const initialRows: any[] = []
  for (const sale of sales) {
    if (!receiptSaleIds.has(String(sale.id)) || !String(sale.payment || "").includes(" + ")) continue
    for (const [index, part] of String(sale.payment).split(" + ").entries()) {
      const [method, valueText] = part.split(": R$ ")
      if (!method || method.trim() === "Fiado") continue
      const amount = Number(String(valueText || "0").replace(",", "."))
      if (!(amount > 0)) continue
      initialRows.push({
        id: `initial-${sale.id}-${index}`,
        sale_id: sale.id,
        amount,
        payment_method: method.trim(),
        cash_register_id: cashRegisterId || sale.received_cash_register_id,
        created_at: sale.date,
      })
    }
  }
  return buildReceiptEntries(initialRows, sales)
}
