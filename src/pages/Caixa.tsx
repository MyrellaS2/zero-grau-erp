
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Caixa() {
  const [sales, setSales] = useState<any[]>([])
  const [cashRegister, setCashRegister] = useState<any | null>(null)

  const [loading, setLoading] = useState(true)

  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)

  const [openingAmount, setOpeningAmount] = useState("")
  const [countedCash, setCountedCash] = useState("")
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

    const { data: salesData, error: salesError } =
      await supabase
        .from("sales")
        .select("*")
        .order("date", {
          ascending: false,
        })

    if (salesError) {
      console.error(
        "ERRO AO CARREGAR VENDAS:",
        salesError
      )
    }

    setSales(salesData || [])

    const { data: cashData, error: cashError } =
      await supabase
        .from("cash_registers")
        .select("*")
        .eq("status", "Aberto")
        .order("opened_at", {
          ascending: false,
        })
        .limit(1)

    if (cashError) {
      console.error(
        "ERRO AO CARREGAR CAIXA:",
        cashError
      )
    }

    setCashRegister(
      cashData && cashData.length > 0
        ? cashData[0]
        : null
    )

    setLoading(false)
  }

  /*
  ============================================================
  FORMATA DATA
  ============================================================
  */

  function formatDate(date: string | null) {
    if (!date) return "-"

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "medium",
      }
    ).format(new Date(date))
  }

  /*
  ============================================================
  VENDAS DO CAIXA ATUAL
  ============================================================

  São somente as vendas realizadas depois
  da abertura do caixa.
  ============================================================
  */

  const vendasDoCaixa = cashRegister
    ? sales.filter((sale) => {
        if (!sale.date) return false

        const saleDate = new Date(
          sale.date
        )

        const openedAt = new Date(
          cashRegister.opened_at
        )

        return saleDate >= openedAt
      })
    : []

  /*
  ============================================================
  RECEBIMENTOS DO CAIXA ATUAL
  ============================================================

  Inclui:

  1. Vendas realizadas depois da abertura
     e que já foram pagas.

  2. Fiados antigos recebidos neste caixa.

  Dessa forma o dinheiro e o lucro do fiado
  são contabilizados no caixa em que ele foi recebido.
  ============================================================
  */

  const recebimentosDoCaixa = cashRegister
    ? sales.filter((sale) => {
        if (sale.status !== "Pago") {
          return false
        }

        /*
        --------------------------------------------------------
        FIADO RECEBIDO NESTE CAIXA
        --------------------------------------------------------
        */

        if (
          sale.payment === "Fiado" &&
          sale.received_cash_register_id !==
            null &&
          sale.received_cash_register_id !==
            undefined
        ) {
          return (
            String(
              sale.received_cash_register_id
            ) ===
            String(cashRegister.id)
          )
        }

        /*
        --------------------------------------------------------
        VENDA NORMAL REALIZADA NESTE CAIXA
        --------------------------------------------------------
        */

        if (!sale.date) {
          return false
        }

        const saleDate = new Date(
          sale.date
        )

        const openedAt = new Date(
          cashRegister.opened_at
        )

        /*
        Fiado antigo não entra aqui.
        Ele só entra pelo received_cash_register_id.
        */

        if (sale.payment === "Fiado") {
          return false
        }

        return saleDate >= openedAt
      })
    : []

  /*
  ============================================================
  VENDAS PAGAS DO PERÍODO
  ============================================================
  */

  const vendasRealizadas =
    vendasDoCaixa.filter(
      (sale) =>
        sale.status === "Pago"
    )

  /*
  ============================================================
  FIADOS RECEBIDOS NESTE CAIXA
  ============================================================
  */

  const fiadosRecebidos =
    cashRegister
      ? sales.filter((sale) => {
          if (
            sale.payment !== "Fiado" ||
            sale.status !== "Pago"
          ) {
            return false
          }

          if (
            sale.received_cash_register_id ===
              null ||
            sale.received_cash_register_id ===
              undefined
          ) {
            return false
          }

          return (
            String(
              sale.received_cash_register_id
            ) ===
            String(cashRegister.id)
          )
        })
      : []

  /*
  ============================================================
  VALOR EFETIVAMENTE RECEBIDO
  ============================================================
  */

  const getValorRecebido = (
    sale: any
  ) => {
    if (
      sale.received_total !== null &&
      sale.received_total !== undefined
    ) {
      return Number(
        sale.received_total
      )
    }

    return Number(
      sale.total || 0
    )
  }

  /*
  ============================================================
  DINHEIRO RECEBIDO
  ============================================================
  */

 const dinheiroVendas =
  recebimentosDoCaixa
    .filter(
      (sale) =>
        sale.payment === "Dinheiro" ||
        (
          sale.payment === "Fiado" &&
          sale.received_payment === "Dinheiro"
        )
    )
      .reduce(
        (total, sale) =>
          total +
          getValorRecebido(sale),
        0
      )

  /*
  ============================================================
  TROCO EM DINHEIRO
  ============================================================
  */

  const trocoDinheiro =
    recebimentosDoCaixa
      .filter(
        (sale) =>
          sale.payment ===
            "Dinheiro" &&
          sale.change_method ===
            "Dinheiro"
      )
      .reduce(
        (total, sale) =>
          total +
          Number(
            sale.change_amount || 0
          ),
        0
      )

  /*
  ============================================================
  TROCO VIA PIX
  ============================================================
  */

  const trocoPix =
    recebimentosDoCaixa
      .filter(
        (sale) =>
          sale.payment ===
            "Dinheiro" &&
          sale.change_method ===
            "Pix"
      )
      .reduce(
        (total, sale) =>
          total +
          Number(
            sale.change_amount || 0
          ),
        0
      )

  /*
  ============================================================
  DINHEIRO FÍSICO ESPERADO
  ============================================================
  */

  const dinheiroEsperado =
    Number(
      cashRegister?.opening_amount ||
        0
    ) +
    dinheiroVendas -
    trocoDinheiro

  /*
  ============================================================
  PIX
  ============================================================
  */

  const pixVendas =
  recebimentosDoCaixa
    .filter(
      (sale) =>
        sale.payment === "Pix" ||
        (
          sale.payment === "Fiado" &&
          sale.received_payment === "Pix"
        )
    )
      .reduce(
        (total, sale) =>
          total +
          getValorRecebido(sale),
        0
      )

  const pix =
    pixVendas -
    trocoPix

  /*
  ============================================================
  DÉBITO
  ============================================================
  */

 const debito =
  recebimentosDoCaixa
    .filter(
      (sale) =>
        sale.payment === "Débito" ||
        (
          sale.payment === "Fiado" &&
          sale.received_payment === "Débito"
        )
    )
      .reduce(
        (total, sale) =>
          total +
          getValorRecebido(sale),
        0
      )

  /*
  ============================================================
  CRÉDITO
  ============================================================
  */

  const credito =
  recebimentosDoCaixa
    .filter(
      (sale) =>
        sale.payment === "Crédito" ||
        (
          sale.payment === "Fiado" &&
          sale.received_payment === "Crédito"
        )
    )
      .reduce(
        (total, sale) =>
          total +
          getValorRecebido(sale),
        0
      )

  /*
  ============================================================
  TOTAL VENDIDO
  ============================================================

  Aqui entram somente as vendas realizadas
  durante este caixa.

  Fiado antigo recebido agora não aumenta
  o total vendido deste caixa.
  ============================================================
  */

  const totalVendido =
    vendasDoCaixa.reduce(
      (total, sale) =>
        total +
        Number(
          sale.total || 0
        ),
      0
    )

  /*
  ============================================================
  TOTAL RECEBIDO
  ============================================================

  Não inclui o dinheiro inicial.
  Inclui fiados antigos recebidos neste caixa.
  ============================================================
  */

  const recebido =
    dinheiroVendas -
    trocoDinheiro +
    pixVendas -
    trocoPix +
    debito +
    credito

  /*
  ============================================================
  CÁLCULO DO LUCRO
  ============================================================

  REGRA DO SISTEMA:

  - Venda normal paga:
    lucro contabilizado no caixa da venda.

  - Fiado recebido posteriormente:
    lucro contabilizado no caixa em que
    o fiado foi recebido.

  Portanto, recebimentosDoCaixa é a fonte
  correta para o lucro deste caixa.
  ============================================================
  */

  const calcularLucro = (
    sale: any
  ) => {
    /*
    --------------------------------------------------------
    SE NÃO EXISTIREM OS PRODUTOS
    --------------------------------------------------------
    */

    if (
      !Array.isArray(
        sale.products
      )
    ) {
      return Number(
        sale.profit || 0
      )
    }

    /*
    --------------------------------------------------------
    CUSTO DOS PRODUTOS
    --------------------------------------------------------
    */

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
              item.purchasePrice ||
                0
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
    --------------------------------------------------------
    VALOR RECEBIDO
    --------------------------------------------------------

    Para fiado recebido posteriormente,
    received_total será o valor realmente
    recebido, considerando eventual desconto.
    */

    const valorRecebido =
      getValorRecebido(
        sale
      )

    return (
      valorRecebido -
      custoTotal
    )
  }

  const lucroTotal =
    recebimentosDoCaixa.reduce(
      (
        total: number,
        sale: any
      ) => {
        return (
          total +
          calcularLucro(sale)
        )
      },
      0
    )

  /*
  ============================================================
  QUANTIDADE DE VENDAS
  ============================================================
  */

  const quantidadeVendas =
    vendasDoCaixa.length

  /*
  ============================================================
  FIADOS PENDENTES
  ============================================================
  */

  const fiado =
    vendasDoCaixa
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
  ============================================================
  ABRIR CAIXA
  ============================================================
  */

  async function abrirCaixa() {
    const valor =
      Number(
        openingAmount.replace(
          ",",
          "."
        ) || 0
      )

    if (
      isNaN(valor) ||
      valor < 0
    ) {
      alert(
        "Valor inicial inválido."
      )
      return
    }

    if (cashRegister) {
      alert(
        "Já existe um caixa aberto."
      )
      return
    }

    const {
      data,
      error,
    } = await supabase
      .from(
        "cash_registers"
      )
      .insert({
        opening_amount:
          valor,

        status:
          "Aberto",

        opened_at:
          new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error(
        "ERRO AO ABRIR CAIXA:",
        error
      )

      alert(
        `Não foi possível abrir o caixa.\n\n${error.message}`
      )

      return
    }

    setCashRegister(
      data?.[0] || null
    )

    setOpeningAmount("")
    setShowOpenModal(false)

    alert(
      "Caixa aberto com sucesso!"
    )
  }

  /*
  ============================================================
  FECHAR CAIXA
  ============================================================
  */

  async function fecharCaixa() {
    if (!cashRegister) {
      alert(
        "Não existe caixa aberto."
      )
      return
    }

    if (
      countedCash === ""
    ) {
      alert(
        "Informe o dinheiro contado no caixa."
      )
      return
    }

    const dinheiroContado =
      Number(
        countedCash.replace(
          ",",
          "."
        )
      )

    if (
      isNaN(
        dinheiroContado
      ) ||
      dinheiroContado < 0
    ) {
      alert(
        "Valor contado inválido."
      )
      return
    }

    const diferenca =
      dinheiroContado -
      dinheiroEsperado

    const totalRecebido =
      recebido

    setClosing(true)

    const {
      data,
      error,
    } = await supabase
      .from(
        "cash_registers"
      )
      .update({
        closed_at:
          new Date().toISOString(),

        counted_cash:
          dinheiroContado,

        expected_cash:
          dinheiroEsperado,

        cash_difference:
          diferenca,

        pix_total:
          pix,

        debit_total:
          debito,

        credit_total:
          credito,

        total_received:
          totalRecebido,

        status:
          "Fechado",
      })
      .eq(
        "id",
        cashRegister.id
      )
      .select()

    if (error) {
      console.error(
        "ERRO AO FECHAR CAIXA:",
        error
      )

      alert(
        `Não foi possível fechar o caixa.\n\n${error.message}`
      )

      setClosing(false)
      return
    }

    if (
      !data ||
      data.length === 0
    ) {
      alert(
        "O caixa não foi atualizado."
      )

      setClosing(false)
      return
    }

    setCashRegister(null)
    setCountedCash("")
    setShowCloseModal(false)
    setClosing(false)

    alert(
      `Caixa fechado com sucesso!\n\nDiferença: R$ ${diferenca.toFixed(
        2
      )}`
    )
  }

  /*
  ============================================================
  CARREGANDO
  ============================================================
  */

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Caixa
        </h1>

        <p className="mt-2 text-gray-500">
          Carregando informações do caixa...
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

      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Caixa
          </h1>

          <p className="mt-2 text-gray-500">
            Controle financeiro da ZERO GRAU
          </p>
        </div>

        {!cashRegister ? (
          <button
            onClick={() =>
              setShowOpenModal(
                true
              )
            }
            className="bg-green-700 text-white px-5 py-3 rounded-lg font-bold"
          >
            🟢 Abrir caixa
          </button>
        ) : (
          <button
            onClick={() =>
              setShowCloseModal(
                true
              )
            }
            className="bg-red-600 text-white px-5 py-3 rounded-lg font-bold"
          >
            🔒 Fechar caixa
          </button>
        )}
      </div>

      {/* STATUS */}

      {cashRegister ? (
        <div className="mt-6 bg-green-50 border border-green-200 p-5 rounded-xl">
          <div className="flex justify-between gap-4">
            <div>
              <p className="text-green-700 font-bold">
                🟢 Caixa aberto
              </p>

              <p className="text-gray-600 mt-1">
                Aberto em:{" "}
                {formatDate(
                  cashRegister.opened_at
                )}
              </p>

              <p className="text-gray-600 mt-1">
                Dinheiro inicial:{" "}
                <strong>
                  R${" "}
                  {Number(
                    cashRegister.opening_amount ||
                      0
                  ).toFixed(2)}
                </strong>
              </p>
            </div>

            <div className="text-right">
              <p className="text-gray-500 text-sm">
                Dinheiro esperado
              </p>

              <p className="text-xl font-bold">
                R${" "}
                {dinheiroEsperado.toFixed(
                  2
                )}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-orange-50 border border-orange-200 p-5 rounded-xl">
          <p className="text-orange-700 font-bold">
            🔴 Caixa fechado
          </p>

          <p className="text-gray-600 mt-1">
            Abra um novo caixa para começar a contabilizar as vendas.
          </p>
        </div>
      )}

      {/* RESUMO */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            💰 Vendido
          </p>

          <h2 className="text-2xl font-bold mt-2">
            R$ {totalVendido.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            💵 Recebido
          </p>

          <h2 className="text-2xl font-bold text-green-600 mt-2">
            R$ {recebido.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            📈 Lucro
          </p>

          <h2 className="text-2xl font-bold mt-2">
            R$ {lucroTotal.toFixed(2)}
          </h2>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-500">
            🛒 Vendas
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {quantidadeVendas}
          </h2>
        </div>
      </div>

      {/* FORMAS DE PAGAMENTO */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          Formas de pagamento
        </h2>

        <div className="mt-4 space-y-3">
          <p>
            💵 Dinheiro:
            <b>
              {" "}
              R${" "}
              {(
                dinheiroVendas -
                trocoDinheiro
              ).toFixed(2)}
            </b>
          </p>

          <p>
            📱 Pix:
            <b>
              {" "}
              R$ {pix.toFixed(2)}
            </b>
          </p>

          <p>
            💳 Débito:
            <b>
              {" "}
              R$ {debito.toFixed(2)}
            </b>
          </p>

          <p>
            💳 Crédito:
            <b>
              {" "}
              R$ {credito.toFixed(2)}
            </b>
          </p>

          <p>
            🔄 Trocos em dinheiro:
            <b>
              {" "}
              R$ {trocoDinheiro.toFixed(2)}
            </b>
          </p>

          <p>
            📱 Trocos via Pix:
            <b>
              {" "}
              R$ {trocoPix.toFixed(2)}
            </b>
          </p>

          <p>
            📝 Fiado pendente:
            <b className="text-red-600">
              {" "}
              R$ {fiado.toFixed(2)}
            </b>
          </p>

          {fiadosRecebidos.length >
            0 && (
            <div className="border-t pt-3">
              <p>
                💰 Fiados recebidos:
                <b className="text-green-700">
                  {" "}
                  R${" "}
                  {fiadosRecebidos
                    .reduce(
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
                    .toFixed(2)}
                </b>
              </p>
            </div>
          )}

          <div className="border-t pt-3 flex justify-between">
            <span className="font-bold">
              Total recebido
            </span>

            <strong className="text-green-700">
              R$ {recebido.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      {/* ÚLTIMAS VENDAS */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          Últimas vendas
        </h2>

        <div className="mt-4 space-y-3">
          {vendasDoCaixa
            .slice(0, 5)
            .map(
              (sale) => (
                <div
                  key={sale.id}
                  className="border rounded-lg p-4 flex justify-between"
                >
                  <div>
                    <p className="font-bold">
                      {sale.product ||
                        (
                          Array.isArray(
                            sale.products
                          ) &&
                          sale.products[0]
                            ?.displayName
                        ) ||
                        "Venda"}
                    </p>

                    <p className="text-gray-500">
                      {sale.payment}
                    </p>

                    <p className="text-gray-500">
                      {formatDate(
                        sale.date
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      R${" "}
                      {Number(
                        sale.total || 0
                      ).toFixed(2)}
                    </p>

                    {sale.payment ===
                      "Dinheiro" &&
                      Number(
                        sale.change_amount ||
                          0
                      ) > 0 && (
                        <p className="text-gray-500 text-sm">
                          Troco: R${" "}
                          {Number(
                            sale.change_amount ||
                              0
                          ).toFixed(2)}{" "}
                          {sale.change_method ===
                          "Pix"
                            ? "(Pix)"
                            : "(Dinheiro)"}
                        </p>
                      )}

                    {sale.payment ===
                      "Fiado" &&
                      sale.status ===
                        "Pendente" && (
                        <p className="text-red-600 text-sm">
                          Pendente
                        </p>
                      )}

                    {sale.payment !==
                      "Fiado" &&
                      sale.status ===
                        "Pago" && (
                        <p className="text-green-600 text-sm">
                          Pago
                        </p>
                      )}
                  </div>
                </div>
              )
            )}

          {vendasDoCaixa.length ===
            0 && (
              <p className="text-gray-500">
                Nenhuma venda registrada neste caixa.
              </p>
            )}
        </div>
      </div>

      {/* FIADOS RECEBIDOS NESTE CAIXA */}

      {fiadosRecebidos.length >
        0 && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold text-lg">
            💰 Fiados recebidos neste caixa
          </h2>

          <div className="mt-4 space-y-3">
            {fiadosRecebidos.map(
              (sale) => (
                <div
                  key={`fiado-${sale.id}`}
                  className="border rounded-lg p-4 flex justify-between"
                >
                  <div>
                    <p className="font-bold">
                      {sale.customer ||
                        "Cliente não informado"}
                    </p>

                    <p className="text-gray-500">
                      Venda original:{" "}
                      {formatDate(
                        sale.date
                      )}
                    </p>

                    <p className="text-gray-500">
                      Recebido em:{" "}
                      {formatDate(
                        sale.received_at
                      )}
                    </p>

                    <p className="text-gray-500">
                      Forma:{" "}
                      {sale.payment}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-green-700">
                      R${" "}
                      {getValorRecebido(
                        sale
                      ).toFixed(2)}
                    </p>

                    {Number(
                      sale.discount ||
                        0
                    ) > 0 && (
                      <p className="text-red-600 text-sm">
                        Desconto: R${" "}
                        {Number(
                          sale.discount
                        ).toFixed(2)}
                      </p>
                    )}

                    <p className="text-green-600 text-sm mt-1">
                      Lucro: R${" "}
                      {calcularLucro(
                        sale
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* MODAL ABRIR CAIXA */}

      {showOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold">
              🟢 Abrir caixa
            </h2>

            <p className="text-gray-500 mt-2">
              Informe quanto dinheiro físico existe no caixa neste momento.
            </p>

            <input
              className="border p-3 rounded-lg w-full mt-5"
              type="number"
              min="0"
              step="0.01"
              placeholder="Dinheiro inicial"
              value={
                openingAmount
              }
              onChange={(e) =>
                setOpeningAmount(
                  e.target.value
                )
              }
            />

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() =>
                  setShowOpenModal(
                    false
                  )
                }
                className="border px-4 py-2 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={
                  abrirCaixa
                }
                className="bg-green-700 text-white px-4 py-2 rounded-lg font-bold"
              >
                Abrir caixa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FECHAR CAIXA */}

      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold">
              🔒 Fechamento de caixa
            </h2>

            <div className="mt-5 space-y-3">
              <div className="flex justify-between">
                <span>
                  Dinheiro inicial
                </span>

                <strong>
                  R${" "}
                  {Number(
                    cashRegister?.opening_amount ||
                      0
                  ).toFixed(2)}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Dinheiro das vendas
                </span>

                <strong>
                  R${" "}
                  {dinheiroVendas.toFixed(
                    2
                  )}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Trocos em dinheiro
                </span>

                <strong>
                  - R${" "}
                  {trocoDinheiro.toFixed(
                    2
                  )}
                </strong>
              </div>

              <div className="border-t pt-3 flex justify-between font-bold">
                <span>
                  Dinheiro esperado
                </span>

                <span>
                  R${" "}
                  {dinheiroEsperado.toFixed(
                    2
                  )}
                </span>
              </div>

              <div className="flex justify-between">
                <span>
                  Pix
                </span>

                <strong>
                  R${" "}
                  {pix.toFixed(2)}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Débito
                </span>

                <strong>
                  R${" "}
                  {debito.toFixed(2)}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Crédito
                </span>

                <strong>
                  R${" "}
                  {credito.toFixed(2)}
                </strong>
              </div>

              {fiadosRecebidos.length >
                0 && (
                <div className="flex justify-between">
                  <span>
                    Fiados recebidos
                  </span>

                  <strong>
                    R${" "}
                    {fiadosRecebidos
                      .reduce(
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
                      .toFixed(2)}
                  </strong>
                </div>
              )}

              <div className="border-t pt-3 flex justify-between font-bold">
                <span>
                  Total recebido
                </span>

                <span className="text-green-700">
                  R${" "}
                  {recebido.toFixed(2)}
                </span>
              </div>
            </div>

            <input
              className="border p-3 rounded-lg w-full mt-5"
              type="number"
              min="0"
              step="0.01"
              placeholder="Quanto dinheiro foi contado?"
              value={
                countedCash
              }
              onChange={(e) =>
                setCountedCash(
                  e.target.value
                )
              }
            />

            {countedCash !==
              "" && (
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <p className="text-gray-500">
                  Diferença
                </p>

                <p
                  className={
                    Number(
                      countedCash.replace(
                        ",",
                        "."
                      )
                    ) -
                      dinheiroEsperado ===
                    0
                      ? "text-xl font-bold text-green-600"
                      : "text-xl font-bold text-red-600"
                  }
                >
                  R${" "}
                  {(
                    Number(
                      countedCash.replace(
                        ",",
                        "."
                      )
                    ) -
                    dinheiroEsperado
                  ).toFixed(2)}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() =>
                  setShowCloseModal(
                    false
                  )
                }
                disabled={
                  closing
                }
                className="border px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={
                  fecharCaixa
                }
                disabled={
                  closing
                }
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {closing
                  ? "Fechando..."
                  : "Confirmar fechamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Caixa

