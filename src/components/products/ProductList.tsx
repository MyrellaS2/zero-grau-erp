import type { Product } from "../../types/product"

import ProductCard from "./ProductCard"


interface ProductListProps {

products: Product[]

onEdit: (product: Product) => void

onDelete: (id:number) => void

onStock: (product: Product) => void

}


function ProductList({

products,

onEdit,

onDelete,

onStock

}: ProductListProps) {


  if(products.length === 0){

    return (

      <p className="text-gray-500 mt-5">

        Nenhum produto cadastrado.

      </p>

    )

  }



  return (

    <div className="
      grid
      grid-cols-1
      lg:grid-cols-2
      gap-5
    ">

      {products.map((product)=>(

        <ProductCard

  key={product.id}

  product={product}

  onEdit={onEdit}

  onDelete={onDelete}

  onStock={onStock}

/>

      ))}

    </div>

  )

}


export default ProductList