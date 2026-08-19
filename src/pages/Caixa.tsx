import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Caixa() {
  const [sales, setSales] = useState<any[]>([])
  const [cashRegister, setCashRegister] =
    useState<any | null>(null)

  const [outflows, setOutflows] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const [showOpenModal, setShowOpenModal] =
    useState(false)

  const [showCloseModal, setShowCloseModal] =
    useState(false)

  const [showDiagnostico, setShowDiagnostico] =
    useState(false)

  const [showSaidas, setShowSaidas] =
    useState(false)

  const [showOutflowModal, setShowOutflowModal] =
    useState(false)

  /*
  ============================================================
  ABERTURA DO CAIXA
  ============================================================
  */

  const [openingAmount, setOpeningAmount] =
    useState("")

  const [cashName, setCashName] =
    useState("")

  /*
  ============================================================
  CONFERÊNCIA DE ESTOQUE
  ============================================================
  */

  const [showStockConference, setShowStockConference] =
    useState(false)

  const [stockProducts, setStockProducts] =
    useState<any[]>([])

  const [countedStock, setCountedStock] =
    useState<Record<number, string>>({})

  const [openingStock, setOpeningStock] =
    useState(false)

  const [loadingStockConference, setLoadingStockConference] =
    useState(false)

  /*
  ============================================================
  HISTÓRICO DE CAIXAS
  ============================================================
  */

  const [closedCashRegisters, setClosedCashRegisters] =
    useState<any[]>([])

  const [showClosedHistory, setShowClosedHistory] =
    useState(false)

  const [selectedClosedCash, setSelectedClosedCash] =
    useState<any | null>(null)

  const [closedCashDetails, setClosedCashDetails] =
    useState<any | null>(null)

  /*
  ============================================================
  HISTÓRICO DE CONFERÊNCIAS
  ============================================================
  */

  const [showConferenceHistory, setShowConferenceHistory] =
    useState(false)

  const [stockConferenceHistory, setStockConferenceHistory] =
    useState<any[]>([])

  /*
  ============================================================
  FECHAMENTO
  ============================================================
  */

  const [countedCash, setCountedCash] =
    useState("")

  const [closing, setClosing] =
    useState(false)

  /*
  ============================================================
  SAÍDAS
  ============================================================
  */

  const [outflowAmount, setOutflowAmount] =
    useState("")

  const [outflowType, setOutflowType] =
    useState<
      | "Compra/Reposição de estoque"
      | "Despesa"
      | "Retirada"
    >("Compra/Reposição de estoque")

  const [outflowPaymentMethod, setOutflowPaymentMethod] =
    useState<"Dinheiro" | "Pix">("Pix")

  const [outflowDescription, setOutflowDescription] =
    useState("")

  const [savingOutflow, setSavingOutflow] =
    useState(false)

  /*
  ============================================================
  CARREGA HISTÓRICO DE CAIXAS FECHADOS
  ============================================================
  */

  async function loadClosedCashRegisters() {
    const {
      data,
      error,
    } = await supabase
      .from("cash_registers")
      .select("*")
      .eq("status", "Fechado")
      .order("closed_at", {
        ascending: false,
      })

    if (error) {
      console.error(
        "ERRO AO CARREGAR HISTÓRICO DE CAIXAS:",
        error
      )

      return
    }

    setClosedCashRegisters(
      data || []
    )
  }

  /*
  ============================================================
  CARREGA HISTÓRICO DE CONFERÊNCIAS
  ============================================================
  */

  async function loadStockConferenceHistory() {
    const {
      data,
      error,
    } = await supabase
      .from("stock_conferences")
      .select("*")
      .order("created_at", {
        ascending: false,
      })

    if (error) {
      console.error(
        "ERRO AO CARREGAR HISTÓRICO DE CONFERÊNCIAS:",
        error
      )

      return
    }

    setStockConferenceHistory(
      data || []
    )
  }

  /*
  ============================================================
  FORMATA DATA
  ============================================================
  */

  function formatDate(
    date: string | null
  ) {
    if (!date) return "-"

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          "America/Sao_Paulo",

        dateStyle: "short",
        timeStyle: "medium",
      }
    ).format(
      new Date(date)
    )
  }

  /*
  ============================================================
  CUSTO DOS PRODUTOS
  ============================================================
  */

  const getCustoProdutos = (
    sale: any
  ) => {
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
            item.quantity ||
              0
          )

        const purchasePrice =
          Number(
            item.purchasePrice ||
              0
          )

        return (
          total +
          purchasePrice *
            quantity
        )
      },
      0
    )
  }

  /*
  ============================================================
  CARREGA DETALHES DE CAIXA FECHADO
  ============================================================
  */

  async function carregarDetalhesCaixaFechado(
    cash: any
  ) {
    const {
      data: salesData,
      error: salesError,
    } = await supabase
      .from("sales")
      .select("*")
      .gte(
        "date",
        cash.opened_at
      )
      .lte(
        "date",
        cash.closed_at
      )

    if (salesError) {
      console.error(
        "ERRO AO CARREGAR VENDAS DO CAIXA FECHADO:",
        salesError
      )
    }

    const {
      data: fiadosData,
      error: fiadosError,
    } = await supabase
      .from("sales")
      .select("*")
      .eq(
        "status",
        "Pago"
      )
      .eq(
        "received_cash_register_id",
        cash.id
      )

    if (fiadosError) {
      console.error(
        "ERRO AO CARREGAR FIADOS DO CAIXA FECHADO:",
        fiadosError
      )
    }

    const combinedSales = [
      ...(salesData || []),
      ...(fiadosData || []),
    ]

    const uniqueSales =
      Array.from(
        new Map(
          combinedSales.map(
            (sale) => [
              sale.id,
              sale,
            ]
          )
        ).values()
      )

    let totalRecebido =
      0

    uniqueSales.forEach(
      (sale: any) => {
        if (
          sale.status !==
          "Pago"
        ) {
          return
        }

        if (
          sale.payment ===
          "Fiado"
        ) {
          if (
            String(
              sale.received_cash_register_id
            ) !==
            String(
              cash.id
            )
          ) {
            return
          }

          totalRecebido +=
            Number(
              sale.received_total ||
                0
            ) +
            Number(
              sale.delivery_fee ||
                0
            )

          return
        }

        totalRecebido +=
          Number(
            sale.total ||
              0
          )
      }
    )

    let totalFretes =
      0

    uniqueSales.forEach(
      (sale: any) => {
        if (
          sale.status !==
          "Pago"
        ) {
          return
        }

        if (
          sale.payment ===
          "Fiado"
        ) {
          if (
            String(
              sale.received_cash_register_id
            ) !==
            String(
              cash.id
            )
          ) {
            return
          }
        }

        totalFretes +=
          Number(
            sale.delivery_fee ||
              0
          )
      }
    )

    let lucroHistorico =
      0

    uniqueSales.forEach(
      (sale: any) => {
        if (
          sale.status !==
          "Pago"
        ) {
          return
        }

        if (
          sale.payment ===
          "Fiado"
        ) {
          if (
            String(
              sale.received_cash_register_id
            ) !==
            String(
              cash.id
            )
          ) {
            return
          }

          const custo =
            getCustoProdutos(
              sale
            )

          const recebidoProdutos =
            Number(
              sale.received_total ||
                0
            )

          lucroHistorico +=
            recebidoProdutos -
            custo

          return
        }

        lucroHistorico +=
          Number(
            sale.profit ||
              0
          )
      }
    )

    const {
      data: outflowsData,
      error: outflowsError,
    } = await supabase
      .from("cash_outflows")
      .select("*")
      .eq(
        "cash_register_id",
        cash.id
      )

    if (outflowsError) {
      console.error(
        "ERRO AO CARREGAR SAÍDAS DO CAIXA FECHADO:",
        outflowsError
      )
    }

    const totalSaidas =
      (
        outflowsData || []
      ).reduce(
        (
          total: number,
          outflow: any
        ) =>
          total +
          Number(
            outflow.amount ||
              0
          ),
        0
      )

    const saldoFinal =
      Number(
        cash.opening_amount ||
          0
      ) +
      totalRecebido -
      totalSaidas

    setClosedCashDetails({
      recebidoHistorico:
        totalRecebido,

      fretesHistorico:
        totalFretes,

      lucroHistorico:
        lucroHistorico,

      saldoFinal:
        saldoFinal,
    })
  }

  /*
  ============================================================
  CARREGA CAIXA, VENDAS E SAÍDAS
  ============================================================
  */

  async function loadData() {
    setLoading(true)

    const {
      data: cashData,
      error: cashError,
    } = await supabase
      .from("cash_registers")
      .select("*")
      .eq(
        "status",
        "Aberto"
      )
      .order(
        "opened_at",
        {
          ascending: false,
        }
      )
      .limit(1)

    if (cashError) {
      console.error(
        "ERRO AO CARREGAR CAIXA:",
        cashError
      )
    }

    const currentCash =
      cashData &&
      cashData.length > 0
        ? cashData[0]
        : null

    setCashRegister(
      currentCash
    )

    if (!currentCash) {
      setSales([])
      setOutflows([])
      setLoading(false)
      return
    }

    const {
      data: normalSales,
      error: normalSalesError,
    } = await supabase
      .from("sales")
      .select("*")
      .gte(
        "date",
        currentCash.opened_at
      )
      .order(
        "date",
        {
          ascending: false,
        }
      )

    if (normalSalesError) {
      console.error(
        "ERRO AO CARREGAR VENDAS DO CAIXA:",
        normalSalesError
      )
    }

    const {
      data: oldFiados,
      error: oldFiadosError,
    } = await supabase
      .from("sales")
      .select("*")
      .eq(
        "status",
        "Pago"
      )
      .eq(
        "received_cash_register_id",
        currentCash.id
      )

    if (oldFiadosError) {
      console.error(
        "ERRO AO CARREGAR FIADOS RECEBIDOS:",
        oldFiadosError
      )
    }

    const {
      data: outflowsData,
      error: outflowsError,
    } = await supabase
      .from("cash_outflows")
      .select("*")
      .eq(
        "cash_register_id",
        currentCash.id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )

    if (outflowsError) {
      console.error(
        "ERRO AO CARREGAR SAÍDAS:",
        outflowsError
      )
    }

    const combinedSales = [
      ...(normalSales || []),
      ...(oldFiados || []),
    ]

    const uniqueSales =
      Array.from(
        new Map(
          combinedSales.map(
            (sale) => [
              sale.id,
              sale,
            ]
          )
        ).values()
      )

    setSales(
      uniqueSales.sort(
        (a, b) =>
          new Date(
            b.date
          ).getTime() -
          new Date(
            a.date
          ).getTime()
      )
    )

    setOutflows(
      outflowsData || []
    )

    setLoading(false)
  }

  /*
  ============================================================
  CARREGA AO ABRIR A PÁGINA
  ============================================================
  */

  useEffect(() => {
    loadData()
    loadClosedCashRegisters()
    loadStockConferenceHistory()

    const handleFocus = () => {
      loadData()
      loadClosedCashRegisters()
      loadStockConferenceHistory()
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

  /*
  ============================================================
  VENDAS PAGAS DO CAIXA
  ============================================================
  */

  const vendasDoCaixa =
    cashRegister
      ? sales.filter(
          (sale) => {
            if (!sale.date) {
              return false
            }

            const saleDate =
              new Date(
                sale.date
              )

            const openedAt =
              new Date(
                cashRegister.opened_at
              )

            return (
              sale.payment !==
                "Fiado" &&
              sale.status ===
                "Pago" &&
              saleDate >=
                openedAt
            )
          }
        )
      : []

  /*
  ============================================================
  RECEBIMENTOS DO CAIXA
  ============================================================
  */

  const recebimentosDoCaixa =
    cashRegister
      ? sales.filter(
          (sale) => {
            if (
              sale.status !==
              "Pago"
            ) {
              return false
            }

            if (
              sale.payment ===
                "Fiado" &&
              sale.received_cash_register_id !==
                null &&
              sale.received_cash_register_id !==
                undefined
            ) {
              return (
                String(
                  sale.received_cash_register_id
                ) ===
                String(
                  cashRegister.id
                )
              )
            }

            if (
              sale.payment ===
              "Fiado"
            ) {
              return false
            }

            if (!sale.date) {
              return false
            }

            const saleDate =
              new Date(
                sale.date
              )

            const openedAt =
              new Date(
                cashRegister.opened_at
              )

            return (
              saleDate >=
              openedAt
            )
          }
        )
      : []

  /*
  ============================================================
  FIADOS RECEBIDOS
  ============================================================
  */

  const fiadosRecebidos =
    cashRegister
      ? sales.filter(
          (sale) => {
            if (
              sale.payment !==
                "Fiado" ||
              sale.status !==
                "Pago"
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
              String(
                cashRegister.id
              )
            )
          }
        )
      : []

  /*
  ============================================================
  FIADOS PENDENTES
  ============================================================
  */

  const fiadosPendentes =
    cashRegister
      ? sales.filter(
          (sale) => {
            if (
              sale.payment !==
                "Fiado" ||
              sale.status !==
                "Pendente" ||
              !sale.date
            ) {
              return false
            }

            const saleDate =
              new Date(
                sale.date
              )

            const openedAt =
              new Date(
                cashRegister.opened_at
              )

            return (
              saleDate >=
              openedAt
            )
          }
        )
      : []

  /*
  ============================================================
  VALOR DOS PRODUTOS RECEBIDOS
  ============================================================
  */

  const getValorRecebido = (
    sale: any
  ) => {
    const valorProdutos =
      Number(
        sale.total || 0
      ) -
      Number(
        sale.delivery_fee || 0
      )

    if (
      sale.payment ===
      "Fiado"
    ) {
      if (
        sale.received_total !==
          null &&
        sale.received_total !==
          undefined
      ) {
        return Number(
          sale.received_total
        )
      }

      return Math.max(
        valorProdutos -
          Number(
            sale.discount || 0
          ),
        0
      )
    }

    if (
      sale.payment ===
      "Dinheiro"
    ) {
      if (
        sale.amount_received !==
          null &&
        sale.amount_received !==
          undefined &&
        Number(
          sale.amount_received
        ) > 0
      ) {
        return (
          Number(
            sale.amount_received
          ) -
          Number(
            sale.delivery_fee ||
              0
          )
        )
      }

      return valorProdutos
    }

    return valorProdutos
  }

  /*
  ============================================================
  LUCRO
  ============================================================
  */

  const calcularLucro = (
    sale: any
  ) => {
    if (
      sale.payment !==
      "Fiado"
    ) {
      return Number(
        sale.profit || 0
      )
    }

    if (
      !Array.isArray(
        sale.products
      )
    ) {
      return Number(
        sale.profit || 0
      )
    }

    const custoTotal =
      getCustoProdutos(
        sale
      )

    return (
      getValorRecebido(
        sale
      ) -
      custoTotal
    )
  }

  /*
  ============================================================
  DADOS FINANCEIROS
  ============================================================
  */

  const getDadosFinanceiros = (
    sale: any
  ) => {
    const custo =
      getCustoProdutos(
        sale
      )

    const frete =
      Number(
        sale.delivery_fee ||
          0
      )

    let lucro = 0

    if (
      sale.payment !==
      "Fiado"
    ) {
      lucro =
        Number(
          sale.profit || 0
        )
    } else {
      lucro =
        calcularLucro(
          sale
        )
    }

    return {
      custo,
      lucro,
      frete,
    }
  }

  /*
  ============================================================
  VALOR REALMENTE RECEBIDO
  ============================================================
  */

  const getValorRecebidoBruto = (
    sale: any
  ) => {
    if (
      sale.payment !==
      "Fiado"
    ) {
      return Number(
        sale.total || 0
      )
    }

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
  ============================================================
  VENDIDO
  ============================================================
  */

  const totalVendido =
    vendasDoCaixa.reduce(
      (
        total,
        sale
      ) =>
        total +
        getDadosFinanceiros(
          sale
        ).custo,
      0
    )

  /*
  ============================================================
  RECEBIDO
  ============================================================
  */

  const recebido =
    recebimentosDoCaixa.reduce(
      (
        total,
        sale
      ) =>
        total +
        getDadosFinanceiros(
          sale
        ).custo,
      0
    )

  /*
  ============================================================
  FRETES
  ============================================================
  */

  const totalFretes =
    recebimentosDoCaixa.reduce(
      (
        total,
        sale
      ) =>
        total +
        getDadosFinanceiros(
          sale
        ).frete,
      0
    )

  /*
  ============================================================
  LUCRO
  ============================================================
  */

  const lucroTotal =
    recebimentosDoCaixa.reduce(
      (
        total,
        sale
      ) =>
        total +
        getDadosFinanceiros(
          sale
        ).lucro,
      0
    )

  /*
  ============================================================
  TOTAL RECEBIDO NO PERÍODO
  ============================================================
  */

  const totalRecebidoPeriodo =
    recebimentosDoCaixa.reduce(
      (
        total,
        sale
      ) =>
        total +
        getValorRecebidoBruto(
          sale
        ),
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
  FIADO PENDENTE
  ============================================================
  */

  const fiado =
    fiadosPendentes.reduce(
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
  DINHEIRO
  ============================================================
  */

  const dinheiroVendas =
    recebimentosDoCaixa
      .filter(
        (sale) =>
          sale.payment ===
            "Dinheiro" ||
          (
            sale.payment ===
              "Fiado" &&
            sale.received_payment ===
              "Dinheiro"
          )
      )
      .reduce(
        (
          total,
          sale
        ) =>
          total +
          getValorRecebidoBruto(
            sale
          ),
        0
      )

  /*
  ============================================================
  TROCO DINHEIRO
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
        (
          total,
          sale
        ) =>
          total +
          Number(
            sale.change_amount ||
              0
          ),
        0
      )

  /*
  ============================================================
  TROCO PIX
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
        (
          total,
          sale
        ) =>
          total +
          Number(
            sale.change_amount ||
              0
          ),
        0
      )

  /*
  ============================================================
  SAÍDAS
  ============================================================
  */

  const totalSaidas =
    outflows.reduce(
      (
        total,
        outflow
      ) =>
        total +
        Number(
          outflow.amount ||
            0
        ),
      0
    )

  const totalSaidasDinheiro =
    outflows
      .filter(
        (outflow) =>
          outflow.payment_method ===
          "Dinheiro"
      )
      .reduce(
        (
          total,
          outflow
        ) =>
          total +
          Number(
            outflow.amount ||
              0
          ),
        0
      )

  const totalSaidasPix =
    outflows
      .filter(
        (outflow) =>
          outflow.payment_method ===
          "Pix"
      )
      .reduce(
        (
          total,
          outflow
        ) =>
          total +
          Number(
            outflow.amount ||
              0
          ),
        0
      )

  const totalDespesas =
    outflows
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
            outflow.amount ||
              0
          ),
        0
      )

  /*
  ============================================================
  SALDO DISPONÍVEL
  ============================================================
  */

  const saldoDisponivel =
    Number(
      cashRegister?.opening_amount ||
        0
    ) +
    totalRecebidoPeriodo -
    totalSaidas

  /*
  ============================================================
  LUCRO DISPONÍVEL
  ============================================================
  */

  const lucroDisponivel =
    lucroTotal -
    totalDespesas

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
    trocoDinheiro -
    totalSaidasDinheiro

  /*
  ============================================================
  PIX
  ============================================================
  */

  const pixVendas =
    recebimentosDoCaixa
      .filter(
        (sale) =>
          sale.payment ===
            "Pix" ||
          (
            sale.payment ===
              "Fiado" &&
            sale.received_payment ===
              "Pix"
          )
      )
      .reduce(
        (
          total,
          sale
        ) =>
          total +
          getValorRecebidoBruto(
            sale
          ),
        0
      )

  const pix =
    pixVendas -
    trocoPix -
    totalSaidasPix

  /*
  ============================================================
  DÉBITO
  ============================================================
  */

  const debito =
    recebimentosDoCaixa
      .filter(
        (sale) =>
          sale.payment ===
            "Débito" ||
          (
            sale.payment ===
              "Fiado" &&
            sale.received_payment ===
              "Débito"
          )
      )
      .reduce(
        (
          total,
          sale
        ) =>
          total +
          getValorRecebidoBruto(
            sale
          ),
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
          sale.payment ===
            "Crédito" ||
          (
            sale.payment ===
              "Fiado" &&
            sale.received_payment ===
              "Crédito"
          )
      )
      .reduce(
        (
          total,
          sale
        ) =>
          total +
          getValorRecebidoBruto(
            sale
          ),
        0
      )

  /*
  ============================================================
  PREPARA CONFERÊNCIA DE ESTOQUE
  ============================================================
  */

  async function prepararConferenciaEstoque() {
    setLoadingStockConference(true)

    const {
      data,
      error,
    } = await supabase
      .from("products")
      .select(
  "id, name, flavor, volume, stock"
)
  
      .order(
        "name",
        {
          ascending: true,
        }
      )

    if (error) {
      console.error(
        "ERRO AO CARREGAR ESTOQUE PARA CONFERÊNCIA:",
        error
      )

      setLoadingStockConference(false)

      alert(
        `Não foi possível carregar o estoque.\n\n${error.message}`
      )

      return
    }

    const products =
      data || []

    if (
      products.length ===
      0
    ) {
      setLoadingStockConference(false)

      alert(
        "Nenhum produto cadastrado para conferir."
      )

      return
    }

    const initialCountedStock:
      Record<number, string> = {}

    products.forEach(
      (product: any) => {
        initialCountedStock[
          product.id
        ] = ""
      }
    )

    setStockProducts(
      products
    )

    setCountedStock(
      initialCountedStock
    )

    setLoadingStockConference(false)

    setShowStockConference(
      true
    )
  }

  /*
  ============================================================
  CONFIRMA CONFERÊNCIA E ABRE CAIXA
  ============================================================
  */

  async function confirmarConferenciaEAbrir() {
    if (
      stockProducts.length ===
      0
    ) {
      alert(
        "Nenhum produto foi carregado para a conferência."
      )

      return
    }

    /*
    ------------------------------------------------------------
    VALIDA QUANTIDADES
    ------------------------------------------------------------
    */

    for (
      const product of stockProducts
    ) {
      const value =
        countedStock[
          product.id
        ]

      if (
        value ===
          undefined ||
        value ===
          ""
      ) {
        alert(
          `Informe a quantidade contada de:\n${product.name}`
        )

        return
      }

      const quantidade =
        Number(
          String(
            value
          ).replace(
            ",",
            "."
          )
        )

      if (
        isNaN(
          quantidade
        ) ||
        quantidade < 0
      ) {
        alert(
          `Quantidade inválida para:\n${product.name}`
        )

        return
      }
    }

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

    setOpeningStock(
      true
    )

    /*
    ------------------------------------------------------------
    ABRE O CAIXA
    ------------------------------------------------------------
    */

    const {
      data: cashData,
      error: cashError,
    } = await supabase
      .from(
        "cash_registers"
      )
      .insert({
        name:
          cashName.trim() ||
          null,

        opening_amount:
          valor,

        status:
          "Aberto",

        opened_at:
          new Date().toISOString(),
      })
      .select()

    if (cashError) {
      console.error(
        "ERRO AO ABRIR CAIXA:",
        cashError
      )

      alert(
        `Não foi possível abrir o caixa.\n\n${cashError.message}`
      )

      setOpeningStock(
        false
      )

      return
    }

    const novoCaixa =
      cashData?.[0]

    if (!novoCaixa) {
      alert(
        "O caixa não foi criado."
      )

      setOpeningStock(
        false
      )

      return
    }

    /*
    ------------------------------------------------------------
    CONFERÊNCIA DE CADA PRODUTO
    ------------------------------------------------------------
    */

    for (
      const product of stockProducts
    ) {
      const estoqueAnterior =
        Number(
          product.stock ||
            0
        )

      const estoqueContado =
        Number(
          String(
            countedStock[
              product.id
            ]
          ).replace(
            ",",
            "."
          )
        )

      const diferenca =
        estoqueContado -
        estoqueAnterior

      /*
      ------------------------------------------------------------
      ATUALIZA ESTOQUE
      ------------------------------------------------------------
      */

      const {
        error:
          stockError,
      } = await supabase
        .from(
          "products"
        )
        .update({
          stock:
            estoqueContado,
        })
        .eq(
          "id",
          product.id
        )

      if (stockError) {
        console.error(
          "ERRO AO AJUSTAR ESTOQUE:",
          stockError
        )

        alert(
          `O caixa foi aberto, mas houve erro ao ajustar o estoque de:\n${product.name}\n\n${stockError.message}`
        )

        setOpeningStock(
          false
        )

        await loadData()

        return
      }

      /*
      ------------------------------------------------------------
      SALVA TODA CONFERÊNCIA
      ------------------------------------------------------------
      */

      const {
        error:
          conferenceError,
      } = await supabase
        .from(
          "stock_conferences"
        )
        .insert({
          cash_register_id:
            novoCaixa.id,

          product_id:
            product.id,

          product_name:
            product.name,

          system_stock:
            estoqueAnterior,

          counted_stock:
            estoqueContado,

          difference:
            diferenca,

          created_at:
            new Date().toISOString(),
        })

      if (
        conferenceError
      ) {
        console.error(
          "ERRO AO SALVAR CONFERÊNCIA:",
          conferenceError
        )
      }

      /*
      ------------------------------------------------------------
      SEM DIFERENÇA
      NÃO CRIA MOVIMENTAÇÃO NORMAL
      ------------------------------------------------------------
      */

      if (
        diferenca ===
        0
      ) {
        continue
      }

      /*
      ------------------------------------------------------------
      DEFINE ENTRADA OU SAÍDA
      ------------------------------------------------------------
      */

      const tipoMovimento =
        diferenca > 0
          ? "Entrada"
          : "Saída"

      /*
      ------------------------------------------------------------
      REGISTRA MOVIMENTAÇÃO
      ------------------------------------------------------------
      */

      const {
        error:
          movementError,
      } = await supabase
        .from(
          "stock_movements"
        )
        .insert({
          product_id:
            product.id,

          product_name:
            product.name,

          type:
            tipoMovimento,

          quantity:
            Math.abs(
              diferenca
            ),

          previous_stock:
            estoqueAnterior,

          current_stock:
            estoqueContado,

          date:
            new Date().toISOString(),

          observation:
            `Conferência de estoque na abertura do caixa ${
              cashName.trim() ||
              novoCaixa.id
            }`,
        })

      if (
        movementError
      ) {
        console.error(
          "ERRO AO REGISTRAR MOVIMENTAÇÃO:",
          movementError
        )
      }
    }

    /*
    ------------------------------------------------------------
    FINALIZA ABERTURA
    ------------------------------------------------------------
    */

    setCashRegister(
      novoCaixa
    )

    setOpeningAmount("")
    setCashName("")

    setCountedStock({})
    setStockProducts([])

    setShowStockConference(
      false
    )

    setShowOpenModal(
      false
    )

    setOpeningStock(
      false
    )

    await loadData()
    await loadStockConferenceHistory()

    alert(
      "Caixa aberto e estoque conferido com sucesso!"
    )
  }

  /*
  ============================================================
  ADICIONAR SAÍDA
  ============================================================
  */

  async function adicionarSaida() {
    if (!cashRegister) {
      alert(
        "Não existe um caixa aberto."
      )

      return
    }

    const valor =
      Number(
        String(
          outflowAmount
        ).replace(
          ",",
          "."
        )
      )

    if (
      isNaN(valor) ||
      valor <= 0
    ) {
      alert(
        "Informe um valor válido."
      )

      return
    }

    if (
      !outflowDescription.trim()
    ) {
      alert(
        "Informe uma descrição para a saída."
      )

      return
    }

    setSavingOutflow(
      true
    )

    const {
      data,
      error,
    } = await supabase
      .from(
        "cash_outflows"
      )
      .insert({
        cash_register_id:
          cashRegister.id,

        amount:
          valor,

        type:
          outflowType,

        payment_method:
          outflowPaymentMethod,

        description:
          outflowDescription.trim(),

        created_at:
          new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error(
        "ERRO AO REGISTRAR SAÍDA:",
        error
      )

      alert(
        `Não foi possível registrar a saída.\n\n${error.message}`
      )

      setSavingOutflow(
        false
      )

      return
    }

    if (
      data &&
      data.length >
        0
    ) {
      setOutflows([
        data[0],
        ...outflows,
      ])
    }

    setOutflowAmount("")
    setOutflowType(
      "Compra/Reposição de estoque"
    )
    setOutflowPaymentMethod(
      "Pix"
    )
    setOutflowDescription("")
    setShowOutflowModal(
      false
    )
    setSavingOutflow(
      false
    )

    alert(
      "Saída registrada com sucesso!"
    )
  }

  /*
  ============================================================
  EXCLUIR SAÍDA
  ============================================================
  */

  async function excluirSaida(
    id: number
  ) {
    const confirmacao =
      window.confirm(
        "Tem certeza que deseja excluir esta saída?"
      )

    if (
      !confirmacao
    ) {
      return
    }

    const {
      error,
    } = await supabase
      .from(
        "cash_outflows"
      )
      .delete()
      .eq(
        "id",
        id
      )

    if (error) {
      console.error(
        "ERRO AO EXCLUIR SAÍDA:",
        error
      )

      alert(
        `Não foi possível excluir a saída.\n\n${error.message}`
      )

      return
    }

    setOutflows(
      outflows.filter(
        (outflow) =>
          outflow.id !==
          id
      )
    )

    alert(
      "Saída excluída com sucesso!"
    )
  }

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

    if (
      cashRegister
    ) {
      alert(
        "Já existe um caixa aberto."
      )

      return
    }

    await prepararConferenciaEstoque()
  }

  /*
  ============================================================
  FECHAR CAIXA
  ============================================================
  */

  async function fecharCaixa() {
    if (
      !cashRegister
    ) {
      alert(
        "Não existe um caixa aberto."
      )

      return
    }

    if (
      countedCash ===
      ""
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
      dinheiroContado <
        0
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
      totalRecebidoPeriodo

    setClosing(
      true
    )

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

      setClosing(
        false
      )

      return
    }

    if (
      !data ||
      data.length ===
        0
    ) {
      alert(
        "O caixa não foi atualizado."
      )

      setClosing(
        false
      )

      return
    }

    setCashRegister(
      null
    )

    setSales([])

    setOutflows([])

    setCountedCash("")

    setShowCloseModal(
      false
    )

    setClosing(
      false
    )

    await loadClosedCashRegisters()

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

              {cashRegister.name && (
                <p className="text-gray-600 mt-1">
                  Nome:{" "}
                  <strong>
                    {cashRegister.name}
                  </strong>
                </p>
              )}

              <p className="text-gray-600 mt-1">
                Dinheiro inicial:{" "}
                <strong>
                  R${" "}
                  {Number(
                    cashRegister.opening_amount ||
                      0
                  ).toFixed(
                    2
                  )}
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

      <div className="grid grid-cols-2 xl:grid-cols-8 gap-6 mt-8">

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            💰 Vendido
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Custo dos produtos das vendas pagas neste caixa.
          </p>

          <h2 className="text-2xl font-bold mt-2">
            R${" "}
            {totalVendido.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            💵 Recebido
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Custo dos produtos que realmente foram recebidos.
          </p>

          <h2 className="text-2xl font-bold text-green-600 mt-2">
            R${" "}
            {recebido.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            🚚 Fretes
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Fretes realmente recebidos neste caixa.
          </p>

          <h2 className="text-2xl font-bold mt-2">
            R${" "}
            {totalFretes.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            📈 Lucro
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Lucro das vendas recebidas, já descontando descontos.
          </p>

          <h2 className="text-2xl font-bold text-green-700 mt-2">
            R${" "}
            {lucroTotal.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            🛒 Vendas
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Quantidade de vendas pagas realizadas neste caixa.
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {quantidadeVendas}
          </h2>

        </div>

        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow">

          <p className="text-blue-700 font-semibold">
            💳 Total recebido no período
          </p>

          <p className="text-sm text-blue-600 mt-1">
            Valor realmente recebido pelas vendas e pelos fiados pagos neste caixa.
          </p>

          <h2 className="text-2xl font-bold text-blue-800 mt-2">
            R${" "}
            {totalRecebidoPeriodo.toFixed(
              2
            )}
          </h2>

        </div>

        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow">

          <p className="text-red-700 font-semibold">
            💸 Saídas
          </p>

          <p className="text-sm text-red-600 mt-1">
            Total retirado deste caixa.
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
            💰 Saldo disponível
          </p>

          <p className="text-sm text-purple-600 mt-1">
            Inicial + recebido - saídas.
          </p>

          <h2 className="text-2xl font-bold text-purple-800 mt-2">
            R${" "}
            {saldoDisponivel.toFixed(
              2
            )}
          </h2>

        </div>

      </div>

      {/* LUCRO DISPONÍVEL */}

      <div className="mt-6 bg-green-50 border border-green-200 p-5 rounded-xl">

        <div className="flex justify-between items-center gap-4">

          <div>

            <p className="text-green-700 font-bold">
              📈 Lucro disponível para guardar
            </p>

            <p className="text-sm text-green-600 mt-1">
              Lucro das vendas menos as saídas classificadas como despesa.
            </p>

          </div>

          <strong className="text-green-700 text-2xl">
            R${" "}
            {lucroDisponivel.toFixed(
              2
            )}
          </strong>

        </div>

      </div>

      {/* FIADO PENDENTE */}

      <div className="mt-6 bg-red-50 border border-red-200 p-5 rounded-xl">

        <div className="flex justify-between items-center gap-4">

          <div>

            <p className="text-red-700 font-bold">
              📝 Fiado pendente
            </p>

            <p className="text-sm text-red-600 mt-1">
              Vendas fiadas deste caixa que ainda não foram recebidas.
            </p>

          </div>

          <strong className="text-red-700 text-xl">
            R${" "}
            {fiado.toFixed(
              2
            )}
          </strong>

        </div>

      </div>

      {/* BOTÕES */}

      <div className="mt-8 flex flex-wrap gap-3">

        <button
          onClick={() =>
            setShowDiagnostico(
              !showDiagnostico
            )
          }
          className="border border-yellow-400 bg-yellow-50 text-yellow-800 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-100"
        >
          {showDiagnostico
            ? "✕ Fechar diagnóstico"
            : "🔎 Ver diagnóstico do total recebido"}
        </button>

        <button
          onClick={() =>
            setShowSaidas(
              !showSaidas
            )
          }
          className="border border-red-400 bg-red-50 text-red-800 px-4 py-2 rounded-lg font-semibold hover:bg-red-100"
        >
          {showSaidas
            ? "✕ Fechar histórico de saídas"
            : "💸 Ver histórico de saídas"}
        </button>

        <button
          onClick={() =>
            setShowClosedHistory(
              !showClosedHistory
            )
          }
          className="border border-blue-400 bg-blue-50 text-blue-800 px-4 py-2 rounded-lg font-semibold hover:bg-blue-100"
        >
          {showClosedHistory
            ? "✕ Fechar histórico de caixas"
            : "📚 Histórico de caixas fechados"}
        </button>

        <button
          onClick={() =>
            setShowConferenceHistory(
              !showConferenceHistory
            )
          }
          className="border border-purple-400 bg-purple-50 text-purple-800 px-4 py-2 rounded-lg font-semibold hover:bg-purple-100"
        >
          {showConferenceHistory
            ? "✕ Fechar histórico de conferências"
            : "📦 Histórico de conferências"}
        </button>

        <button
          onClick={() =>
            setShowOutflowModal(
              true
            )
          }
          disabled={
            !cashRegister
          }
          className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50"
        >
          ➕ Adicionar saída
        </button>

      </div>

      {/* HISTÓRICO DE CONFERÊNCIAS */}

      {showConferenceHistory && (
        <div className="mt-4 bg-purple-50 border border-purple-300 p-6 rounded-xl shadow">

          <h2 className="font-bold text-lg text-purple-800">
            📦 Histórico de conferências de estoque
          </h2>

          <p className="text-sm text-purple-700 mt-1">
            Conferências realizadas na abertura dos caixas.
          </p>

          <div className="mt-5 space-y-4">

            {stockConferenceHistory.length ===
            0 ? (

              <p className="text-gray-600">
                Nenhuma conferência registrada.
              </p>

            ) : (

              stockConferenceHistory.map(
                (item) => {

                  const diferenca =
                    Number(
                      item.difference ||
                        0
                    )

                  return (
                    <div
                      key={
                        item.id
                      }
                      className="bg-white border rounded-xl p-4"
                    >

                      <div className="flex justify-between items-start gap-4">

                        <div>

                          <p className="font-bold text-lg">
                            {item.product_name}
                          </p>

                          <p className="text-gray-500 text-sm mt-1">
                            Caixa:{" "}
                            {item.cash_register_id}
                          </p>

                          <p className="text-gray-500 text-sm">
                            Data:{" "}
                            {formatDate(
                              item.created_at
                            )}
                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-xs text-gray-500">
                            Diferença
                          </p>

                          <p
                            className={
                              diferenca ===
                                0
                                ? "font-bold text-green-600 text-lg"
                                : diferenca >
                                  0
                                ? "font-bold text-blue-600 text-lg"
                                : "font-bold text-red-600 text-lg"
                            }
                          >
                            {diferenca >
                            0
                              ? "+"
                              : ""}
                            {diferenca}
                          </p>

                        </div>

                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">

                        <div className="bg-gray-50 rounded-lg p-3">

                          <p className="text-xs text-gray-500">
                            Estoque no sistema
                          </p>

                          <p className="font-bold">
                            {Number(
                              item.system_stock
                            )}
                          </p>

                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">

                          <p className="text-xs text-gray-500">
                            Quantidade contada
                          </p>

                          <p className="font-bold">
                            {Number(
                              item.counted_stock
                            )}
                          </p>

                        </div>

                        <div
                          className={
                            diferenca ===
                              0
                              ? "bg-green-50 rounded-lg p-3"
                              : diferenca >
                                0
                              ? "bg-blue-50 rounded-lg p-3"
                              : "bg-red-50 rounded-lg p-3"
                          }
                        >

                          <p className="text-xs text-gray-500">
                            Diferença
                          </p>

                          <p className="font-bold">
                            {diferenca >
                            0
                              ? "+"
                              : ""}
                            {diferenca}
                          </p>

                        </div>

                      </div>

                    </div>
                  )
                }
              )

            )}

          </div>

        </div>
      )}

      {/* HISTÓRICO DE CAIXAS */}

      {showClosedHistory && (
        <div className="mt-4 bg-blue-50 border border-blue-300 p-6 rounded-xl shadow">

          <h2 className="font-bold text-lg text-blue-800">
            📚 Histórico de caixas fechados
          </h2>

          <p className="text-sm text-blue-700 mt-1">
            Consulte os fechamentos anteriores.
          </p>

          <div className="mt-5 space-y-3">

            {closedCashRegisters.length ===
            0 ? (

              <p className="text-gray-600">
                Nenhum caixa fechado encontrado.
              </p>

            ) : (

              closedCashRegisters.map(
                (closedCash) => (

                  <div
                    key={
                      closedCash.id
                    }
                    className="bg-white border rounded-lg p-4"
                  >

                    <div className="flex justify-between items-center gap-4">

                      <div>

                        <p className="font-bold text-lg">
                          {closedCash.name ||
                            `Caixa #${closedCash.id}`}
                        </p>

                        <p className="text-gray-500 text-sm">
                          Aberto:{" "}
                          {formatDate(
                            closedCash.opened_at
                          )}
                        </p>

                        <p className="text-gray-500 text-sm">
                          Fechado:{" "}
                          {formatDate(
                            closedCash.closed_at
                          )}
                        </p>

                      </div>

                      <button
                        onClick={() => {

                          setSelectedClosedCash(
                            closedCash
                          )

                          setClosedCashDetails(
                            null
                          )

                          carregarDetalhesCaixaFechado(
                            closedCash
                          )

                        }}
                        className="bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                      >
                        👁 Ver detalhes
                      </button>

                    </div>

                  </div>

                )
              )

            )}

          </div>

        </div>
      )}

      {/* DIAGNÓSTICO */}

      {showDiagnostico && (
        <div className="mt-4 bg-yellow-50 border border-yellow-300 p-6 rounded-xl shadow">

          <h2 className="font-bold text-lg text-yellow-800">
            🔎 Diagnóstico do total recebido
          </h2>

          <p className="text-sm text-yellow-700 mt-1">
            Aqui você consegue conferir exatamente quais valores estão entrando no total recebido.
          </p>

          <div className="mt-4 space-y-3">

            {recebimentosDoCaixa.map(
              (
                sale,
                index
              ) => {

                const custo =
                  getCustoProdutos(
                    sale
                  )

                const frete =
                  Number(
                    sale.delivery_fee ||
                      0
                  )

                const valorProdutos =
                  Number(
                    sale.total ||
                      0
                  ) -
                  frete

                const valorUsadoNoTotal =
                  getValorRecebidoBruto(
                    sale
                  )

                const dados =
                  getDadosFinanceiros(
                    sale
                  )

                return (
                  <div
                    key={`${sale.id}-${index}`}
                    className="bg-white border rounded-lg p-4"
                  >

                    <div className="flex justify-between items-start gap-4">

                      <div>

                        <p className="font-bold">
                          #{index + 1} —
                          Venda ID:{" "}
                          {sale.id}
                        </p>

                        <p className="text-gray-600">
                          Tipo:{" "}
                          {sale.payment ===
                          "Fiado"
                            ? "Fiado recebido"
                            : "Venda normal"}
                        </p>

                        <p className="text-gray-600">
                          Cliente:{" "}
                          {sale.customer ||
                            "Não informado"}
                        </p>

                        <p className="text-gray-600">
                          Pagamento:{" "}
                          {sale.received_payment ||
                            sale.payment}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-xs text-gray-500">
                          Entra no total
                        </p>

                        <p className="text-xl font-bold text-yellow-800">
                          R${" "}
                          {valorUsadoNoTotal.toFixed(
                            2
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">

                      <div className="bg-gray-50 p-3 rounded">

                        <p className="text-xs text-gray-500">
                          sale.total
                        </p>

                        <p className="font-bold">
                          R${" "}
                          {Number(
                            sale.total ||
                              0
                          ).toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="bg-gray-50 p-3 rounded">

                        <p className="text-xs text-gray-500">
                          Frete
                        </p>

                        <p className="font-bold">
                          R${" "}
                          {frete.toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="bg-gray-50 p-3 rounded">

                        <p className="text-xs text-gray-500">
                          Produtos
                        </p>

                        <p className="font-bold">
                          R${" "}
                          {valorProdutos.toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="bg-gray-50 p-3 rounded">

                        <p className="text-xs text-gray-500">
                          Custo
                        </p>

                        <p className="font-bold">
                          R${" "}
                          {custo.toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="bg-gray-50 p-3 rounded">

                        <p className="text-xs text-gray-500">
                          Lucro
                        </p>

                        <p className="font-bold text-green-700">
                          R${" "}
                          {dados.lucro.toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="bg-yellow-100 p-3 rounded border border-yellow-300">

                        <p className="text-xs text-yellow-700">
                          Entra no total
                        </p>

                        <p className="font-bold text-yellow-900">
                          R${" "}
                          {valorUsadoNoTotal.toFixed(
                            2
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="mt-3 text-sm text-gray-500 space-y-1">

                      <p>
                        received_total:{" "}
                        {sale.received_total !==
                          null &&
                        sale.received_total !==
                          undefined
                          ? `R$ ${Number(
                              sale.received_total
                            ).toFixed(
                              2
                            )}`
                          : "não informado"}
                      </p>

                      <p>
                        amount_received:{" "}
                        {sale.amount_received !==
                          null &&
                        sale.amount_received !==
                          undefined
                          ? `R$ ${Number(
                              sale.amount_received
                            ).toFixed(
                              2
                            )}`
                          : "não informado"}
                      </p>

                      <p>
                        discount: R${" "}
                        {Number(
                          sale.discount ||
                            0
                        ).toFixed(
                          2
                        )}
                      </p>

                      <p>
                        delivery_fee: R${" "}
                        {Number(
                          sale.delivery_fee ||
                            0
                        ).toFixed(
                          2
                        )}
                      </p>

                    </div>

                  </div>
                )
              }
            )}

            <div className="border-t-2 border-yellow-400 pt-4 mt-4">

              <div className="flex justify-between font-bold text-lg">

                <span>
                  Soma calculada pelo sistema:
                </span>

                <span>
                  R${" "}
                  {recebimentosDoCaixa
                    .reduce(
                      (
                        total,
                        sale
                      ) =>
                        total +
                        getValorRecebidoBruto(
                          sale
                        ),
                      0
                    )
                    .toFixed(
                      2
                    )}
                </span>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* HISTÓRICO DE SAÍDAS */}

      {showSaidas && (
        <div className="mt-4 bg-red-50 border border-red-300 p-6 rounded-xl shadow">

          <div className="flex justify-between items-center gap-4">

            <div>

              <h2 className="font-bold text-lg text-red-800">
                💸 Histórico de saídas
              </h2>

              <p className="text-sm text-red-700 mt-1">
                Todas as saídas registradas neste caixa.
              </p>

            </div>

            <button
              onClick={() =>
                setShowOutflowModal(
                  true
                )
              }
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              ➕ Nova saída
            </button>

          </div>

          <div className="mt-5 space-y-3">

            {outflows.length ===
            0 ? (

              <p className="text-gray-600">
                Nenhuma saída registrada neste caixa.
              </p>

            ) : (

              outflows.map(
                (outflow) => (

                  <div
                    key={
                      outflow.id
                    }
                    className="bg-white border rounded-lg p-4"
                  >

                    <div className="flex justify-between gap-4">

                      <div>

                        <p className="font-bold">
                          {outflow.description}
                        </p>

                        <p className="text-gray-500 text-sm mt-1">
                          {outflow.type}
                        </p>

                        <p className="text-gray-500 text-sm">
                          Pagamento:{" "}
                          {outflow.payment_method}
                        </p>

                        <p className="text-gray-500 text-sm">
                          {formatDate(
                            outflow.created_at
                          )}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="font-bold text-red-700 text-lg">
                          - R${" "}
                          {Number(
                            outflow.amount ||
                              0
                          ).toFixed(
                            2
                          )}
                        </p>

                        <button
                          onClick={() =>
                            excluirSaida(
                              outflow.id
                            )
                          }
                          className="text-red-600 text-sm mt-2 hover:underline"
                        >
                          🗑 Excluir
                        </button>

                      </div>

                    </div>

                  </div>

                )
              )

            )}

            <div className="border-t-2 border-red-300 pt-4 mt-4 flex justify-between font-bold text-lg">

              <span>
                Total de saídas
              </span>

              <span className="text-red-700">
                R${" "}
                {totalSaidas.toFixed(
                  2
                )}
              </span>

            </div>

          </div>

        </div>
      )}

      {/* FORMAS DE PAGAMENTO */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold text-lg">
          Formas de pagamento
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Aqui mostramos o valor realmente movimentado por cada forma de pagamento.
        </p>

        <div className="mt-4 space-y-3">

          <p>
            💵 Dinheiro:
            <b>
              {" "}
              R${" "}
              {(
                dinheiroVendas -
                trocoDinheiro
              ).toFixed(
                2
              )}
            </b>
          </p>

          <p>
            📱 Pix:
            <b>
              {" "}
              R${" "}
              {pix.toFixed(
                2
              )}
            </b>
          </p>

          <p>
            💳 Débito:
            <b>
              {" "}
              R${" "}
              {debito.toFixed(
                2
              )}
            </b>
          </p>

          <p>
            💳 Crédito:
            <b>
              {" "}
              R${" "}
              {credito.toFixed(
                2
              )}
            </b>
          </p>

          <p>
            🔄 Trocos em dinheiro:
            <b>
              {" "}
              R${" "}
              {trocoDinheiro.toFixed(
                2
              )}
            </b>
          </p>

          <p>
            📱 Trocos via Pix:
            <b>
              {" "}
              R${" "}
              {trocoPix.toFixed(
                2
              )}
            </b>
          </p>

          <div className="border-t pt-3">

            <div className="flex justify-between">

              <span>
                Custo dos produtos
              </span>

              <strong>
                R${" "}
                {recebido.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="flex justify-between mt-2">

              <span>
                Lucro
              </span>

              <strong>
                R${" "}
                {lucroTotal.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="flex justify-between mt-2">

              <span>
                Fretes
              </span>

              <strong>
                R${" "}
                {totalFretes.toFixed(
                  2
                )}
              </strong>

            </div>

            <div className="border-t mt-3 pt-3 flex justify-between font-bold">

              <span>
                💳 Total recebido no período
              </span>

              <strong className="text-blue-700">
                R${" "}
                {totalRecebidoPeriodo.toFixed(
                  2
                )}
              </strong>

            </div>

          </div>

        </div>

      </div>

      {/* FIADOS RECEBIDOS */}

      {fiadosRecebidos.length >
        0 && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow">

          <h2 className="font-bold text-lg">
            💰 Fiados recebidos neste caixa
          </h2>

          <div className="mt-4 space-y-3">

            {fiadosRecebidos.map(
              (sale) => {

                const custo =
                  getCustoProdutos(
                    sale
                  )

                const valorRecebido =
                  getValorRecebido(
                    sale
                  )

                const lucro =
                  calcularLucro(
                    sale
                  )

                const frete =
                  Number(
                    sale.delivery_fee ||
                      0
                  )

                return (
                  <div
                    key={`fiado-${sale.id}`}
                    className="border rounded-lg p-4"
                  >

                    <div className="flex justify-between gap-4">

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
                          {sale.received_payment ||
                            sale.payment}
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="font-bold text-green-700">
                          Total recebido: R${" "}
                          {valorRecebido.toFixed(
                            2
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-4">

                      <div className="bg-gray-50 rounded-lg p-3">

                        <p className="text-xs text-gray-500">
                          Custo
                        </p>

                        <p className="font-bold">
                          R${" "}
                          {custo.toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">

                        <p className="text-xs text-gray-500">
                          Frete
                        </p>

                        <p className="font-bold">
                          R${" "}
                          {frete.toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="bg-green-50 rounded-lg p-3">

                        <p className="text-xs text-gray-500">
                          Lucro
                        </p>

                        <p className="font-bold text-green-700">
                          R${" "}
                          {lucro.toFixed(
                            2
                          )}
                        </p>

                      </div>

                      <div className="bg-blue-50 rounded-lg p-3">

                        <p className="text-xs text-gray-500">
                          Total
                        </p>

                        <p className="font-bold text-blue-700">
                          R${" "}
                          {(
                            valorRecebido +
                            frete
                          ).toFixed(
                            2
                          )}
                        </p>

                      </div>

                    </div>

                    {Number(
                      sale.discount ||
                        0
                    ) > 0 && (
                      <p className="text-red-600 text-sm mt-3">
                        Desconto aplicado: R${" "}
                        {Number(
                          sale.discount
                        ).toFixed(
                          2
                        )}
                      </p>
                    )}

                  </div>
                )
              }
            )}

          </div>

        </div>
      )}

      {/* ÚLTIMAS VENDAS */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold text-lg">
          Últimas vendas
        </h2>

        <div className="mt-4 space-y-3">

          {vendasDoCaixa
            .slice(
              0,
              5
            )
            .map(
              (sale) => {

                const dados =
                  getDadosFinanceiros(
                    sale
                  )

                return (
                  <div
                    key={
                      sale.id
                    }
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
                        Pagamento:{" "}
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
                        Venda: R${" "}
                        {Number(
                          sale.total ||
                            0
                        ).toFixed(
                          2
                        )}
                      </p>

                      <p className="text-gray-500 text-sm">
                        Custo: R${" "}
                        {dados.custo.toFixed(
                          2
                        )}
                      </p>

                      <p className="text-green-600 text-sm">
                        Lucro: R${" "}
                        {dados.lucro.toFixed(
                          2
                        )}
                      </p>

                      {Number(
                        sale.delivery_fee ||
                          0
                      ) >
                        0 && (
                        <p className="text-gray-500 text-sm">
                          Frete: R${" "}
                          {Number(
                            sale.delivery_fee
                          ).toFixed(
                            2
                          )}
                        </p>
                      )}

                    </div>

                  </div>
                )
              }
            )}

          {vendasDoCaixa.length ===
            0 && (
            <p className="text-gray-500">
              Nenhuma venda registrada neste caixa.
            </p>
          )}

        </div>

      </div>

      {/* DETALHES DO CAIXA FECHADO */}

      {selectedClosedCash && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">

            <div className="p-6 border-b flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold">
                  📚 Detalhes do caixa
                </h2>

                <p className="text-gray-500 mt-1">
                  {selectedClosedCash.name ||
                    `Caixa #${selectedClosedCash.id}`}
                </p>

              </div>

              <button
                onClick={() => {
                  setSelectedClosedCash(
                    null
                  )

                  setClosedCashDetails(
                    null
                  )
                }}
                className="text-gray-500 text-2xl"
              >
                ✕
              </button>

            </div>

            <div className="p-6">

              {!closedCashDetails ? (

                <p className="text-gray-500">
                  Carregando detalhes do caixa...
                </p>

              ) : (

                <>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">

                      <p className="text-blue-700 font-semibold">
                        💵 Recebido
                      </p>

                      <p className="text-2xl font-bold text-blue-800 mt-2">
                        R${" "}
                        {closedCashDetails.recebidoHistorico.toFixed(
                          2
                        )}
                      </p>

                    </div>

                    <div className="bg-gray-50 border p-5 rounded-xl">

                      <p className="text-gray-600 font-semibold">
                        🚚 Fretes
                      </p>

                      <p className="text-2xl font-bold mt-2">
                        R${" "}
                        {closedCashDetails.fretesHistorico.toFixed(
                          2
                        )}
                      </p>

                    </div>

                    <div className="bg-green-50 border border-green-200 p-5 rounded-xl">

                      <p className="text-green-700 font-semibold">
                        📈 Lucro
                      </p>

                      <p className="text-2xl font-bold text-green-700 mt-2">
                        R${" "}
                        {closedCashDetails.lucroHistorico.toFixed(
                          2
                        )}
                      </p>

                    </div>

                    <div className="bg-purple-50 border border-purple-200 p-5 rounded-xl">

                      <p className="text-purple-700 font-semibold">
                        💰 Saldo disponível final
                      </p>

                      <p className="text-2xl font-bold text-purple-800 mt-2">
                        R${" "}
                        {closedCashDetails.saldoFinal.toFixed(
                          2
                        )}
                      </p>

                    </div>

                  </div>

                  <div className="border-t mt-6 pt-4 text-sm text-gray-500 space-y-1">

                    <p>
                      Aberto em:{" "}
                      {formatDate(
                        selectedClosedCash.opened_at
                      )}
                    </p>

                    <p>
                      Fechado em:{" "}
                      {formatDate(
                        selectedClosedCash.closed_at
                      )}
                    </p>

                  </div>

                </>

              )}

            </div>

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
              Primeiro informe os dados do caixa. Depois você irá conferir o estoque físico.
            </p>

            <label className="block text-sm font-medium text-gray-700 mt-5">
              Nome do caixa
            </label>

            <input
              className="border p-3 rounded-lg w-full mt-1"
              type="text"
              placeholder="Ex.: Caixa 18/08"
              value={
                cashName
              }
              onChange={(e) =>
                setCashName(
                  e.target.value
                )
              }
            />

            <label className="block text-sm font-medium text-gray-700 mt-4">
              Dinheiro inicial
            </label>

            <input
              className="border p-3 rounded-lg w-full mt-1"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex.: 50,00"
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
                onClick={() => {
                  setShowOpenModal(
                    false
                  )

                  setCashName("")
                  setOpeningAmount("")
                }}
                disabled={
                  openingStock ||
                  loadingStockConference
                }
                className="border px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={
                  abrirCaixa
                }
                disabled={
                  openingStock ||
                  loadingStockConference
                }
                className="bg-green-700 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {loadingStockConference
                  ? "Carregando estoque..."
                  : "📦 Conferir estoque"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* MODAL CONFERÊNCIA DE ESTOQUE */}

      {showStockConference && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto p-6">

            <div className="flex justify-between items-start gap-4">

              <div>

                <h2 className="text-xl font-bold">
                  📦 Conferência de estoque
                </h2>

                <p className="text-gray-500 mt-1">
                  Conte fisicamente os produtos e informe a quantidade encontrada.
                </p>

                <p className="text-gray-500 text-sm mt-2">
                  Caixa:{" "}
                  <strong>
                    {cashName ||
                      "Sem nome"}
                  </strong>
                </p>

              </div>

            </div>

            {loadingStockConference ? (

              <p className="text-gray-500 mt-6">
                Carregando estoque...
              </p>

            ) : (

              <div className="mt-6 space-y-3">

                {stockProducts.map(
                  (product) => {

                    const estoqueSistema =
                      Number(
                        product.stock ||
                          0
                      )

                    const valorContado =
                      countedStock[
                        product.id
                      ]

                    const contado =
                      valorContado ===
                        undefined ||
                      valorContado ===
                        ""
                        ? null
                        : Number(
                            String(
                              valorContado
                            ).replace(
                              ",",
                              "."
                            )
                          )

                    const diferenca =
                      contado ===
                        null ||
                      isNaN(
                        contado
                      )
                        ? null
                        : contado -
                          estoqueSistema

                    return (
                      <div
                        key={
                          product.id
                        }
                        className="border rounded-xl p-4"
                      >

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">

                          <div className="md:col-span-2">

                            <p className="font-bold">
  {product.name}
</p>

<p className="text-gray-500 text-sm mt-1">
  {product.flavor
    ? `Sabor: ${product.flavor}`
    : "Sabor: —"}
  {" • "}
  {product.volume
    ? `Volume: ${product.volume}`
    : "Volume: —"}
</p>

                            <p className="text-gray-500 text-sm mt-1">
                              Estoque no sistema:{" "}
                              <strong>
                                {estoqueSistema}
                              </strong>
                            </p>

                          </div>

                          <div>

                            <label className="text-sm text-gray-500">
                              Quantidade contada
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              className="border p-2 rounded-lg w-full mt-1"
                              value={
                                valorContado ??
                                ""
                              }
                              onChange={(e) =>
                                setCountedStock(
                                  (
                                    previous
                                  ) => ({
                                    ...previous,
                                    [product.id]:
                                      e.target.value,
                                  })
                                )
                              }
                              placeholder="0"
                            />

                          </div>

                          <div>

                            <p className="text-sm text-gray-500">
                              Diferença
                            </p>

                            {diferenca ===
                            null ? (

                              <p className="text-gray-400 mt-1">
                                —
                              </p>

                            ) : (

                              <p
                                className={
                                  diferenca ===
                                  0
                                    ? "font-bold text-green-600 mt-1"
                                    : diferenca >
                                      0
                                    ? "font-bold text-blue-600 mt-1"
                                    : "font-bold text-red-600 mt-1"
                                }
                              >
                                {diferenca >
                                0
                                  ? "+"
                                  : ""}
                                {diferenca}
                              </p>

                            )}

                          </div>

                        </div>

                      </div>
                    )
                  }
                )}

              </div>

            )}

            <div className="mt-6 bg-gray-50 border rounded-xl p-4">

              <p className="font-bold">
                Importante
              </p>

              <p className="text-sm text-gray-600 mt-1">
                Ao confirmar, a quantidade contada será considerada o estoque real de abertura.
                Se houver diferença, o sistema ajustará o estoque e registrará a conferência no histórico.
              </p>

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() =>
                  setShowStockConference(
                    false
                  )
                }
                disabled={
                  openingStock
                }
                className="border px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Voltar
              </button>

              <button
                onClick={
                  confirmarConferenciaEAbrir
                }
                disabled={
                  openingStock ||
                  loadingStockConference
                }
                className="bg-green-700 text-white px-5 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {openingStock
                  ? "Abrindo caixa..."
                  : "Confirmar conferência e abrir"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* MODAL ADICIONAR SAÍDA */}

      {showOutflowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">

            <h2 className="text-xl font-bold">
              💸 Adicionar saída
            </h2>

            <p className="text-gray-500 mt-2">
              Registre somente valores que realmente saíram do caixa.
            </p>

            <label className="block text-sm font-medium text-gray-700 mt-5">
              Valor
            </label>

            <input
              className="border p-3 rounded-lg w-full mt-1"
              type="number"
              min="0"
              step="0.01"
              placeholder="Ex.: 45,00"
              value={
                outflowAmount
              }
              onChange={(e) =>
                setOutflowAmount(
                  e.target.value
                )
              }
            />

            <label className="block text-sm font-medium text-gray-700 mt-4">
              Tipo
            </label>

            <select
              className="border p-3 rounded-lg w-full mt-1"
              value={
                outflowType
              }
              onChange={(e) =>
                setOutflowType(
                  e.target.value as
                    | "Compra/Reposição de estoque"
                    | "Despesa"
                    | "Retirada"
                )
              }
            >

              <option value="Compra/Reposição de estoque">
                🛒 Compra/Reposição de estoque
              </option>

              <option value="Despesa">
                🧾 Despesa
              </option>

              <option value="Retirada">
                👤 Retirada
              </option>

            </select>

            <label className="block text-sm font-medium text-gray-700 mt-4">
              Forma de pagamento
            </label>

            <select
              className="border p-3 rounded-lg w-full mt-1"
              value={
                outflowPaymentMethod
              }
              onChange={(e) =>
                setOutflowPaymentMethod(
                  e.target.value as
                    | "Dinheiro"
                    | "Pix"
                )
              }
            >

              <option value="Pix">
                📱 Pix
              </option>

              <option value="Dinheiro">
                💵 Dinheiro
              </option>

            </select>

            <label className="block text-sm font-medium text-gray-700 mt-4">
              Descrição
            </label>

            <input
              className="border p-3 rounded-lg w-full mt-1"
              type="text"
              placeholder="Ex.: Compra de bebida"
              value={
                outflowDescription
              }
              onChange={(e) =>
                setOutflowDescription(
                  e.target.value
                )
              }
            />

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => {

                  setShowOutflowModal(
                    false
                  )

                  setOutflowAmount("")
                  setOutflowDescription("")

                  setOutflowType(
                    "Compra/Reposição de estoque"
                  )

                  setOutflowPaymentMethod(
                    "Pix"
                  )

                }}
                disabled={
                  savingOutflow
                }
                className="border px-4 py-2 rounded-lg disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                onClick={
                  adicionarSaida
                }
                disabled={
                  savingOutflow
                }
                className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50"
              >
                {savingOutflow
                  ? "Salvando..."
                  : "Registrar saída"}
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
                  ).toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="flex justify-between">

                <span>
                  Dinheiro real recebido
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
                  Saídas em dinheiro
                </span>

                <strong className="text-red-700">
                  - R${" "}
                  {totalSaidasDinheiro.toFixed(
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
                  Pix líquido
                </span>

                <strong>
                  R${" "}
                  {pix.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="flex justify-between">

                <span>
                  Débito
                </span>

                <strong>
                  R${" "}
                  {debito.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="flex justify-between">

                <span>
                  Crédito
                </span>

                <strong>
                  R${" "}
                  {credito.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="border-t pt-3 flex justify-between">

                <span>
                  Custo dos produtos
                </span>

                <strong>
                  R${" "}
                  {recebido.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="flex justify-between">

                <span>
                  Lucro
                </span>

                <strong>
                  R${" "}
                  {lucroTotal.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="flex justify-between">

                <span>
                  Fretes
                </span>

                <strong>
                  R${" "}
                  {totalFretes.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="flex justify-between">

                <span>
                  Saídas totais
                </span>

                <strong className="text-red-700">
                  - R${" "}
                  {totalSaidas.toFixed(
                    2
                  )}
                </strong>

              </div>

              <div className="border-t pt-3 flex justify-between font-bold text-blue-700">

                <span>
                  Saldo disponível
                </span>

                <span>
                  R${" "}
                  {saldoDisponivel.toFixed(
                    2
                  )}
                </span>

              </div>

              <div className="flex justify-between font-bold text-green-700">

                <span>
                  Lucro disponível
                </span>

                <span>
                  R${" "}
                  {lucroDisponivel.toFixed(
                    2
                  )}
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
                  ).toFixed(
                    2
                  )}
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