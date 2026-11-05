/**
 * Returns the cash recorded for a sale across legacy and receipt records.
 * received_total is an accumulated legacy field and may already include the
 * rows in sale_receipts, so use the larger value instead of adding both.
 */
export function getFiadoReceivedTotal(sale: any, receipts: any[]) {
  const receiptTotal = receipts
    .filter((receipt) => String(receipt.sale_id) === String(sale.id))
    .reduce((sum, receipt) => sum + Number(receipt.amount || 0), 0)

  const legacyTotal = Number(sale.received_total || 0)
  return Math.max(legacyTotal, receiptTotal)
}

export function getFiadoDebt(sale: any) {
  const payment = String(sale.payment || "")

  if (payment.includes(" + ")) {
    return payment.split(" + ").reduce((total, part) => {
      const [method, valueText] = part.split(": R$ ")
      if (String(method).trim() !== "Fiado") return total
      return total + Number(String(valueText || "0").replace(",", "."))
    }, 0)
  }

  return payment === "Fiado" ? Number(sale.total || 0) : 0
}

/** Discounts granted while receiving reduce the debt, but are not cash. */
export function getFiadoBalance(sale: any, receipts: any[]) {
  const cashReceived = getFiadoReceivedTotal(sale, receipts)
  const debtDiscount = Number(sale.received_discount || 0)
  const debt = getFiadoDebt(sale)
  const saleReceipts = receipts.filter(
    (receipt) => String(receipt.sale_id) === String(sale.id),
  )

  const legacyAdjustment = getLegacyFiadoAdjustment(sale, saleReceipts, debt, cashReceived)
  return Math.max(0, debt - cashReceived - debtDiscount - legacyAdjustment)
}

export function isPendingFiado(sale: any, receipts: any[]) {
  return getFiadoDebt(sale) > 0 && getFiadoBalance(sale, receipts) > 0
}

export function isSettledFiado(sale: any, receipts: any[]) {
  return getFiadoDebt(sale) > 0 && getFiadoBalance(sale, receipts) === 0
}

/**
 * Old Fiado settlements had no sale_receipts rows, stored the payment time and
 * method on sales, excluded freight from received_total, and stored a settle-
 * ment discount in discount. Only recognize those adjustments when all legacy
 * markers are present and the amounts exactly reconcile to the sale debt.
 */
function getLegacyFiadoAdjustment(
  sale: any,
  saleReceipts: any[],
  debt: number,
  cashReceived: number,
) {
  if (
    String(sale.payment || "") !== "Fiado" ||
    saleReceipts.length > 0 ||
    sale.status !== "Pago" ||
    !sale.received_at ||
    !sale.received_payment ||
    Number(sale.received_discount || 0) > 0
  ) {
    return 0
  }

  const legacyFreight = Math.max(0, Number(sale.delivery_fee || 0))
  const legacyDiscount = Math.max(0, Number(sale.discount || 0))
  const adjustments = legacyFreight + legacyDiscount
  if (adjustments <= 0) return 0

  // Compare cents to avoid floating point noise; never apply a partial or
  // original sale discount unless the legacy fields exactly explain payment.
  const reconciledTotal = Math.round((cashReceived + adjustments) * 100)
  const debtInCents = Math.round(debt * 100)
  return reconciledTotal === debtInCents ? adjustments : 0
}
