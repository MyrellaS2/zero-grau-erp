import { useEffect, useState } from "react"


function Produtos() {


  const [showForm, setShowForm] = useState(false)


  const [productList, setProductList] = useState<any[]>(() => {

    const saved = localStorage.getItem("products")

    return saved ? JSON.parse(saved) : []

  })



  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [flavors, setFlavors] = useState<any[]>([])



  useEffect(() => {

    const savedCategories =
      localStorage.getItem("categories")

    const savedBrands =
      localStorage.getItem("brands")

    const savedFlavors =
      localStorage.getItem("flavors")


    if (savedCategories) {
      setCategories(JSON.parse(savedCategories))
    }


    if (savedBrands) {
      setBrands(JSON.parse(savedBrands))
    }


    if (savedFlavors) {

  const data = JSON.parse(savedFlavors)

  setFlavors(data)

}


  }, [])





  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [brand, setBrand] = useState("")
  const [flavor, setFlavor] = useState("")
  const [volume, setVolume] = useState("")

  const [entryType, setEntryType] = useState("Unidade")

  const [quantity, setQuantity] = useState("")
  const [itemsPerPackage, setItemsPerPackage] = useState("")

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
        ?
        Number(quantity) * Number(itemsPerPackage)
        :
        Number(quantity)



    if (editingId !== null) {


      setProductList(

        productList.map((product) =>

          product.id === editingId

            ?
            {

              ...product,

              name,
              category,
              brand,
              flavor,
              volume,

              entryType,

              quantity,

              itemsPerPackage,

              stock: calculatedStock,

              purchasePrice: Number(purchasePrice),

              salePrice: Number(salePrice)

            }

            :

            product

        )

      )


      setEditingId(null)


    } else {


      const newProduct = {


        id: Date.now(),

        name,

        category,

        brand,

        flavor,

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
    setBrand("")
    setFlavor("")
    setVolume("")
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

          className="bg-blue-800 hover:bg-blue-900 text-white px-5 py-2 rounded-lg"

        >

          + Novo produto

        </button>




        <input

          type="text"

          placeholder="Pesquisar produto..."

          value={search}

          onChange={(e)=>setSearch(e.target.value)}

          className="w-96 border rounded-lg p-2"

        />


      </div>







      <div className="mt-6 flex gap-2 flex-wrap">


        {["Todos", ...categories].map((item)=>(


          <button

            key={item}

            onClick={()=>setSelectedCategory(item)}

            className={`px-4 py-2 rounded-lg text-sm font-semibold ${
              
              selectedCategory === item

              ?

              "bg-blue-800 text-white"

              :

              "bg-gray-100 text-gray-700"

            }`}

          >

            {item}

          </button>


        ))}


      </div>







      {showForm && (


        <div className="mt-6 bg-white rounded-xl shadow p-6">


          <h2 className="font-bold text-lg">

            {editingId !== null 
            
            ?

            "Editar produto"

            :

            "Novo produto"

            }

          </h2>





          <div className="mt-4 space-y-3">





            <input

              className="border p-2 rounded w-full"

              placeholder="Nome do produto"

              value={name}

              onChange={(e)=>setName(e.target.value)}

            />






            <select

              className="border p-2 rounded w-full"

              value={category}

              onChange={(e)=>{

                setCategory(e.target.value)

                setBrand("")

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

              className="border p-2 rounded w-full"

              value={brand}

              onChange={(e)=>setBrand(e.target.value)}

            >


              <option value="">
                Selecione a marca
              </option>



              {brands

              .filter(
                (item)=>item.category === category
              )

              .map((item)=>(


                <option

                  key={item.name}

                  value={item.name}

                >

                  {item.name}

                </option>


              ))}



            </select>







            <select

              className="border p-2 rounded w-full"

              value={flavor}

              onChange={(e)=>setFlavor(e.target.value)}

            >

              <option value="">
                Sem sabor
              </option>



              {flavors
.filter(
(item)=>item.category === category
)
.map((item)=>(

                <option
key={item.name}
value={item.name}
>
{item.name}
</option>


              ))}



            </select>






            <input

              className="border p-2 rounded w-full"

              placeholder="Volume (ex: 350ml)"

              value={volume}

              onChange={(e)=>setVolume(e.target.value)}

            />






            <select

              className="border p-2 rounded w-full"

              value={entryType}

              onChange={(e)=>setEntryType(e.target.value)}

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

              onChange={(e)=>setQuantity(e.target.value)}

            />






            {entryType === "Fardo" && (


              <input

                className="border p-2 rounded w-full"

                placeholder="Quantidade por fardo"

                type="number"

                value={itemsPerPackage}

                onChange={(e)=>setItemsPerPackage(e.target.value)}

              />


            )}







            <input

              className="border p-2 rounded w-full"

              placeholder="Preço de compra"

              type="number"

              value={purchasePrice}

              onChange={(e)=>setPurchasePrice(e.target.value)}

            />






            <input

              className="border p-2 rounded w-full"

              placeholder="Preço de venda"

              type="number"

              value={salePrice}

              onChange={(e)=>setSalePrice(e.target.value)}

            />





            <button

              onClick={handleSaveProduct}

              className="bg-blue-800 text-white px-5 py-2 rounded-lg"

            >

              {editingId !== null

              ?

              "Atualizar produto"

              :

              "Salvar produto"

              }

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

          .filter((product)=>

            product.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )

          )


          .filter((product)=>

            selectedCategory === "Todos"

            ?

            true

            :

            product.category === selectedCategory

          )


          .map((product)=>(



            <div

              key={product.id}

              className="border rounded-xl p-5 shadow-sm"

            >



              <div className="flex justify-between">


                <div>


                  <h3 className="font-bold text-lg">

                    {product.name}

                  </h3>



                  <p className="text-gray-500">

                    {product.category}

                  </p>



                  <p className="text-gray-500">

                    {product.brand}

                    {product.flavor &&
                    
                    ` • ${product.flavor}`

                    }


                    {product.volume &&
                    
                    ` • ${product.volume}`

                    }


                  </p>



                </div>





                <span className="font-bold">

                  {product.stock} un

                </span>



              </div>







              <div className="mt-4 flex gap-6">


                <div>

                  <p className="text-xs text-gray-500">
                    Compra
                  </p>


                  <p>

                    R$ {product.purchasePrice.toFixed(2)}

                  </p>


                </div>





                <div>

                  <p className="text-xs text-gray-500">
                    Venda
                  </p>


                  <p>

                    R$ {product.salePrice.toFixed(2)}

                  </p>


                </div>


              </div>







              <div className="mt-5 flex gap-3">



                <button

                  onClick={()=>{


                    setEditingId(product.id)

                    setName(product.name)

                    setCategory(product.category)

                    setBrand(product.brand)

                    setFlavor(product.flavor || "")

                    setVolume(product.volume)

                    setEntryType(product.entryType)

                    setQuantity(product.quantity)

                    setItemsPerPackage(
                      product.itemsPerPackage
                    )

                    setPurchasePrice(
                      product.purchasePrice.toString()
                    )

                    setSalePrice(
                      product.salePrice.toString()
                    )


                    setShowForm(true)


                  }}


                  className="bg-purple-800 text-white px-4 py-2 rounded-lg"

                >

                  Editar

                </button>






                <button


                  onClick={()=>{


                    setProductList(

                      productList.filter(

                        (item)=>

                        item.id !== product.id

                      )

                    )


                  }}



                  className="bg-red-700 text-white px-4 py-2 rounded-lg"

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