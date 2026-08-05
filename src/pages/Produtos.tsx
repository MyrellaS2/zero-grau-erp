import { useState, useEffect } from "react"
import { products } from "../data/products"
import { categories } from "../data/categories"
import { brands } from "../data/brands"
import { volumes } from "../data/volumes"

function Produtos() {
  const [showForm, setShowForm] = useState(false)
  const [productList, setProductList] = useState(() => {
  const saved = localStorage.getItem("products")

  return saved ? JSON.parse(saved) : products
})
  const [name, setName] = useState("")
const [category, setCategory] = useState("")
const [brand, setBrand] = useState("")
const [volume, setVolume] = useState("")
const [entryType, setEntryType] = useState("Unidade")
const [quantity, setQuantity] = useState("")
const [itemsPerPackage, setItemsPerPackage] = useState("")
const [stock, setStock] = useState("")
const [purchasePrice, setPurchasePrice] = useState("")
const [salePrice, setSalePrice] = useState("")
const [editingId, setEditingId] = useState<number | null>(null)
const [search, setSearch] = useState("")
const [selectedCategory, setSelectedCategory] = useState("Todos")
useEffect(() => {
  localStorage.setItem(
    "products",
    JSON.stringify(productList)
  )
}, [productList])
function handleSaveProduct() {
  const calculatedStock =
  entryType === "Fardo"
    ? Number(quantity) * Number(itemsPerPackage)
    : Number(quantity)

  if (editingId !== null) {

    setProductList(
      productList.map((product) =>
        product.id === editingId
          ? {
    ...product,
    name,
    category,
    brand,
    volume,
    entryType,
    quantity,
    itemsPerPackage,
    stock: calculatedStock,
    purchasePrice: Number(purchasePrice),
    salePrice: Number(salePrice)
  }
          : product
      )
    )

    setEditingId(null)

  } else {

    const newProduct = {
  id: productList.length + 1,
  name,
  category,
  brand,
  volume,
  entryType,
  quantity,
  itemsPerPackage,
  stock: calculatedStock,
  purchasePrice: Number(purchasePrice),
  salePrice: Number(salePrice)
}

    setProductList([
      ...productList,
      newProduct
    ])

  }

  setName("")
  setCategory("")
  setStock("")
  setQuantity("")
setItemsPerPackage("")
setEntryType("Unidade")
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
      


      <div className="mt-8 flex justify-between items-center">

  <button
    onClick={() => setShowForm(!showForm)}
    className="bg-blue-800 hover:bg-blue-900 text-white px-5 py-2 rounded-lg transition"
  >
    + Novo produto
  </button>

  <input
    type="text"
    placeholder="Pesquisar produto..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-96 border rounded-lg p-2"
  />

</div>


<div className="mt-6 flex gap-2 flex-wrap">

  {["Todos", ...categories].map((item) => (
    <button
      key={item}
      onClick={() => setSelectedCategory(item)}
      className={`px-4 py-2 rounded-lg text-sm font-semibold ${
        selectedCategory === item
          ? "bg-blue-800 text-white"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {item}
    </button>
  ))}

</div>


{showForm && (
  <div className="mt-6 bg-white rounded-xl shadow p-6">

    <h2 className="font-bold text-lg">
  {editingId !== null ? "Editar produto" : "Novo produto"}
</h2>


    <div className="mt-4 space-y-3">

      <input
  className="border p-2 rounded w-full"
  placeholder="Nome do produto"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

      <select
  className="border p-2 rounded w-full"
  value={category}
  onChange={(e) => {
    setCategory(e.target.value)
    setBrand("")
  }}
>
  <option value="">
    Selecione uma categoria
  </option>

  {categories.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))}

</select>
<select
  className="border p-2 rounded w-full"
  value={brand}
  onChange={(e) => setBrand(e.target.value)}
>
  <option value="">
    Selecione a marca
  </option>

  {category &&
    brands[category as keyof typeof brands]?.map((item) => (
      <option key={item} value={item}>
        {item}
      </option>
    ))
  }

</select>
<select
  className="border p-2 rounded w-full"
  value={volume}
  onChange={(e) => setVolume(e.target.value)}
>
  <option value="">
    Selecione o volume
  </option>

  {category &&
  volumes[category as keyof typeof volumes]?.map((item) => (
    <option key={item} value={item}>
      {item}
    </option>
  ))
}

</select>

      <select
  className="border p-2 rounded w-full"
  value={entryType}
  onChange={(e) => setEntryType(e.target.value)}
>
  <option value="Unidade">
    Unidade
  </option>

  <option value="Fardo">
    Fardo
  </option>

</select>


<input
  className="border p-2 rounded w-full"
  placeholder="Quantidade comprada"
  type="number"
  value={quantity}
  onChange={(e) => setQuantity(e.target.value)}
/>


{entryType === "Fardo" && (
  <input
    className="border p-2 rounded w-full"
    placeholder="Quantidade de unidades no fardo"
    type="number"
    value={itemsPerPackage}
    onChange={(e) => setItemsPerPackage(e.target.value)}
  />
)}

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
  className="bg-blue-800 text-white px-5 py-2 rounded-lg"
>
  {editingId !== null ? "Atualizar produto" : "Salvar produto"}
</button>

    </div>

  </div>
)}


      <div className="mt-10 bg-white rounded-xl shadow p-6">

        <h2 className="font-bold text-lg">
          Lista de produtos
        </h2>
        

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">

          {productList
  .filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  )
  .filter((product) =>
    selectedCategory === "Todos"
      ? true
      : product.category === selectedCategory
  )
  .map((product) => (
  <div
    key={product.id}
    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-5"
  >
    <div className="flex justify-between items-start">

      <div>
        <h3 className="text-lg font-bold text-gray-800">
          {product.name}
        </h3>

        <p className="text-sm text-gray-500 mt-1">
  {product.category}
</p>

<p className="text-sm text-gray-500">
  {product.brand} • {product.volume}
</p>
      </div>

      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold ${
          product.stock >= 20
            ? "bg-green-100 text-green-700"
            : product.stock > 5
            ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        }`}
      >
        {product.stock} unidades
      </span>

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

        <p className="font-semibold">
          R$ {product.salePrice.toFixed(2)}
        </p>
      </div>

    </div>

    <div className="mt-5 flex gap-3">

      <button
  onClick={() => {
    setEditingId(product.id)

    setName(product.name)
    setCategory(product.category)

    setBrand(product.brand)
    setVolume(product.volume)
    setEntryType(product.entryType)
    setQuantity(product.quantity)
    setItemsPerPackage(product.itemsPerPackage)

    setStock(product.stock.toString())
    setPurchasePrice(product.purchasePrice.toString())
    setSalePrice(product.salePrice.toString())

    setShowForm(true)
  }}
  className="bg-purple-800 hover:bg-purple-900 text-white px-4 py-2 rounded-lg transition"
>
  Editar
</button>

            <button
        onClick={() => {
          setProductList(
            productList.filter((item) => item.id !== product.id)
          )
        }}
        className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-lg transition"
      >
        Apagar
      </button>

    </div>

  </div>
))}

        </div>

      </div>

    </div>
  )
}

export default Produtos