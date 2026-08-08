import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Dashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      const { data: productsData, error: productsError } =
        await supabase
          .from("products")
          .select("*")

      const { data: salesData, error: salesError } =
        await supabase
          .from("sales")
          .select("*")
          .order("date", { ascending: false })

      if (productsError) {
        console.error(
          "ERRO AO CARREGAR PRODUTOS:",
          productsError
        )
        return
      }

      if (salesError) {
        console.error(
          "ERRO AO CARREGAR VENDAS:",
          salesError
        )
        return
      }

      setProducts(productsData || [])
      setSales(salesData || [])
    }

    loadData()
  }, [])

  const totalProducts = products.length

  const lowStockProducts = products.filter(
    (product) =>
      Number(product.stock || 0) <= 5
  )

  const lowStock = lowStockProducts.length

  const stockPurchaseValue = products.reduce(
    (total, product) =>
      total +
      Number(product.stock || 0) *
        Number(product.purchase_price || 0),
    0
  )

  const totalSales = sales.reduce(
    (total, sale) =>
      total + Number(sale.total || 0),
    0
  )

  const totalProfit = sales.reduce(
    (total, sale) =>
      total + Number(sale.profit || 0),
    0
  )

  const totalQuantitySold = sales.reduce(
    (total, sale) =>
      total + Number(sale.quantity || 0),
    0
  )

  const pendingFiado = sales
    .filter(
      (sale) =>
        sale.payment === "Fiado" &&
        sale.status === "Pendente"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.total || 0),
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            💰 Valor em estoque
          </h2>

          <p className="text-2xl font-bold mt-2">
            R$ {stockPurchaseValue.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            📦 Produtos
          </h2>

          <p className="text-2xl font-bold mt-2">
            {totalProducts}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            💵 Faturamento
          </h2>

          <p className="text-2xl font-bold mt-2">
            R$ {totalSales.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            📈 Lucro
          </h2>

          <p className="text-2xl font-bold mt-2">
            R$ {totalProfit.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            🛒 Itens vendidos
          </h2>

          <p className="text-2xl font-bold mt-2">
            {totalQuantitySold}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            ⚠ Estoque baixo
          </h2>

          <p className="text-2xl font-bold mt-2 text-red-600">
            {lowStock}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            📝 Fiado pendente
          </h2>

          <p className="text-2xl font-bold mt-2 text-red-600">
            R$ {pendingFiado.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          ⚠ Produtos com estoque baixo
        </h2>

        <div className="mt-4 space-y-3">
          {lowStockProducts.length === 0 ? (
            <p className="text-gray-500">
              Nenhum produto com estoque baixo.
            </p>
          ) : (
            lowStockProducts.map((product) => (
              <div
                key={product.id}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <p className="font-bold">
                    {product.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {product.brand || ""}
                    {product.flavor
                      ? ` • ${product.flavor}`
                      : ""}
                    {product.volume
                      ? ` • ${product.volume}`
                      : ""}
                  </p>
                </div>

                <span className="font-bold text-red-600">
                  {Number(product.stock || 0)} un
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          🛒 Últimas vendas
        </h2>

        <div className="mt-4 space-y-3">
          {sales.slice(0, 5).length === 0 ? (
            <p className="text-gray-500">
              Nenhuma venda registrada.
            </p>
          ) : (
            sales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex justify-between items-center border-b pb-3"
              >
                <div>
                  <p className="font-bold">
                    {sale.product || "Venda"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {sale.payment || "-"}
                  </p>

                  <p className="text-sm text-gray-500">
                    {sale.date
                      ? new Date(
                          sale.date
                        ).toLocaleString("pt-BR")
                      : "-"}
                  </p>
                </div>

                <p className="font-bold">
                  R${" "}
                  {Number(
                    sale.total || 0
                  ).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard