import assert from "node:assert/strict"
import test from "node:test"
import {
  getFiadoBalance,
  getFiadoReceivedTotal,
  isPendingFiado,
  isSettledFiado,
} from "../src/utils/fiadoBalance.ts"

const legacySettled = (sale) => ({
  payment: "Fiado",
  status: "Pago",
  received_at: "2026-08-01T12:00:00Z",
  received_payment: "Pix",
  received_discount: 0,
  ...sale,
})

const legacySales = [
  legacySettled({ id: 108, total: 20, received_total: 15, delivery_fee: 5, discount: 0 }),
  legacySettled({ id: 45, total: 35, received_total: 30, delivery_fee: 5, discount: 0 }),
  legacySettled({ id: 92, total: 36, received_total: 32, delivery_fee: 0, discount: 4 }),
  legacySettled({ id: 36, total: 20, received_total: 18, delivery_fee: 0, discount: 2 }),
]

test("zera os quatro registros legados identificados e classifica como baixados", () => {
  for (const sale of legacySales) {
    assert.equal(getFiadoBalance(sale, []), 0, `venda ${sale.id}`)
    assert.equal(isPendingFiado(sale, []), false, `venda ${sale.id} não deve ficar pendente`)
    assert.equal(isSettledFiado(sale, []), true, `venda ${sale.id} deve aparecer como baixada`)
  }
})

test("não trata status Pago isoladamente como quitação", () => {
  const underpaid = legacySettled({
    id: 999,
    total: 100,
    received_total: 60,
    delivery_fee: 5,
    discount: 10,
  })
  assert.equal(getFiadoBalance(underpaid, []), 40)
  assert.equal(isPendingFiado(underpaid, []), true)
})

test("desconto original de venda nova não é aplicado novamente", () => {
  const sale = {
    id: 1,
    payment: "Fiado",
    status: "Pendente",
    total: 100,
    discount: 20,
    received_total: 60,
    received_discount: 0,
  }
  assert.equal(getFiadoBalance(sale, []), 40)
})

test("recebimentos em sale_receipts e received_total não são somados em duplicidade", () => {
  const sale = {
    id: 2,
    payment: "Fiado",
    status: "Pendente",
    total: 100,
    received_total: 70,
    received_discount: 0,
  }
  const receipts = [{ sale_id: 2, amount: 30 }]
  assert.equal(getFiadoReceivedTotal(sale, receipts), 70)
  assert.equal(getFiadoBalance(sale, receipts), 30)
})

test("desconto novo quita dívida sem virar recebimento em dinheiro", () => {
  const sale = {
    id: 3,
    payment: "Fiado",
    status: "Pago",
    total: 100,
    received_total: 90,
    received_discount: 10,
  }
  const receipts = [{ sale_id: 3, amount: 90, payment_method: "Pix" }]
  assert.equal(getFiadoReceivedTotal(sale, receipts), 90)
  assert.equal(getFiadoBalance(sale, receipts), 0)
})

test("pagamentos com Pix e dinheiro são somados pelas linhas de recebimento", () => {
  const sale = { id: 4, payment: "Fiado", status: "Pago", total: 100, received_total: 100 }
  const receipts = [
    { sale_id: 4, amount: 40, payment_method: "Pix" },
    { sale_id: 4, amount: 60, payment_method: "Dinheiro" },
  ]
  assert.equal(getFiadoBalance(sale, receipts), 0)
})

test("em venda dividida, considera apenas a parcela Fiado", () => {
  const sale = {
    id: 5,
    payment: "Pix: R$ 40.00 + Fiado: R$ 60.00",
    status: "Pendente",
    total: 100,
    received_total: 20,
  }
  assert.equal(getFiadoBalance(sale, []), 40)
  assert.equal(isPendingFiado(sale, []), true)
})

test("Fiado realmente pendente continua na lista", () => {
  const sale = { id: 6, payment: "Fiado", status: "Pendente", total: 75 }
  assert.equal(getFiadoBalance(sale, []), 75)
  assert.equal(isPendingFiado(sale, []), true)
  assert.equal(isSettledFiado(sale, []), false)
})
