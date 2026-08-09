export interface Product {
  id: number

  name: string

  category: string

  brand: string

  flavor: string

  volume: string

  entryType: "Unidade" | "Fardo"

  quantity: string

  itemsPerPackage: string

  stock: number

  purchasePrice: number

  salePrice: number

  salePricePackage?: number | null
}

export interface Brand {
  name: string
  category: string
}

export interface Flavor {
  name: string
  category: string
}

export interface StockMovement {
  id: number

  productId: number

  productName: string

  type: "Entrada" | "Saída" | "Ajuste"

  quantity: number

  previousStock: number

  currentStock: number

  date: string

  observation?: string
}

export const products: Product[] = [
  {
    id: 1,

    name: "Heineken 350ml",

    category: "Cerveja",

    brand: "Heineken",

    flavor: "",

    volume: "350ml",

    entryType: "Unidade",

    quantity: "84",

    itemsPerPackage: "",

    stock: 84,

    purchasePrice: 4.50,

    salePrice: 6.00,

    salePricePackage: null
  },

  {
    id: 2,

    name: "Coca-Cola 2L",

    category: "Refrigerante",

    brand: "Coca-Cola",

    flavor: "",

    volume: "2L",

    entryType: "Unidade",

    quantity: "20",

    itemsPerPackage: "",

    stock: 20,

    purchasePrice: 8.00,

    salePrice: 15.00,

    salePricePackage: null
  }
]