import type { Product } from "../../types/product"

import Card from "../ui/Card"
import Button from "../ui/Button"


interface ProductCardProps {

  product: Product

  onEdit: (product: Product) => void

  onDelete: (id:number) => void
  onStock: (product: Product) => void

}



function ProductCard({

product,

onEdit,

onDelete,

onStock

}: ProductCardProps) {


  return (

    <Card>


      <div className="flex justify-between">


        <div>


          <h3 className="text-lg font-bold">

            {product.name}

          </h3>



          <p className="text-gray-500">

            {product.category}

          </p>



          <p className="text-gray-500">

            {product.brand}


            {product.flavor &&
              ` • ${product.flavor}`}


            {product.volume &&
              ` • ${product.volume}`}


          </p>


        </div>




        <div className="text-right">


          <p className="text-sm text-gray-500">

            Estoque

          </p>



          <p className="text-2xl font-bold">

            {product.stock}

          </p>


        </div>


      </div>





      <div className="mt-5 flex gap-8">


        <div>


          <p className="text-xs text-gray-500">

            Compra

          </p>


          <p className="font-semibold">

            R$ {product.purchasePrice.toFixed(2)}

          </p>


        </div>





        <div>


          <p className="text-xs text-gray-500">

            Venda

          </p>


          <p className="font-semibold text-green-700">

            R$ {product.salePrice.toFixed(2)}

          </p>


        </div>


      </div>





      <div className="mt-6 flex gap-3">
        <Button

  onClick={() => onStock(product)}

>

  Estoque

</Button>


        <Button

          onClick={() => onEdit(product)}

        >

          Editar

        </Button>





        <Button

          variant="danger"

          onClick={() => onDelete(product.id)}

        >

          Excluir

        </Button>


      </div>


    </Card>

  )

}


export default ProductCard