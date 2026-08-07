import { useState } from "react"

import type { Product } from "../../types/product"

import Card from "../ui/Card"
import Button from "../ui/Button"
import Input from "../ui/Input"


interface StockModalProps {

  product: Product

  onClose: () => void

  onSave: (
id:number,
quantity:number,
type:"Entrada" | "Saída"
) => void

}


function StockModal({

  product,

  onClose,

  onSave

}: StockModalProps) {


  const [quantity, setQuantity] =
    useState("")
    const [type, setType] =
useState<"Entrada" | "Saída">("Entrada")



  function handleSave(){


    const value =
      Number(quantity)


    if(value <= 0){

      alert(
        "Digite uma quantidade válida"
      )

      return

    }


    onSave(
  product.id,
  value,
  type
)


    onClose()


  }



  return (

    <div className="
      fixed
      inset-0
      bg-black/50
      flex
      items-center
      justify-center
      z-50
    ">


      <Card className="w-96">


        <h2 className="text-xl font-bold">

          {type === "Entrada"
  ? "Entrada de estoque"
  : "Saída de estoque"
}
        </h2>



        <p className="text-gray-500 mt-2">

          {product.name}

        </p>
        <select

className="border rounded-lg p-2 w-full mt-5"

value={type}

onChange={(e)=>
  setType(
    e.target.value as
    "Entrada" | "Saída"
  )
}

>

<option value="Entrada">
  Entrada
</option>

<option value="Saída">
  Saída
</option>

</select>




        <Input
        

          className="mt-5"

          type="number"

          placeholder="Quantidade"

          value={quantity}

          onChange={(e)=>
            setQuantity(
              e.target.value
            )
          }

        />





        <div className="flex gap-3 mt-5">


          <Button

            onClick={handleSave}

          >

            Salvar

          </Button>





          <Button

            variant="secondary"

            onClick={onClose}

          >

            Cancelar

          </Button>


        </div>


      </Card>


    </div>

  )

}


export default StockModal