import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"


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
const [search, setSearch] = useState("")
const [categoryFilter, setCategoryFilter] = useState("")


  


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
      console.log("DADOS CATEGORIAS RAW:", categoriesData)


  const { data: brandsData } =
    await supabase
      .from("brands")
      .select("*")


  const { data: flavorsData } =
    await supabase
      .from("flavors")
      .select("*")
      const { data: movementsData, error: movementsError } =
  await supabase
    .from("stock_movements")
    .select("*")
    .order("date", { ascending: false })

if(movementsError){

  console.error(
    "ERRO AO CARREGAR MOVIMENTAÇÕES:",
    movementsError
  )

}else if(movementsData){

 setStockMovements(
  movementsData.map((item: any) => ({
    id: item.id,
    productId: item.product_id,
    productName: item.product_name,
    type: item.type,
    quantity: Number(item.quantity || 0),
    previousStock: Number(item.previous_stock || 0),
    currentStock: Number(item.current_stock || 0),
    date: item.date,
    observation: item.observation || ""
  }))
)

}



  if(productsData){

   setProducts(
  productsData.map(item => ({
    ...item,
    purchasePrice: item.purchase_price,
    salePrice: item.sale_price,
    salePricePackage:
  item.sale_price_package,
    entryType: item.entry_type,
    itemsPerPackage: item.items_per_package
  })) as Product[]
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

  console.log("BRANDS DO SUPABASE:", brandsData)

  setBrands(
    brandsData as Brand[]
  )

}else{

  console.log("NÃO VEIO MARCA")

}

  console.log("MARCAS RECEBIDAS:", brandsData)


  if(flavorsData){

    setFlavors(
      flavorsData as Flavor[]
    )

  }


}


loadData()

}, [])




async function saveProduct(product: Product) {
  const productData = {
    name: product.name,
    category: product.category,
    brand: product.brand,
    flavor: product.flavor,
    volume: product.volume,
    entry_type: product.entryType,
    quantity: Number(product.quantity),
    items_per_package: Number(
      product.itemsPerPackage
    ),
    purchase_price: product.purchasePrice,
    sale_price: product.salePrice,
    sale_price_package:
      product.salePricePackage
        ? Number(product.salePricePackage)
        : null,
  }

  if (product.id && editingProduct) {
    // EDITAR: não altera o estoque
    const { error } = await supabase
      .from("products")
      .update(productData)
      .eq("id", product.id)

    if (error) {
      console.log(error)
      alert("Erro ao atualizar produto")
      return
    }
    } else {
    // NOVO PRODUTO: calcula e salva o estoque inicial
    const stockInicial =
      product.entryType === "Fardo"
        ? Number(product.quantity) *
          Number(product.itemsPerPackage)
        : Number(product.quantity)

    const newProductData = {
      ...productData,
      stock: stockInicial,
    }

    const { data, error } =
      await supabase
        .from("products")
        .insert(newProductData)
        .select()

    if (error) {
      console.log(error)
      alert("Erro ao salvar produto")
      return
    }

    if (data) {
      const newProduct = {
        ...data[0],
        purchasePrice:
          Number(data[0].purchase_price || 0),
        salePrice:
          Number(data[0].sale_price || 0),
        salePricePackage:
          data[0].sale_price_package !== null &&
          data[0].sale_price_package !== undefined
            ? Number(data[0].sale_price_package)
            : null,
        entryType:
          data[0].entry_type,
        itemsPerPackage:
          data[0].items_per_package,
        stock:
          Number(data[0].stock || 0),
      }

      setProducts([
        ...products,
        newProduct as Product,
      ])
    }
  }

  alert("Produto salvo!")
  setEditingProduct(null)
}



function deleteProduct(id:number){

  const confirmDelete =
    window.confirm(
      "Excluir esse produto?"
    )

  if(!confirmDelete)
    return


  async function remove(){

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)


    if(error){
      console.log(error)
      alert("Erro ao excluir")
      return
    }


    setProducts(
      products.filter(
        item => item.id !== id
      )
    )

  }


  remove()

}


