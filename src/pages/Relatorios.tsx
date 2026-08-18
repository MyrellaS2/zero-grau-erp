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
  const [outflows, setOutflows] = useState<any[]>([])

  const [loading, setLoading] = useState(true)

  const [periodo, setPeriodo] =
    useState("30")

  const [dataInicial, setDataInicial] =
    useState("")

  const [dataFinal, setDataFinal] =
    useState("")

  const [showPersonalizado, setShowPersonalizado] =
    useState(false)

  /*
  ============================================================
  CARREGA DADOS
  ============================================================
  */

  useEffect(() => {
    loadData()

    const handleFocus = () => {
      loadData()
    }

    window.addEventListener(
      "focus",
      handleFocus
    )

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      )
    }
  }, [])

  async function loadData() {
    setLoading(true)

    const {
      data: salesData,
      error: salesError,
    } = await supabase
      .from("sales")
      .select("*")
      .order("date", {
        ascending: true,
      })

    if (salesError) {
      console.error(
        "ERRO AO CARREGAR VENDAS:",
        salesError
      )
    }

    const {
      data: outflowsData,
      error: outflowsError,
    } = await supabase
      .from("cash_outflows")
      .select("*")
      .order("created_at", {
        ascending: true,
      })

    if (outflowsError) {
      console.error(
        "ERRO AO CARREGAR SAÍDAS:",
        outflowsError
      )
    }

    setSales(
      salesData || []
    )

    setOutflows(
      outflowsData || []
    )

    setLoading(false)
  }

  /*
  ============================================================
  FUNÇÕES AUXILIARES
  ============================================================
  */

  function getCustoProdutos(
    sale: any
  ) {
    if (
      !Array.isArray(
        sale.products
      )
    ) {
      return 0
    }

    return sale.products.reduce(
      (
        total: number,
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
          total +
          quantity *
            purchasePrice
        )
      },
      0
    )
  }

  /*
  ------------------------------------------------------------
  TOTAL REALMENTE RECEBIDO
  ------------------------------------------------------------
  */

  function getValorRecebido(
    sale: any
  ) {
    /*
    Venda normal:
    sale.total já representa o total pago.
    */

    if (
      sale.payment !==
      "Fiado"
    ) {
      return Number(
        sale.total || 0
      )
    }

    /*
    Fiado pago:
    received_total = produtos
    recebidos depois do desconto.

    Frete é acrescentado uma única vez.
    */

    return (
      Number(
        sale.received_total || 0
      ) +
      Number(
        sale.delivery_fee || 0
      )
    )
  }

  /*
  ------------------------------------------------------------
  LUCRO
  ------------------------------------------------------------
  */

  function getLucro(
    sale: any
  ) {
    /*
    Venda normal:
    lucro já salvo.
    */

    if (
      sale.payment !==
      "Fiado"
    ) {
      return Number(
        sale.profit || 0
      )
    }

    /*
    Fiado pago:
    lucro = valor dos produtos
    recebidos - custo.

    O frete não entra como custo do produto.
    */

    const custo =
      getCustoProdutos(
        sale
      )

    const valorProdutos =
      Number(
        sale.received_total || 0
      )

    return (
      valorProdutos -
      custo
    )
  }

  /*
  ============================================================
  FILTRO DE DATAS
  ============================================================
  */

  function getPeriodo() {
    const agora =
      new Date()

    let inicio: Date
    let fim: Date

    /*
    HOJE
    */

    if (
      periodo === "hoje"
    ) {
      inicio = new Date(
        agora
      )

      inicio.setHours(
        0,
        0,
        0,
        0
      )

      fim = new Date(
        agora
      )

      fim.setHours(
        23,
        59,
        59,
        999
      )
    }

    /*
    7 DIAS
    */

    else if (
      periodo === "7"
    ) {
      inicio = new Date(
        agora
      )

      inicio.setDate(
        inicio.getDate() -
          6
      )

      inicio.setHours(
        0,
        0,
        0,
        0
      )

      fim = new Date(
        agora
      )

      fim.setHours(
        23,
        59,
        59,
        999
      )
    }

    /*
    30 DIAS
    */

    else if (
      periodo === "30"
    ) {
      inicio = new Date(
        agora
      )

      inicio.setDate(
        inicio.getDate() -
          29
      )

      inicio.setHours(
        0,
        0,
        0,
        0
      )

      fim = new Date(
        agora
      )

      fim.setHours(
        23,
        59,
        59,
        999
      )
    }

    /*
    MÊS ATUAL
    */

    else if (
      periodo === "mes"
    ) {
      inicio = new Date(
        agora.getFullYear(),
        agora.getMonth(),
        1
      )

      inicio.setHours(
        0,
        0,
        0,
        0
      )

      fim = new Date(
        agora.getFullYear(),
        agora.getMonth() + 1,
        0
      )

      fim.setHours(
        23,
        59,
        59,
        999
      )
    }

    /*
    PERSONALIZADO
    */

    else if (
      periodo === "personalizado"
    ) {
      if (
        !dataInicial ||
        !dataFinal
      ) {
        return null
      }

      inicio = new Date(
        `${dataInicial}T00:00:00`
      )

      fim = new Date(
        `${dataFinal}T23:59:59`
      )
    }

    /*
    TODO
    */

    else {
      inicio = new Date(
        2000,
        0,
        1
      )

      fim = new Date(
        2100,
        0,
        1
      )
    }

    return {
      inicio,
      fim,
    }
  }

  const periodoSelecionado =
    getPeriodo()

  /*
  ============================================================
  VENDAS DO PERÍODO
  ============================================================
  */

  const vendasDoPeriodo =
    periodoSelecionado
      ? sales.filter(
          (sale) => {
            if (
              !sale.date
            ) {
              return false
            }

            const data =
              new Date(
                sale.date
              )

            return (
              data >=
                periodoSelecionado.inicio &&
              data <=
                periodoSelecionado.fim
            )
          }
        )
      : []

  /*
  ============================================================
  RECEBIMENTOS REAIS
  ============================================================
  */

  const vendasPagas =
    vendasDoPeriodo.filter(
      (sale) =>
        sale.status ===
        "Pago"
    )

  /*
  ============================================================
  TOTAL RECEBIDO
  ============================================================
  */

  const totalRecebido =
    vendasPagas.reduce(
      (
        total,
        sale
      ) =>
        total +
        getValorRecebido(
          sale
        ),
      0
    )

  /*
  ============================================================
  LUCRO
  ============================================================
  */

  const lucro =
    vendasPagas.reduce(
      (
        total,
        sale
      ) =>
        total +
        getLucro(
          sale
        ),
      0
    )

  /*
  ============================================================
  FRETES
  ============================================================
  */

  const totalFretes =
    vendasPagas.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.delivery_fee ||
            0
        ),
      0
    )

  /*
  ============================================================
  CUSTO DOS PRODUTOS
  ============================================================
  */

  const custoProdutos =
    vendasPagas.reduce(
      (
        total,
        sale
      ) =>
        total +
        getCustoProdutos(
          sale
        ),
      0
    )

  /*
  ============================================================
  VENDAS
  ============================================================
  */

  const quantidadeVendas =
    vendasPagas.filter(
      (sale) =>
        sale.payment !==
        "Fiado" ||
        sale.status ===
        "Pago"
    ).length

  /*
  ============================================================
  ITENS VENDIDOS
  ============================================================
  */

  const quantidadeVendida =
    vendasDoPeriodo.reduce(
      (
        total,
        sale
      ) => {
        if (
          !Array.isArray(
            sale.products
          )
        ) {
          return (
            total +
            Number(
              sale.quantity || 0
            )
          )
        }

        return (
          total +
          sale.products.reduce(
            (
              sum: number,
              item: any
            ) =>
              sum +
              Number(
                item.quantity ||
                  0
              ),
            0
          )
        )
      },
      0
    )

  /*
  ============================================================
  FIADO PENDENTE
  ============================================================
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
        (
          total,
          sale
        ) =>
          total +
          Number(
            sale.total || 0
          ),
        0
      )

  /*
  ============================================================
  SAÍDAS DO PERÍODO
  ============================================================
  */

  const saidasDoPeriodo =
    periodoSelecionado
      ? outflows.filter(
          (outflow) => {
            if (
              !outflow.created_at
            ) {
              return false
            }

            const data =
              new Date(
                outflow.created_at
              )

            return (
              data >=
                periodoSelecionado.inicio &&
              data <=
                periodoSelecionado.fim
            )
          }
        )
      : []

  const totalSaidas =
    saidasDoPeriodo.reduce(
      (
        total,
        outflow
      ) =>
        total +
        Number(
          outflow.amount || 0
        ),
      0
    )

  /*
  ============================================================
  DESPESAS
  ============================================================
  */

  const totalDespesas =
    saidasDoPeriodo
      .filter(
        (outflow) =>
          outflow.type ===
          "Despesa"
      )
      .reduce(
        (
          total,
          outflow
        ) =>
          total +
          Number(
            outflow.amount || 0
          ),
        0
      )

  /*
  ============================================================
  RESULTADO DO PERÍODO
  ============================================================

  Aqui mostramos o quanto foi movimentado
  depois das saídas.

  ============================================================
  */

  const saldoPeriodo =
    totalRecebido -
    totalSaidas
    const lucroDisponivel =
  lucro -
  totalDespesas

  /*
  ============================================================
  FORMAS DE PAGAMENTO
  ============================================================
  */

  const pagamentos = {
    Pix: 0,
    Dinheiro: 0,
    Debito: 0,
    Credito: 0,
  }

  vendasPagas.forEach(
    (sale) => {
      const valor =
        getValorRecebido(
          sale
        )

      /*
      Fiado:
      usa a forma usada no recebimento.
      */

      const forma =
        sale.payment ===
        "Fiado"
          ? sale.received_payment
          : sale.payment

      if (
        forma ===
        "Pix"
      ) {
        pagamentos.Pix +=
          valor
      }

      if (
        forma ===
        "Dinheiro"
      ) {
        pagamentos.Dinheiro +=
          valor
      }

      if (
        forma ===
        "Débito"
      ) {
        pagamentos.Debito +=
          valor
      }

      if (
        forma ===
        "Crédito"
      ) {
        pagamentos.Credito +=
          valor
      }
    }
  )

  /*
  ============================================================
  PRODUTOS MAIS VENDIDOS
  ============================================================
  */

  const produtos:
    Record<string, number> =
    {}

  vendasDoPeriodo.forEach(
    (sale) => {
      if (
        !Array.isArray(
          sale.products
        )
      ) {
        return
      }

      sale.products.forEach(
        (
          item: any
        ) => {
          const nome =
            item.displayName ||
            item.name ||
            "Produto"

          const quantidade =
            Number(
              item.quantity ||
                0
            )

          if (
            produtos[nome]
          ) {
            produtos[nome] +=
              quantidade
          } else {
            produtos[nome] =
              quantidade
          }
        }
      )
    }
  )

  const rankingProdutos =
    Object.keys(
      produtos
    )
      .sort(
        (a, b) =>
          produtos[b] -
          produtos[a]
      )
      .slice(0, 5)

  /*
  ============================================================
  GRÁFICO
  ============================================================
  */

  const vendasPorDia:
    Record<string, number> =
    {}

  vendasPagas.forEach(
    (sale) => {
      if (
        !sale.date
      ) {
        return
      }

      const data =
        new Date(
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

      const valor =
        getValorRecebido(
          sale
        )

      if (
        vendasPorDia[
          dataFormatada
        ]
      ) {
        vendasPorDia[
          dataFormatada
        ] += valor
      } else {
        vendasPorDia[
          dataFormatada
        ] = valor
      }
    }
  )

  const grafico =
    Object.keys(
      vendasPorDia
    ).map(
      (data) => ({
        data,
        recebido:
          vendasPorDia[
            data
          ],
      })
    )

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Relatórios
        </h1>

        <p className="mt-2 text-gray-500">
          Carregando informações...
        </p>
      </div>
    )
  }

  /*
  ============================================================
  INTERFACE
  ============================================================
  */

  return (
    <div>

      {/* CABEÇALHO */}

      <div>

        <h1 className="text-3xl font-bold">
          Relatórios
        </h1>

        <p className="mt-2 text-gray-500">
          Histórico e análise financeira da ZERO GRAU
        </p>

      </div>

      {/* =====================================================
          FILTRO DE PERÍODO
      ====================================================== */}

      <div className="mt-6 bg-white p-6 rounded-xl shadow">

        <div className="flex flex-col lg:flex-row lg:items-end gap-4">

          <div className="flex-1">

            <label className="block text-sm font-medium text-gray-700">
              Período
            </label>

            <select
              className="border p-3 rounded-lg w-full mt-1"
              value={
                periodo
              }
              onChange={(
                e
              ) => {
                const valor =
                  e.target.value

                setPeriodo(
                  valor
                )

                setShowPersonalizado(
                  valor ===
                    "personalizado"
                )
              }}
            >

              <option value="hoje">
                Hoje
              </option>

              <option value="7">
                Últimos 7 dias
              </option>

              <option value="30">
                Últimos 30 dias
              </option>

              <option value="mes">
                Mês atual
              </option>

              <option value="todos">
                Todo o histórico
              </option>

              <option value="personalizado">
                Personalizado
              </option>

            </select>

          </div>

          {showPersonalizado && (
            <>
              <div>

                <label className="block text-sm font-medium text-gray-700">
                  Data inicial
                </label>

                <input
                  type="date"
                  className="border p-3 rounded-lg mt-1"
                  value={
                    dataInicial
                  }
                  onChange={(
                    e
                  ) =>
                    setDataInicial(
                      e.target.value
                    )
                  }
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700">
                  Data final
                </label>

                <input
                  type="date"
                  className="border p-3 rounded-lg mt-1"
                  value={
                    dataFinal
                  }
                  onChange={(
                    e
                  ) =>
                    setDataFinal(
                      e.target.value
                    )
                  }
                />

              </div>

            </>
          )}

        </div>

      </div>

      {/* =====================================================
          RESUMO PRINCIPAL
      ====================================================== */}

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-6 mt-8">

        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow">

          <p className="text-blue-700 font-semibold">
            💵 Total recebido
          </p>

          <p className="text-sm text-blue-600 mt-1">
            Valor realmente recebido no período.
          </p>

          <h2 className="text-2xl font-bold text-blue-800 mt-2">
            R${" "}
            {totalRecebido.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow">

          <p className="text-green-700 font-semibold">
            📈 Lucro
          </p>

          <p className="text-sm text-green-600 mt-1">
            Lucro das vendas recebidas.
          </p>

          <h2 className="text-2xl font-bold text-green-700 mt-2">
            R${" "}
            {lucro.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-gray-50 border p-6 rounded-xl shadow">

          <p className="text-gray-600 font-semibold">
            🚚 Fretes
          </p>

          <p className="text-sm text-gray-500 mt-1">
            Total de fretes recebidos.
          </p>

          <h2 className="text-2xl font-bold mt-2">
            R${" "}
            {totalFretes.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow">

          <p className="text-red-700 font-semibold">
            💸 Saídas
          </p>

          <p className="text-sm text-red-600 mt-1">
            Valores retirados no período.
          </p>

          <h2 className="text-2xl font-bold text-red-700 mt-2">
            R${" "}
            {totalSaidas.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl shadow">

          <p className="text-purple-700 font-semibold">
            💰 Resultado do período
          </p>

          <p className="text-sm text-purple-600 mt-1">
            Recebido - saídas.
          </p>

          <h2 className="text-2xl font-bold text-purple-800 mt-2">
            R${" "}
            {saldoPeriodo.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500 font-semibold">
            🛒 Vendas
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Quantidade de vendas pagas.
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {quantidadeVendas}
          </h2>

        </div>
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-xl shadow">

  <p className="text-orange-700 font-semibold">
    🧾 Despesas
  </p>

  <p className="text-sm text-orange-600 mt-1">
    Saídas classificadas como despesas.
  </p>

  <h2 className="text-2xl font-bold text-orange-700 mt-2">
    R${" "}
    {totalDespesas.toFixed(2)}
  </h2>

</div>
<div className="bg-green-50 border border-green-200 p-6 rounded-xl shadow">

  <p className="text-green-700 font-semibold">
    📈 Lucro disponível
  </p>

  <p className="text-sm text-green-600 mt-1">
    Lucro das vendas - despesas.
  </p>

  <h2 className="text-2xl font-bold text-green-700 mt-2">
    R${" "}
    {lucroDisponivel.toFixed(2)}
  </h2>

</div>

      </div>

      {/* =====================================================
          INFORMAÇÕES COMPLEMENTARES
      ====================================================== */}

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-6 mt-6">

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            🛒 Itens vendidos
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {quantidadeVendida} un
          </h2>

        </div>

        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow">

          <p className="text-red-700">
            📝 Fiado pendente
          </p>

          <h2 className="text-2xl font-bold text-red-700 mt-2">
            R${" "}
            {fiadoPendente.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            📦 Custo dos produtos
          </p>

          <h2 className="text-2xl font-bold mt-2">
            R${" "}
            {custoProdutos.toFixed(
              2
            )}
          </h2>

        </div>

      </div>

      {/* =====================================================
          PAGAMENTOS + RANKING
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">

        {/* PAGAMENTOS */}

        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-bold text-lg">
            💳 Formas de pagamento
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Total recebido por forma de pagamento.
          </p>

          <div className="mt-5 space-y-3">

            <div className="flex justify-between">
              <span>
                📱 Pix
              </span>

              <strong>
                R${" "}
                {pagamentos.Pix.toFixed(
                  2
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>
                💵 Dinheiro
              </span>

              <strong>
                R${" "}
                {pagamentos.Dinheiro.toFixed(
                  2
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>
                💳 Débito
              </span>

              <strong>
                R${" "}
                {pagamentos.Debito.toFixed(
                  2
                )}
              </strong>
            </div>

            <div className="flex justify-between">
              <span>
                💳 Crédito
              </span>

              <strong>
                R${" "}
                {pagamentos.Credito.toFixed(
                  2
                )}
              </strong>
            </div>

            <div className="border-t pt-3 flex justify-between font-bold">

              <span>
                Total
              </span>

              <strong className="text-blue-700">
                R${" "}
                {(
                  pagamentos.Pix +
                  pagamentos.Dinheiro +
                  pagamentos.Debito +
                  pagamentos.Credito
                ).toFixed(
                  2
                )}
              </strong>

            </div>

          </div>

        </div>

        {/* PRODUTOS MAIS VENDIDOS */}

        <div className="bg-white p-6 rounded-xl shadow">

          <h2 className="font-bold text-lg">
            🏆 Produtos mais vendidos
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Ranking do período selecionado.
          </p>

          <div className="mt-5 space-y-3">

            {rankingProdutos.length ===
            0 ? (

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

        </div>

      </div>

      {/* =====================================================
          SAÍDAS DO PERÍODO
      ====================================================== */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold text-lg">
          💸 Saídas do período
        </h2>

        {saidasDoPeriodo.length ===
        0 ? (

          <p className="text-gray-500 mt-4">
            Nenhuma saída registrada no período.
          </p>

        ) : (

          <div className="mt-4 space-y-3">

            {saidasDoPeriodo.map(
              (
                outflow
              ) => (

                <div
                  key={
                    outflow.id
                  }
                  className="flex justify-between items-center border-b pb-3"
                >

                  <div>

                    <p className="font-bold">
                      {
                        outflow.description
                      }
                    </p>

                    <p className="text-sm text-gray-500">
                      {
                        outflow.type
                      }
                      {" • "}
                      {
                        outflow.payment_method
                      }
                    </p>

                    <p className="text-sm text-gray-500">
                      {
                        outflow.created_at
                          ? new Intl.DateTimeFormat(
                              "pt-BR",
                              {
                                timeZone:
                                  "America/Sao_Paulo",
                                dateStyle:
                                  "short",
                                timeStyle:
                                  "short",
                              }
                            ).format(
                              new Date(
                                outflow.created_at
                              )
                            )
                          : "-"
                      }
                    </p>

                  </div>

                  <strong className="text-red-700">
                    - R${" "}
                    {Number(
                      outflow.amount ||
                        0
                    ).toFixed(
                      2
                    )}
                  </strong>

                </div>

              )
            )}

          </div>

        )}

      </div>

      {/* =====================================================
          GRÁFICO
      ====================================================== */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold text-lg">
          📊 Recebimentos por dia
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Evolução dos valores recebidos no período.
        </p>

        {grafico.length ===
        0 ? (

          <p className="text-gray-500 mt-4">
            Ainda não existem vendas para exibir.
          </p>

        ) : (

          <div className="w-full h-80 mt-6">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <LineChart
                data={
                  grafico
                }
              >

                <CartesianGrid
                  strokeDasharray="3 3"
                />

                <XAxis
                  dataKey="data"
                />

                <YAxis />

                <Tooltip
                  formatter={(
                    value: any
                  ) =>
                    `R$ ${Number(
                      value
                    ).toFixed(2)}`
                  }
                />

                <Line
                  type="monotone"
                  dataKey="recebido"
                  stroke="#1d4ed8"
                  strokeWidth={
                    3
                  }
                  dot={{
                    r: 5,
                  }}
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