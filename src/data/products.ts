export interface Product {
  id: number
  name: string
  category: string
  stock: number
  purchasePrice: number
  salePrice: number
}

export const products: Product[] = [
  {
    id: 1,
    name: "Heineken 350ml",
    category: "Cerveja",
    stock: 84,
    purchasePrice: 4.50,
    salePrice: 6.00
  },
  {
    id: 2,
    name: "Coca-Cola 2L",
    category: "Refrigerante",
    stock: 20,
    purchasePrice: 8.00,
    salePrice: 15.00
  }
]