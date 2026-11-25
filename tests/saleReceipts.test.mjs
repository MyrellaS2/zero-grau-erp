import assert from "node:assert/strict"
import test from "node:test"
import {
  buildInitialPaymentEntries,
  buildReceiptEntries,
  getOriginalPayment,
  isFiadoOrigin,
} from "../src/utils/saleReceipts.ts"

const fiadoSale = {
  id: 41,
  payment: "Fiado",
  status: "Pago",
  total: 100,
  date: "2026-11-01T10:00:00Z",
  products: [],
}

function buildOneReceipt(paymentMethod) {
  const [entry] = buildReceiptEntries(
    [{ id: 1, sale_id: fiadoSale.id, amount: 100, payment_method: paymentMethod, cash_register_id: 7, created_at: "2026-11-02T12:00:00Z" }],
    [fiadoSale],
  )
  return entry
}

test("preserva origem Fiado e forma Pix em campos separados", () => {
  const entry = buildOneReceipt("Pix")
  assert.equal(entry.original_payment, "Fiado")
  assert.equal(entry.payment, "Pix")
  assert.equal(entry.received_payment, "Pix")
  assert.equal(isFiadoOrigin(entry), true)
})

test("preserva origem Fiado e forma dinheiro em campos separados", () => {
  const entry = buildOneReceipt("Dinheiro")
  assert.equal(entry.original_payment, "Fiado")
  assert.equal(entry.payment, "Dinheiro")
  assert.equal(isFiadoOrigin(entry), true)
})

test("duas formas geram duas linhas com a mesma origem Fiado e valores próprios", () => {
  const entries = buildReceiptEntries(
    [
      { id: 2, sale_id: fiadoSale.id, amount: 40, payment_method: "Pix", cash_register_id: 7, created_at: "2026-11-02T12:00:00Z" },
      { id: 3, sale_id: fiadoSale.id, amount: 60, payment_method: "Dinheiro", cash_register_id: 7, created_at: "2026-11-02T12:01:00Z" },
    ],
    [fiadoSale],
  )
  assert.deepEqual(entries.map((entry) => entry.payment), ["Pix", "Dinheiro"])
  assert.deepEqual(entries.map((entry) => entry.original_payment), ["Fiado", "Fiado"])
  assert.deepEqual(entries.map((entry) => entry.amount_received), [40, 60])
  assert.ok(entries.every(isFiadoOrigin))
})

test("reconhece uma origem mista com parcela Fiado e mantém compatibilidade antiga", () => {
  const mixedSale = {
    ...fiadoSale,
    id: 42,
    payment: "Pix: R$ 40.00 + Fiado: R$ 60.00",
  }
  const [receipt] = buildReceiptEntries(
    [{ id: 4, sale_id: 42, amount: 60, payment_method: "Dinheiro", cash_register_id: 7, created_at: "2026-11-02T12:02:00Z" }],
    [mixedSale],
  )
  assert.equal(isFiadoOrigin(receipt), true)

  const oldSaleEntry = { payment: "Fiado" }
  assert.equal(getOriginalPayment(oldSaleEntry), "Fiado")
  assert.equal(isFiadoOrigin(oldSaleEntry), true)
})

test("forma de venda normal continua classificada como venda normal", () => {
  const entry = buildReceiptEntries(
    [{ id: 5, sale_id: 43, amount: 100, payment_method: "Pix", cash_register_id: 7, created_at: "2026-11-02T12:03:00Z" }],
    [{ ...fiadoSale, id: 43, payment: "Crédito" }],
  )[0]
  assert.equal(isFiadoOrigin(entry), false)
  assert.equal(entry.payment, "Pix")
})

test("pagamento imediato sintético de venda mista não é rotulado como Fiado quitado", () => {
  const mixedSale = {
    ...fiadoSale,
    id: 44,
    payment: "Pix: R$ 40.00 + Fiado: R$ 60.00",
  }
  const entries = buildInitialPaymentEntries([mixedSale], new Set(["44"]), 7)
  assert.equal(entries.length, 1)
  assert.equal(entries[0].payment, "Pix")
  assert.equal(entries[0].original_payment, mixedSale.payment)
  assert.equal(entries[0].is_initial_payment, true)
  assert.equal(isFiadoOrigin(entries[0]), false)
})
