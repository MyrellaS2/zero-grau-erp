import { useEffect, useState } from "react"

function Vendas() {

  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])

  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [cart, setCart] = useState<any[]>([])

  const [customer, setCustomer] = useState("")
  const [payment, setPayment] = useState("")

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")


  useEffect(() => {

    const savedProducts = localStorage.getItem("products")
    const savedSales = localStorage.getItem("sales")

    if (savedProducts) {
      setProducts(JSON.parse(savedProducts))
    }

    if (savedSales) {
      setSales(JSON.parse(savedSales))
    }

  }, [])



  function addToCart() {

    const product = products.find(
      (item) => item.id === Number(productId)
    )

    if (!product) return


    const qtd = Number(quantity)


    if (qtd <= 0) {
      alert("Quantidade inválida")
      return
    }


    const alreadyInCart = cart.find(
      (item) => item.id === product.id
    )


    const totalQuantity = alreadyInCart
      ? alreadyInCart.quantity + qtd
      : qtd


    if (totalQuantity > product.stock) {
      alert("Estoque insuficiente!")
      return
    }


    if (alreadyInCart) {

      setCart(
        cart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + qtd,
                total:
                  (item.quantity + qtd) * item.salePrice
              }
            : item
        )
      )

    } else {

      setCart([
  ...cart,
  {
    id: product.id,

    name: product.name,

    displayName:
      product.name +
      (product.brand
        ? ` • ${product.brand}`
        : "") +
      (product.flavor
        ? ` • ${product.flavor}`
        : "") +
      (product.volume
        ? ` • ${product.volume}`
        : ""),

    quantity: qtd,

    salePrice: product.salePrice,

    purchasePrice: product.purchasePrice,

    total: product.salePrice * qtd
  }
])

    }


    setProductId("")
    setQuantity("")

  }



  function removeFromCart(id:number){

    setCart(
      cart.filter(
        (item)=> item.id !== id
      )
    )

  }



  const cartTotal = cart.reduce(
    (total,item)=> total + item.total,
    0
  )



  const cartProfit = cart.reduce(
    (total,item)=>
      total +
      ((item.salePrice - item.purchasePrice) * item.quantity),
    0
  )
  
