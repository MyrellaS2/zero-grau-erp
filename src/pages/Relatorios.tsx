import { useEffect, useState } from "react"
import {
LineChart,
Line,
XAxis,
YAxis,
CartesianGrid,
Tooltip,
ResponsiveContainer,
} from "recharts"
import { supabase } from "../lib/supabase"

function Relatorios() {
const [sales, setSales] = useState<any[]>([])

useEffect(() => {
async function loadSales() {
const { data, error } = await supabase
.from("sales")
.select("*")
.order("date", { ascending: true })


  if (error) {
    console.error("ERRO AO CARREGAR RELATÓRIOS:", error)
    return
  }

  setSales(data || [])
}

loadSales()


}, [])

const faturamento = sales.reduce(
(total, sale) => total + Number(sale.total || 0),
0
)

const lucro = sales.reduce(
(total, sale) => total + Number(sale.profit || 0),
0
)

const quantidadeVendida = sales.reduce(
(total, sale) => total + Number(sale.quantity || 0),
0
)

const pagamentos = {
Pix: sales
.filter((sale) => sale.payment === "Pix")
.reduce(
(total, sale) => total + Number(sale.total || 0),
0
),


Dinheiro: sales
  .filter((sale) => sale.payment === "Dinheiro")
  .reduce(
    (total, sale) => total + Number(sale.total || 0),
    0
  ),

Debito: sales
  .filter((sale) => sale.payment === "Débito")
  .reduce(
    (total, sale) => total + Number(sale.total || 0),
    0
  ),

Credito: sales
  .filter((sale) => sale.payment === "Crédito")
  .reduce(
    (total, sale) => total + Number(sale.total || 0),
    0
  ),


}

const fiadoPendente = sales
.filter(
(sale) =>
sale.payment === "Fiado" &&
sale.status === "Pendente"
)
.reduce(
(total, sale) => total + Number(sale.total || 0),
0
)

const produtos: Record<string, number> = {}

sales.forEach((sale) => {
if (!Array.isArray(sale.products)) {
return
}


sale.products.forEach((item: any) => {
  const nome = item.displayName || item.name || "Produto"

  if (produtos[nome]) {
    produtos[nome] += Number(item.quantity || 0)
  } else {
    produtos[nome] = Number(item.quantity || 0)
  }
})


})

const rankingProdutos = Object.keys(produtos)
.sort((a, b) => produtos[b] - produtos[a])
.slice(0, 5)

const maisVendido =
rankingProdutos.length > 0
? rankingProdutos[0]
: "Nenhum produto vendido"

const vendasPorDia: Record<string, number> = {}

sales.forEach((sale) => {
if (!sale.date) {
return
}


const data = new Date(sale.date)

if (Number.isNaN(data.getTime())) {
  return
}

const dataFormatada = data.toLocaleDateString("pt-BR")

if (vendasPorDia[dataFormatada]) {
  vendasPorDia[dataFormatada] += Number(
    sale.total || 0
  )
} else {
  vendasPorDia[dataFormatada] = Number(
    sale.total || 0
  )
}


})

const grafico = Object.keys(vendasPorDia).map(
(data) => ({
data,
faturamento: vendasPorDia[data],
})
)

return ( <div> <h1 className="text-3xl font-bold">
Relatórios </h1>


  <p className="mt-2 text-gray-500">
    Análise das vendas da ZERO GRAU
  </p>

  <div className="grid grid-cols-3 gap-6 mt-8">
    <div className="bg-white p-6 rounded-xl shadow">
      <p className="text-gray-500">
        💰 Faturamento
      </p>

      <h2 className="text-2xl font-bold mt-2">
        R$ {faturamento.toFixed(2)}
      </h2>
    </div>

    <div className="bg-white p-6 rounded-xl shadow">
      <p className="text-gray-500">
        📈 Lucro
      </p>

      <h2 className="text-2xl font-bold text-green-600 mt-2">
        R$ {lucro.toFixed(2)}
      </h2>
    </div>

    <div className="bg-white p-6 rounded-xl shadow">
      <p className="text-gray-500">
        🛒 Quantidade vendida
      </p>

      <h2 className="text-2xl font-bold mt-2">
        {quantidadeVendida} un
      </h2>
    </div>
  </div>

  <div className="grid grid-cols-2 gap-6 mt-8">
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="font-bold text-lg">
        💳 Formas de pagamento
      </h2>

      <div className="mt-4 space-y-3">
        <p>
          📱 Pix:
          <strong>
            {" "}
            R$ {pagamentos.Pix.toFixed(2)}
          </strong>
        </p>

        <p>
          💵 Dinheiro:
          <strong>
            {" "}
            R$ {pagamentos.Dinheiro.toFixed(2)}
          </strong>
        </p>

        <p>
          💳 Débito:
          <strong>
            {" "}
            R$ {pagamentos.Debito.toFixed(2)}
          </strong>
        </p>

        <p>
          💳 Crédito:
          <strong>
            {" "}
            R$ {pagamentos.Credito.toFixed(2)}
          </strong>
        </p>

        <p>
          📝 Fiado pendente:
          <strong className="text-red-600">
            {" "}
            R$ {fiadoPendente.toFixed(2)}
          </strong>
        </p>
      </div>
    </div>

    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="font-bold text-lg">
        🏆 Produtos mais vendidos
      </h2>

      <div className="mt-4 space-y-3">
        {rankingProdutos.length === 0 ? (
          <p className="text-gray-500">
            Nenhuma venda registrada.
          </p>
        ) : (
          rankingProdutos.map(
            (produto, index) => (
              <div
                key={produto}
                className="flex justify-between border-b pb-2"
              >
                <span>
                  {index + 1}. {produto}
                </span>

                <strong>
                  {produtos[produto]} un
                </strong>
              </div>
            )
          )
        )}
      </div>

      <p className="mt-5 font-bold">
        Mais vendido:
        <span className="text-blue-800">
          {" "}
          {maisVendido}
        </span>
      </p>
    </div>
  </div>

  <div className="mt-8 bg-white p-6 rounded-xl shadow">
    <h2 className="font-bold text-lg">
      📊 Faturamento por dia
    </h2>

    {grafico.length === 0 ? (
      <p className="text-gray-500 mt-4">
        Ainda não existem vendas para exibir.
      </p>
    ) : (
      <div className="w-full h-80 mt-6">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          <LineChart data={grafico}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="data" />

            <YAxis />

            <Tooltip
              formatter={(value: any) =>
                `R$ ${Number(value).toFixed(2)}`
              }
            />

            <Line
              type="monotone"
              dataKey="faturamento"
              stroke="#1d4ed8"
              strokeWidth={3}
              dot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
</div>


)
}

export default Relatorios
