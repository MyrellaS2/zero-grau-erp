import { useState } from "react"
import { products } from "../data/products"

function Produtos() {
  const [showForm, setShowForm] = useState(false)
  const [productList, setProductList] = useState(products)
  const [name, setName] = useState("")
const [category, setCategory] = useState("")
const [stock, setStock] = useState("")
const [purchasePrice, setPurchasePrice] = useState("")
const [salePrice, setSalePrice] = useState("")
function handleSaveProduct() {

  const newProduct = {
    id: productList.length + 1,
    name,
    category,
    stock: Number(stock),
    purchasePrice: Number(purchasePrice),
    salePrice: Number(salePrice)
  }

  setProductList([
    ...productList,
    newProduct
  ])

  setName("")
  setCategory("")
  setStock("")
  setPurchasePrice("")
  setSalePrice("")

  setShowForm(false)
}
  return (
    <div>

      <h1 className="text-3xl font-bold">
        Produtos
      </h1>

      <p className="mt-2 text-gray-500">
        Controle dos produtos da ZERO GRAU
      </p>


      <button
  onClick={() => setShowForm(!showForm)}
  className="bg-blue-600 text-white px-5 py-2 rounded-lg"
>
  + Novo produto
</button>
{showForm && (
  <div className="mt-6 bg-white rounded-xl shadow p-6">

    <h2 className="font-bold text-lg">
      Novo produto
    </h2>


    <div className="mt-4 space-y-3">

      <input
  className="border p-2 rounded w-full"
  placeholder="Nome do produto"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

      <input
  className="border p-2 rounded w-full"
  placeholder="Categoria"
  value={category}
  onChange={(e) => setCategory(e.target.value)}
/>

      <input
  className="border p-2 rounded w-full"
  placeholder="Quantidade em estoque"
  type="number"
  value={stock}
  onChange={(e) => setStock(e.target.value)}
/>

      <input
  className="border p-2 rounded w-full"
  placeholder="Preço de compra"
  type="number"
  value={purchasePrice}
  onChange={(e) => setPurchasePrice(e.target.value)}
/>

      <input
  className="border p-2 rounded w-full"
  placeholder="Preço de venda"
  type="number"
  value={salePrice}
  onChange={(e) => setSalePrice(e.target.value)}
/>


      <button
  onClick={handleSaveProduct}
  className="bg-blue-600 text-white px-5 py-2 rounded-lg"
>
  Salvar produto
</button>

    </div>

  </div>
)}


      <div className="mt-8 bg-white rounded-xl shadow p-6">

        <h2 className="font-bold text-lg">
          Lista de produtos
        </h2>


        <div className="mt-4 space-y-3">

          {productList.map((product) => (
            <div 
              key={product.id}
              className="border rounded-lg p-4"
            >

              <h3 className="font-bold">
                {product.name}
              </h3>

              <p>
                Categoria: {product.category}
              </p>

              <p>
                Estoque: {product.stock}
              </p>

              <p>
                Venda: R$ {product.salePrice.toFixed(2)}
              </p>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}

export default Produtos