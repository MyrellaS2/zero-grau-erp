import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

import {
  products as initialProducts
} from "../types/product"

import type {
Product,
Brand,
Flavor,
StockMovement
} from "../types/product"

import ProductForm from "../components/products/ProductForm"
import ProductList from "../components/products/ProductList"
import StockModal from "../components/products/StockModal"
import StockHistory from "../components/stock/StockHistory"


function Produtos() {


  const [products, setProducts] =
    useState<Product[]>([])


  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null)


  const [stockProduct, setStockProduct] =
    useState<Product | null>(null)
    const [stockMovements, setStockMovements] =
useState<StockMovement[]>([])



 const [categories, setCategories] =
useState<string[]>([])


  const [brands, setBrands] =
useState<Brand[]>([])


const [flavors, setFlavors] =
useState<Flavor[]>([])


  


useEffect(() => {

async function loadData(){

  const { data: productsData } =
    await supabase
      .from("products")
      .select("*")


  const { data: categoriesData } =
    await supabase
      .from("categories")
      .select("*")


  const { data: brandsData } =
    await supabase
      .from("brands")
      .select("*")


  const { data: flavorsData } =
    await supabase
      .from("flavors")
      .select("*")



  if(productsData){

    setProducts(
      productsData as Product[]
    )

  }


  if(categoriesData){

    setCategories(
      categoriesData.map(
        item => item.name
      )
    )

  }


  if(brandsData){

    setBrands(
      brandsData as Brand[]
    )

  }


  if(flavorsData){

    setFlavors(
      flavorsData as Flavor[]
    )

  }


}


loadData()

}, [])




  function saveProduct(product:Product){


    let updatedProducts:Product[]



    const exists =
      products.some(
        item =>
          item.id === product.id
      )



    if(exists){


      updatedProducts =
        products.map(
          item =>
            item.id === product.id
            ? product
            : item
        )


    }else{


      updatedProducts = [
        ...products,
        product
      ]


    }



    setProducts(
      updatedProducts
    )


    localStorage.setItem(
      "products",
      JSON.stringify(updatedProducts)
    )


    setEditingProduct(null)


  }





  function deleteProduct(id:number){


    const confirmDelete =
      window.confirm(
        "Excluir esse produto?"
      )


    if(!confirmDelete)
      return



    const updated =
      products.filter(
        item =>
          item.id !== id
      )



    setProducts(updated)


    localStorage.setItem(
      "products",
      JSON.stringify(updated)
    )


  }





  function addStock(
  id:number,
  quantity:number,
  type:"Entrada" | "Saída"
){

  const product =
    products.find(
      item => item.id === id
    )


  if(!product)
    return



  const previousStock =
    product.stock



  let currentStock:number


  if(type === "Entrada"){

    currentStock =
      previousStock + quantity

  }else{


    currentStock =
      previousStock - quantity


    if(currentStock < 0){

      alert(
        "Estoque insuficiente"
      )

      return

    }

  }



  const updatedProducts =
    products.map(
      item =>

        item.id === id

        ?

        {
          ...item,

          stock: currentStock

        }

        :

        item
    )



  const movement: StockMovement = {

    id: Date.now(),

    productId: product.id,

    productName: product.name,

    type,

    quantity,

    previousStock,

    currentStock,

    date:
      new Date()
      .toLocaleString(),

    observation:
      type === "Entrada"

      ?

      "Entrada de estoque"

      :

      "Saída de estoque"

  }



  const updatedMovements = [

    ...stockMovements,

    movement

  ]



  setProducts(
    updatedProducts
  )


  setStockMovements(
    updatedMovements
  )



  localStorage.setItem(
    "products",
    JSON.stringify(updatedProducts)
  )


  localStorage.setItem(
    "stockMovements",
    JSON.stringify(updatedMovements)
  )

}




  return (

    <div>


      <h1 className="text-3xl font-bold">

        Produtos

      </h1>



      <p className="mt-2 text-gray-500">

        Cadastro e controle de estoque ZERO GRAU

      </p>





      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">



        <div>


          <ProductForm

            categories={categories}

            brands={brands}

            flavors={flavors}

            product={editingProduct}

            onSave={saveProduct}

            onCancel={()=>
              setEditingProduct(null)
            }

          />


        </div>





        <div className="xl:col-span-2">


          <ProductList

            products={products}

            onEdit={
              setEditingProduct
            }

            onDelete={
              deleteProduct
            }
            onStock={
  setStockProduct
}

          />


        </div>
        <StockHistory

  movements={stockMovements}

/>



      </div>




      {stockProduct && (

        <StockModal

          product={stockProduct}

          onClose={()=>
            setStockProduct(null)
          }

          onSave={addStock}

        />

      )}



    </div>

  )

}


export default Produtos