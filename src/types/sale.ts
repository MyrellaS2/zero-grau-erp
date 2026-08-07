import type { Product } from "./product"

export interface CartItem {
  id: number

  name: string

  quantity: number

  purchasePrice: number

  salePrice: number

  total: number
}

export interface Sale {
  id: number

  products: CartItem[]

  product: string

  quantity: number

  total: number

  profit: number

  customer: string

  payment: "Pix" | "Dinheiro" | "Débito" | "Crédito" | "Fiado"

  status: "Pago" | "Pendente"

  date: string
}