import { useEffect, useState } from "react"

function Dashboard() {

  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])


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



  const totalProducts = products.length


  const lowStock = products.filter(
    (product) => product.stock <= 5
  ).length



  const stockPurchaseValue = products.reduce(
    (total, product) =>
      total + product.stock * product.purchasePrice,
    0
  )



  const totalSales = sales.reduce(
    (total, sale) => total + sale.total,
    0
  )



  const totalProfit = sales.reduce(
    (total, sale) => total + sale.profit,
    0
  )



  return (
    <div>

      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>


      <p className="mt-2 text-gray-500">
        Sistema de gestão da ZERO GRAU
      </p>



      <div className="grid grid-cols-2 gap-6 mt-8">



        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-gray-500">
            💰 Valor investido
          </h2>

          <p className="text-3xl font-bold mt-2">
            R$ {stockPurchaseValue.toFixed(2)}
          </p>

        </div>





        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-gray-500">
            📦 Produtos
          </h2>

          <p className="text-3xl font-bold mt-2">
            {totalProducts}
          </p>

        </div>





        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-gray-500">
            💵 Faturamento
          </h2>

          <p className="text-3xl font-bold mt-2">
            R$ {totalSales.toFixed(2)}
          </p>

        </div>





        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-gray-500">
            📈 Lucro
          </h2>

          <p className="text-3xl font-bold mt-2">
            R$ {totalProfit.toFixed(2)}
          </p>

        </div>





        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="text-gray-500">
            ⚠ Estoque baixo
          </h2>

          <p className="text-3xl font-bold mt-2">
            {lowStock}
          </p>

        </div>



      </div>





      <div className="mt-8 bg-white p-6 rounded-xl shadow">


        <h2 className="font-bold text-lg">
          ⚠ Produtos com estoque baixo
        </h2>



        <div className="mt-4 space-y-2">


          {products
            .filter((product) => product.stock <= 5)
            .map((product) => (

              <div
                key={product.id}
                className="flex justify-between border-b pb-2"
              >

                <span>
                  {product.name}
                </span>


                <span className="font-bold text-red-600">
                  {product.stock} un
                </span>


              </div>

            ))

          }


        </div>


      </div>



    </div>
  )
}


export default Dashboard