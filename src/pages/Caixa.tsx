import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Caixa() {
  const [sales, setSales] = useState<any[]>([])

  useEffect(() => {
    const loadSales = async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("date", { ascending: false })

      if (error) {
        console.error("ERRO AO CARREGAR VENDAS:", error)
        return
      }

      setSales(data || [])
    }

    loadSales()
  }, [])

  const totalVendido = sales.reduce(
    (total, sale) =>
      total + Number(sale.total || 0),
    0
  )

  const lucroTotal = sales.reduce(
    (total, sale) =>
      total + Number(sale.profit || 0),
    0
  )

  const quantidadeVendas = sales.length

  const dinheiro = sales
    .filter(
      (sale) =>
        sale.payment === "Dinheiro" &&
        sale.status !== "Pendente"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.total || 0),
      0
    )

  const pix = sales
    .filter(
      (sale) =>
        sale.payment === "Pix" &&
        sale.status !== "Pendente"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.total || 0),
      0
    )

  const debito = sales
    .filter(
      (sale) =>
        sale.payment === "Débito" &&
        sale.status !== "Pendente"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.total || 0),
      0
    )

  const credito = sales
    .filter(
      (sale) =>
        sale.payment === "Crédito" &&
        sale.status !== "Pendente"
    )
    .reduce(
      (total, sale) =>
        total + Number(sale.total || 0),
      0
    )

  const fiado = sales
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

  const recebido =
    dinheiro +
    pix +
    debito +
    credito

  return (
    <div>
      <h1 className="text-3xl font-bold">
        Caixa
      </h1>

      <p className="mt-2 text-gray-500">
        Controle financeiro da ZERO GRAU
      </p>

      <div className="grid grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            💰 Vendido
          </p>

          <h2 className="text-2xl font-bold">
            R$ {totalVendido.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            💵 Recebido
          </p>

          <h2 className="text-2xl font-bold text-green-600">
            R$ {recebido.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            📈 Lucro
          </p>

          <h2 className="text-2xl font-bold">
            R$ {lucroTotal.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            🛒 Vendas
          </p>

          <h2 className="text-2xl font-bold">
            {quantidadeVendas}
          </h2>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          Formas de pagamento
        </h2>

        <div className="mt-4 space-y-3">
          <p>
            💵 Dinheiro:
            <b> R$ {dinheiro.toFixed(2)}</b>
          </p>

          <p>
            📱 Pix:
            <b> R$ {pix.toFixed(2)}</b>
          </p>

          <p>
            💳 Débito:
            <b> R$ {debito.toFixed(2)}</b>
          </p>

          <p>
            💳 Crédito:
            <b> R$ {credito.toFixed(2)}</b>
          </p>

          <p>
            📝 Fiado pendente:
            <b className="text-red-600">
              {" "}R$ {fiado.toFixed(2)}
            </b>
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          Últimas vendas
        </h2>

        <div className="mt-4 space-y-3">
          {sales.slice(0, 5).map((sale) => (
            <div
              key={sale.id}
              className="border rounded-lg p-4 flex justify-between"
            >
              <div>
                <p className="font-bold">
                  {sale.product}
                </p>

                <p className="text-gray-500">
                  {sale.payment}
                </p>

                <p className="text-gray-500">
                  {sale.date
                    ? new Date(
                        sale.date
                      ).toLocaleString("pt-BR")
                    : "-"}
                </p>
              </div>

              <p className="font-bold">
                R$ {Number(sale.total || 0).toFixed(2)}
              </p>
            </div>
          ))}

          {sales.length === 0 && (
            <p className="text-gray-500">
              Nenhuma venda registrada.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Caixa