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
    console.error(
      "ERRO AO CARREGAR RELATÓRIOS:",
      error
    )
    return
  }

  setSales(data || [])
}

loadSales()


}, [])

/*

* ============================================================
* FATURAMENTO REAL
* ============================================================
*
* Venda normal paga:
* utiliza o total da venda.
*
* Fiado pendente:
* não entra no faturamento.
*
* Fiado pago:
* utiliza received_total, pois esse é o valor realmente recebido.
  */

const vendasRealizadas = sales.filter(
(sale) =>
sale.status === "Pago"
)

const faturamento = vendasRealizadas.reduce(
(total, sale) => {
const valorRecebido =
sale.payment !== "Fiado"
? Number(sale.total || 0)
: Number(
sale.received_total ??
sale.total ??
0
)

  return total + valorRecebido
},
0


)

/*

* ============================================================
* LUCRO
* ============================================================
*
* Para vendas normais:
* utiliza o profit salvo na venda.
*
* Para fiado pago:
* recalcula o lucro considerando o desconto.
  */

const lucro = vendasRealizadas.reduce(
(total, sale) => {
/*
* Venda normal
*/
if (sale.payment !== "Fiado") {
return (
total +
Number(sale.profit || 0)
)
}


  /*
   * Fiado pago
   *
   * Calculamos o custo dos produtos.
   */
  if (
    !Array.isArray(sale.products)
  ) {
    return (
      total +
      Number(sale.profit || 0)
    )
  }

  const custoTotal =
    sale.products.reduce(
      (
        custo: number,
        item: any
      ) => {
        const quantity =
          Number(
            item.quantity || 0
          )

        const purchasePrice =
          Number(
            item.purchasePrice || 0
          )

        return (
          custo +
          purchasePrice *
            quantity
        )
      },
      0
    )

  /*
   * Valor realmente recebido
   * já considerando desconto.
   */
  const receivedTotal =
    Number(
      sale.received_total ??
        sale.total ??
        0
    )

  /*
   * Lucro real = valor recebido - custo.
   */
  const lucroReal =
    receivedTotal -
    custoTotal

  return total + lucroReal
},
0


)

/*

* ============================================================
* QUANTIDADE VENDIDA
* ============================================================
*
* Continua considerando os produtos vendidos.
* Uma venda de fiado também conta aqui porque o produto
* realmente foi vendido.
  */

const quantidadeVendida =
sales.reduce(
(total, sale) =>
total +
Number(
sale.quantity || 0
),
0
)

/*

* ============================================================
* FORMAS DE PAGAMENTO
* ============================================================
*
* Fiado pendente não entra.
*
* Quando o fiado é recebido, ele passa a entrar na forma
* de pagamento escolhida no recebimento.
  */

const pagamentos = {
Pix: 0,
Dinheiro: 0,
Debito: 0,
Credito: 0,
}

vendasRealizadas.forEach(
(sale) => {
const valorRecebido =
sale.payment !== "Fiado"
? Number(
sale.total || 0
)
: Number(
sale.received_total ??
sale.total ??
0
)


  if (
    sale.payment === "Pix"
  ) {
    pagamentos.Pix +=
      valorRecebido
  }

  if (
    sale.payment ===
    "Dinheiro"
  ) {
    pagamentos.Dinheiro +=
      valorRecebido
  }

  if (
    sale.payment ===
    "Débito"
  ) {
    pagamentos.Debito +=
      valorRecebido
  }

  if (
    sale.payment ===
    "Crédito"
  ) {
    pagamentos.Credito +=
      valorRecebido
  }
}


)

/*

* ============================================================
* FIADO PENDENTE
* ============================================================
  */

const fiadoPendente =
sales
.filter(
(sale) =>
sale.payment ===
"Fiado" &&
sale.status ===
"Pendente"
)
.reduce(
(total, sale) =>
total +
Number(
sale.total || 0
),
0
)

/*

* ============================================================
* PRODUTOS MAIS VENDIDOS
* ============================================================
  */

const produtos: Record<
string,
number

> = {}

sales.forEach((sale) => {
if (
!Array.isArray(
sale.products
)
) {
return
}


sale.products.forEach(
  (item: any) => {
    const nome =
      item.displayName ||
      item.name ||
      "Produto"

    const quantidade =
      Number(
        item.quantity || 0
      )

    if (produtos[nome]) {
      produtos[nome] +=
        quantidade
    } else {
      produtos[nome] =
        quantidade
    }
  }
)


})

const rankingProdutos =
Object.keys(produtos)
.sort(
(a, b) =>
produtos[b] -
produtos[a]
)
.slice(0, 5)

const maisVendido =
rankingProdutos.length > 0
? rankingProdutos[0]
: "Nenhum produto vendido"

/*

* ============================================================
* FATURAMENTO POR DIA
* ============================================================
*
* Apenas valores efetivamente recebidos.
  */

const vendasPorDia: Record<
string,
number

> = {}

vendasRealizadas.forEach(
(sale) => {
if (!sale.date) {
return
}


  const data = new Date(
    sale.date
  )

  if (
    Number.isNaN(
      data.getTime()
    )
  ) {
    return
  }

  const dataFormatada =
    data.toLocaleDateString(
      "pt-BR"
    )

  const valorRecebido =
    sale.payment !== "Fiado"
      ? Number(
          sale.total || 0
        )
      : Number(
          sale.received_total ??
            sale.total ??
            0
        )

  if (
    vendasPorDia[
      dataFormatada
    ]
  ) {
    vendasPorDia[
      dataFormatada
    ] += valorRecebido
  } else {
    vendasPorDia[
      dataFormatada
    ] = valorRecebido
  }
}


)

const grafico =
Object.keys(
vendasPorDia
).map((data) => ({
data,
faturamento:
vendasPorDia[data],
}))

return ( <div> <h1 className="text-3xl font-bold">
Relatórios </h1>


  <p className="mt-2 text-gray-500">
    Análise das vendas da ZERO GRAU
  </p>

  {/* RESUMO */}

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

  {/* FORMAS DE PAGAMENTO */}

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

    {/* PRODUTOS MAIS VENDIDOS */}

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
            (
              produto,
              index
            ) => (
              <div
                key={produto}
                className="flex justify-between border-b pb-2"
              >
                <span>
                  {index + 1}.{" "}
                  {produto}
                </span>

                <strong>
                  {produtos[
                    produto
                  ]}{" "}
                  un
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

  {/* GRÁFICO */}

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
                `R$ ${Number(
                  value
                ).toFixed(2)}`
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
