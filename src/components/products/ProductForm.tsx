import { useEffect, useState } from "react"

import type { Product, Brand, Flavor } from "../../types/product"

import Card from "../ui/Card"
import Button from "../ui/Button"
import Input from "../ui/Input"


interface ProductFormProps {

  categories: string[]

  brands: Brand[]

  flavors: Flavor[]

  product?: Product | null

  onSave: (product: Product) => void

  onCancel: () => void

}


function ProductForm({
  

  categories,

  brands,

  flavors,

  product,

  onSave,

  onCancel

}: ProductFormProps) {
  


  const [name, setName] = useState("")

  const [category, setCategory] = useState("")

  const [brand, setBrand] = useState("")

  const [flavor, setFlavor] = useState("")

  const [volume, setVolume] = useState("")


  const [entryType, setEntryType] = useState<
    "Unidade" | "Fardo"
  >("Unidade")


  const [quantity, setQuantity] = useState("")


  const [itemsPerPackage, setItemsPerPackage] =
    useState("")


  const [purchasePrice, setPurchasePrice] =
    useState("")


  const [salePrice, setSalePrice] =
    useState("")



  useEffect(()=>{


    if(!product){

      clearForm()

      return

    }


    setName(product.name)

    setCategory(product.category)

    setBrand(product.brand)

    setFlavor(product.flavor)

    setVolume(product.volume)

    setEntryType(product.entryType)

    setQuantity(product.quantity)

    setItemsPerPackage(
      product.itemsPerPackage
    )

    setPurchasePrice(
      String(product.purchasePrice)
    )

    setSalePrice(
      String(product.salePrice)
    )


  },[product])



  function clearForm(){


    setName("")

    setCategory("")

    setBrand("")

    setFlavor("")

    setVolume("")

    setEntryType("Unidade")

    setQuantity("")

    setItemsPerPackage("")

    setPurchasePrice("")

    setSalePrice("")


  }



  function handleSave(){


    if(
  !name.trim() ||
  !category ||
  !quantity ||
  !purchasePrice ||
  !salePrice
){

  alert(
    "Preencha os campos obrigatórios"
  )

  return

}



    const stock =

      entryType === "Fardo"

      ?

      Number(quantity) *
      Number(itemsPerPackage)

      :

      Number(quantity)



    const newProduct: Product = {


      id:
        product?.id ??
        Date.now(),


      name,

      category,

      brand,

      flavor,

      volume,

      entryType,

      quantity,

      itemsPerPackage,

      stock,


      purchasePrice:
        Number(purchasePrice),


      salePrice:
        Number(salePrice)


    }



    onSave(newProduct)


    clearForm()


  }
    return (

    <Card>

      <h2 className="text-xl font-bold mb-5">

        {product
          ? "Editar produto"
          : "Novo produto"}

      </h2>



      <div className="space-y-4">


        <Input

          placeholder="Nome do produto"

          value={name}

          onChange={(e)=>
            setName(e.target.value)
          }

        />



        <select

          className="
            w-full
            border
            rounded-lg
            p-2
          "

          value={category}

          onChange={(e)=>{

            setCategory(e.target.value)

setBrand("")

setFlavor("")

          }}

        >

          <option value="">
            Selecione a categoria
          </option>


         {categories.map((item)=>(

  <option
    key={item}
    value={item}
  >
    {item}
  </option>

))}


        </select>




        <select

          className="
            w-full
            border
            rounded-lg
            p-2
          "

          value={brand}

          onChange={(e)=>
            setBrand(e.target.value)
          }

        >

          <option value="">
  Sem marca
</option>


          {brands.map((item)=>(

  <option
    key={item.id}
    value={item.name}
  >
    {item.name}
  </option>

))}

          


        </select>





        <select

          className="
            w-full
            border
            rounded-lg
            p-2
          "

          value={flavor}

          onChange={(e)=>
            setFlavor(e.target.value)
          }

        >

          <option value="">
            Sem sabor
          </option>


          {flavors

            .filter(
              (item)=>
                item.category === category
            )

            .map((item)=>(

              <option

                key={item.name}

                value={item.name}

              >

                {item.name}

              </option>

            ))

          }


        </select>





        <Input

          placeholder="Volume (ex: 350ml)"

          value={volume}

          onChange={(e)=>
            setVolume(e.target.value)
          }

        />




        <select

          className="
            w-full
            border
            rounded-lg
            p-2
          "

          value={entryType}

          onChange={(e)=>
            setEntryType(
              e.target.value as
              "Unidade" | "Fardo"
            )
          }

        >

          <option value="Unidade">
            Unidade
          </option>


          <option value="Fardo">
            Fardo
          </option>


        </select>
                <Input

          type="number"

          placeholder="Quantidade"

          value={quantity}

          onChange={(e)=>
            setQuantity(e.target.value)
          }

        />




        {entryType === "Fardo" && (

          <Input

            type="number"

            placeholder="Quantidade por fardo"

            value={itemsPerPackage}

            onChange={(e)=>
              setItemsPerPackage(
                e.target.value
              )
            }

          />

        )}





        <Input

          type="number"

          placeholder="Preço de compra"

          value={purchasePrice}

          onChange={(e)=>
            setPurchasePrice(
              e.target.value
            )
          }

        />





        <Input

          type="number"

          placeholder="Preço de venda"

          value={salePrice}

          onChange={(e)=>
            setSalePrice(
              e.target.value
            )
          }

        />





        <div className="flex gap-3 pt-4">


          <Button

            onClick={handleSave}

          >

            {product
              ? "Atualizar produto"
              : "Salvar produto"}

          </Button>




          <Button

            variant="secondary"

            onClick={onCancel}

          >

            Cancelar

          </Button>


        </div>


      </div>


    </Card>

  )

}


export default ProductForm