function deleteSale(id:number){

  const sale = sales.find(
    (item)=> item.id === id
  )

  if(!sale) return


  const confirmDelete = window.confirm(
    "Excluir essa venda e devolver o estoque?"
  )

  if(!confirmDelete) return



  const updatedSales = sales.filter(
    (item)=> item.id !== id
  )



  const updatedProducts = products.map(
    (product)=>{

      const soldProduct = sale.products?.find(
        (item:any)=> item.id === product.id
      )


      if(soldProduct){

        return {
          ...product,
          stock:
            product.stock + soldProduct.quantity
        }

      }


      return product

    }
  )



  setSales(updatedSales)

  setProducts(updatedProducts)



  localStorage.setItem(
    "sales",
    JSON.stringify(updatedSales)
  )


  localStorage.setItem(
    "products",
    JSON.stringify(updatedProducts)
  )


}


  function finalizeSale() {

    if (cart.length === 0) {
      alert("Carrinho vazio!")
      return
    }


    if (!payment) {
      alert("Selecione a forma de pagamento!")
      return
    }


    if (payment === "Fiado" && !customer.trim()) {
      alert("Informe o nome do cliente!")
      return
    }



    const newSale = {

      id: Date.now(),

      products: cart,

      product: cart
  .map((item)=>item.displayName || item.name)
  .join(", "),
      quantity: cart.reduce(
        (total,item)=> total + item.quantity,
        0
      ),

      total: cartTotal,

      profit: cartProfit,

      customer,

      payment,

      status:
        payment === "Fiado"
          ? "Pendente"
          : "Pago",

      date:
        new Date().toLocaleString()

    }



    const updatedSales = [
      ...sales,
      newSale
    ]


    setSales(updatedSales)


    localStorage.setItem(
      "sales",
      JSON.stringify(updatedSales)
    )



    const updatedProducts = products.map(
      (product)=>{

        const item = cart.find(
          (cartItem)=>cartItem.id === product.id
        )


        if(item){

          return {
            ...product,
            stock:
              product.stock - item.quantity
          }

        }


        return product

      }
    )



    setProducts(updatedProducts)


    localStorage.setItem(
      "products",
      JSON.stringify(updatedProducts)
    )



    setCart([])
    setCustomer("")
    setPayment("")



    alert("Venda registrada!")

  }



  const filteredSales = sales.filter(
    (sale)=>{

      if(!startDate && !endDate){
        return true
      }


      const saleDate =
        new Date(sale.date)


      const start =
        startDate
          ? new Date(startDate)
          : null


      const end =
        endDate
          ? new Date(endDate)
          : null



      if(start && saleDate < start){
        return false
      }


      if(end && saleDate > end){
        return false
      }


      return true

    }
  )



  const periodTotal =
    filteredSales.reduce(
      (total,sale)=>
        total + sale.total,
      0
    )


  const periodProfit =
    filteredSales.reduce(
      (total,sale)=>
        total + sale.profit,
      0
    )


  const periodQuantity =
    filteredSales.reduce(
      (total,sale)=>
        total + sale.quantity,
      0
    )



  return (
    <div>

      <h1 className="text-3xl font-bold">
        Vendas
      </h1>

      <p className="mt-2 text-gray-500">
        Controle de vendas da ZERO GRAU
      </p>



      <div className="grid grid-cols-2 gap-6 mt-8">


        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-bold text-lg">
            🛒 Nova venda
          </h2>


          <select
            className="border p-2 rounded w-full mt-4"
            value={productId}
            onChange={(e)=>setProductId(e.target.value)}
          >

            <option value="">
              Selecione o produto
            </option>


            {products.map((product)=>(

              <option
                key={product.id}
                value={product.id}
              >
                {product.name}
{product.brand && ` • ${product.brand}`}
{product.flavor && ` • ${product.flavor}`}
{product.volume && ` • ${product.volume}`}
              </option>

            ))}


          </select>


          <input

            className="border p-2 rounded w-full mt-3"

            type="number"

            placeholder="Quantidade"

            value={quantity}

            onChange={(e)=>
              setQuantity(e.target.value)
            }

          />


          <button

            onClick={addToCart}

            className="mt-4 bg-green-700 text-white px-5 py-2 rounded-lg"

          >

            Adicionar ao carrinho

          </button>


        </div>
                <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-bold text-lg">
            🛒 Carrinho
          </h2>


          {cart.length === 0 ? (

            <p className="text-gray-500 mt-4">
              Nenhum produto adicionado.
            </p>

          ) : (

            <div className="mt-4 space-y-3">


              {cart.map((item)=>(

                <div
                  key={item.id}
                  className="border rounded-lg p-3 flex justify-between items-center"
                >

                  <div>

                    <p className="font-bold">
                      {item.name}
                    </p>


                    <p className="text-gray-500">
                      {item.quantity} unidade(s)
                    </p>

                  </div>



                  <div className="text-right">

                    <p>
                      R$ {item.total.toFixed(2)}
                    </p>


                    <button

                      onClick={()=>
                        removeFromCart(item.id)
                      }

                      className="text-red-600 text-sm mt-1"

                    >
                      Remover
                    </button>


                  </div>


                </div>


              ))}


            </div>

          )}



          <div className="border-t mt-5 pt-4">


            <p className="font-bold text-lg">
              Total: R$ {cartTotal.toFixed(2)}
            </p>


            <p className="text-green-600">
              Lucro: R$ {cartProfit.toFixed(2)}
            </p>


          </div>



          <input

            className="border p-2 rounded w-full mt-4"

            type="text"

            placeholder="Nome do cliente"

            value={customer}

            onChange={(e)=>
              setCustomer(e.target.value)
            }

          />



          <select

            className="border p-2 rounded w-full mt-3"

            value={payment}

            onChange={(e)=>
              setPayment(e.target.value)
            }

          >

            <option value="">
              Forma de pagamento
            </option>


            <option value="Pix">
              Pix
            </option>


            <option value="Dinheiro">
              Dinheiro
            </option>


            <option value="Débito">
              Cartão de débito
            </option>


            <option value="Crédito">
              Cartão de crédito
            </option>


            <option value="Fiado">
              Fiado
            </option>


          </select>



          <button

            onClick={finalizeSale}

            className="mt-5 w-full bg-blue-800 text-white py-3 rounded-lg font-bold"

          >

            Finalizar venda

          </button>


        </div>


      </div>
            <div className="mt-8 bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold text-lg">
          🔎 Pesquisar vendas
        </h2>


        <div className="flex gap-4 mt-4">


          <input

            type="date"

            className="border p-2 rounded"

            value={startDate}

            onChange={(e)=>
              setStartDate(e.target.value)
            }

          />


          <input

            type="date"

            className="border p-2 rounded"

            value={endDate}

            onChange={(e)=>
              setEndDate(e.target.value)
            }

          />


        </div>


      </div>



      <div className="grid grid-cols-3 gap-6 mt-6">


        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-gray-500">
            💰 Faturamento
          </h2>


          <p className="text-2xl font-bold mt-2">
            R$ {periodTotal.toFixed(2)}
          </p>


        </div>



        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-gray-500">
            📈 Lucro
          </h2>


          <p className="text-2xl font-bold mt-2">
            R$ {periodProfit.toFixed(2)}
          </p>


        </div>



        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-gray-500">
            🛒 Quantidade vendida
          </h2>


          <p className="text-2xl font-bold mt-2">
            {periodQuantity} un
          </p>


        </div>


      </div>




      <div className="mt-8 bg-white p-6 rounded-xl shadow">


        <h2 className="font-bold text-lg">
          Histórico de vendas
        </h2>



        <div className="mt-4 space-y-3">


          {[...filteredSales].reverse().map((sale)=>(


            <div

              key={sale.id}

              className="border rounded-lg p-4 flex justify-between"

            >


              <div>


                <p className="font-bold">
                  {sale.product}
                </p>


                <p className="text-gray-500">
                  Quantidade: {sale.quantity}
                </p>


                <p className="text-gray-500">
                  📅 {sale.date}
                </p>


                <p className="text-gray-500">
                  👤 {sale.customer || "Cliente não informado"}
                </p>


                <p className="text-gray-500">
                  💳 {sale.payment}
                </p>


              </div>




              <div className="text-right">


  <p className="font-bold">
    R$ {sale.total.toFixed(2)}
  </p>


  <p className="text-green-600">
    Lucro: R$ {sale.profit.toFixed(2)}
  </p>


  <button
    onClick={() => deleteSale(sale.id)}
    className="mt-2 bg-red-600 text-white px-3 py-1 rounded"
  >
    🗑 Excluir
  </button>


</div>


            </div>


          ))}


        </div>


      </div>


    </div>
  )

}


export default Vendas