async function addStock(
  id: number,
  quantity: number,
  type: "Entrada" | "Saída"
){

  const product = products.find(
    item => item.id === id
  )

  if(!product)
    return


  const previousStock =
    Number(product.stock)


  let currentStock: number


  if(type === "Entrada"){

    currentStock =
      previousStock + quantity

  }else{

    currentStock =
      previousStock - quantity


    if(currentStock < 0){

      alert("Estoque insuficiente")

      return

    }

  }


  // Atualiza o estoque no Supabase
  const { error: productError } =
    await supabase
      .from("products")
      .update({
        stock: currentStock
      })
      .eq("id", id)


  if(productError){

    console.error(
      "ERRO AO ATUALIZAR ESTOQUE:",
      productError
    )

    alert("Erro ao atualizar estoque")

    return

  }


  // Salva a movimentação no Supabase
const { data: movementData, error: movementError } =
  await supabase
    .from("stock_movements")
    .insert({
      product_id: product.id,
      product_name: product.name,
      type: type,
      quantity: quantity,
      previous_stock: previousStock,
      current_stock: currentStock,
      date: new Date().toISOString(),
    })
    .select()

if (movementError) {
  console.error(
    "ERRO AO SALVAR MOVIMENTAÇÃO:",
    movementError
  )

  alert(
    "Estoque atualizado, mas houve erro ao salvar o histórico:\n\n" +
      movementError.message
  )
}





  // Atualiza o produto na tela
  const updatedProducts =
    products.map(item =>
      item.id === id
        ? {
            ...item,
            stock: currentStock
          }
        : item
    )


  setProducts(updatedProducts)


  // Atualiza o histórico na tela
  if(movementData){

    const movement =
      movementData[0] as StockMovement

    setStockMovements([
      ...stockMovements,
      movement
    ])

  }

}


useEffect(() => {
  console.log("CATEGORIAS ATUALIZADAS:", categories)
  console.log("BRANDS ATUALIZADAS:", brands)
  console.log("SABORES ATUALIZADOS:", flavors)
}, [categories, brands, flavors])
const filteredProducts = products.filter((product) => {

  const searchText = search.toLowerCase().trim()

  const matchesSearch =
    !searchText ||
    product.name.toLowerCase().includes(searchText) ||
    product.brand.toLowerCase().includes(searchText) ||
    product.flavor.toLowerCase().includes(searchText)

  const matchesCategory =
    !categoryFilter ||
    product.category === categoryFilter

  return matchesSearch && matchesCategory
})
  return (

    <div>


      <h1 className="text-3xl font-bold">

        Produtos

      </h1>



      <p className="mt-2 text-gray-500">

        Cadastro e controle de estoque ZERO GRAU

      </p>
<div className="mt-6 bg-white p-4 rounded-xl shadow">

  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

    <input
      type="text"
      placeholder="Pesquisar produto, marca ou sabor..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="
        border
        rounded-lg
        px-4
        py-2
        outline-none
        focus:ring-2
        focus:ring-blue-600
      "
    />

    <select
      value={categoryFilter}
      onChange={(e) => setCategoryFilter(e.target.value)}
      className="
        border
        rounded-lg
        px-4
        py-2
        bg-white
        outline-none
        focus:ring-2
        focus:ring-blue-600
      "
    >

      <option value="">
        Todas as categorias
      </option>

      {categories.map((category) => (
        <option
          key={category}
          value={category}
        >
          {category}
        </option>
      ))}

    </select>

  </div>

  <p className="text-sm text-gray-500 mt-3">
    Mostrando {filteredProducts.length} de {products.length} produtos
  </p>

</div>




      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-8">



        <div>


          <ProductForm

  key={
    categories.length +
    brands.length +
    flavors.length
  }

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

  products={filteredProducts}

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
  products={products}
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