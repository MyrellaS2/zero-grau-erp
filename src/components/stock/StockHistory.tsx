import type {
  StockMovement,
  Product
} from "../../types/product"

interface StockHistoryProps {
  movements: StockMovement[]
  products: Product[]
}

function StockHistory({
  movements,
  products
}: StockHistoryProps) {

  function formatDate(dateValue: string) {
    if (!dateValue) {
      return "-"
    }

    const date = new Date(dateValue)

    if (isNaN(date.getTime())) {
      return "-"
    }

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "medium"
      }
    ).format(date)
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">

      <h2 className="text-xl font-bold mb-4">
        Histórico de estoque
      </h2>

      {movements.length === 0 ? (

        <p className="text-gray-500">
          Nenhuma movimentação registrada.
        </p>

      ) : (

        <div className="space-y-4">

          {movements
            .slice()
            .reverse()
            .map((item) => {

              const product = products.find(
                (product) =>
                  product.id === item.productId
              )

              const purchasePrice =
                Number(
                  product?.purchasePrice || 0
                )

              const salePrice =
                Number(
                  product?.salePrice || 0
                )

              const profit =
                salePrice -
                purchasePrice

              const profitPercentage =
                purchasePrice > 0
                  ? (profit / purchasePrice) * 100
                  : 0

              return (

                <div
                  key={item.id}
                  className="border rounded-lg p-4"
                >

                  <div className="flex justify-between">

                    <div>

                      <h3 className="font-bold">
                        {item.productName}
                      </h3>

                      <p className="text-sm text-gray-500">
                        {formatDate(item.date)}
                      </p>

                    </div>

                    <span
                      className={
                        item.type === "Entrada"
                          ? "text-green-700 font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      {item.type === "Entrada"
                        ? "+"
                        : "-"}
                      {item.quantity}
                    </span>

                  </div>

                  <p className="mt-2 text-sm">
                    Estoque:{" "}
                    {item.previousStock}
                    {" → "}
                    {item.currentStock}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">

                    <div className="bg-gray-50 rounded-lg p-3">

                      <p className="text-xs text-gray-500">
                        Preço de compra
                      </p>

                      <p className="font-semibold">
                        R$ {purchasePrice.toFixed(2)}
                      </p>

                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">

                      <p className="text-xs text-gray-500">
                        Preço de venda
                      </p>

                      <p className="font-semibold text-green-700">
                        R$ {salePrice.toFixed(2)}
                      </p>

                    </div>

                    <div className="bg-green-50 rounded-lg p-3">

                      <p className="text-xs text-gray-500">
                        Lucro por unidade
                      </p>

                      <p className="font-bold text-green-700">
                        R$ {profit.toFixed(2)}
                      </p>

                      <p className="text-xs text-green-600 mt-1">
                        {profitPercentage.toFixed(1)}% de lucro
                      </p>

                    </div>

                  </div>

                  {item.observation && (
                    <p className="text-sm text-gray-500 mt-3">
                      {item.observation}
                    </p>
                  )}

                </div>

              )
            })}

        </div>

      )}

    </div>
  )
}

export default StockHistory