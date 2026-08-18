import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Dashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [cashRegister, setCashRegister] =
    useState<any | null>(null)

  const [outflows, setOutflows] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(true)

  const [selectedProduct, setSelectedProduct] =
    useState<any | null>(null)

  const [selectedSale, setSelectedSale] =
    useState<any | null>(null)

  const [showStockDetails, setShowStockDetails] =
    useState(false)

  const [showLowStock, setShowLowStock] =
    useState(false)

  const [showRecentSales, setShowRecentSales] =
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

    /*
    ------------------------------------------------------------
    PRODUTOS
    ------------------------------------------------------------
    */

    const {
      data: productsData,
      error: productsError,
    } = await supabase
      .from("products")
      .select("*")

    if (productsError) {
      console.error(
        "ERRO AO CARREGAR PRODUTOS:",
        productsError
      )
    }

    /*
    ------------------------------------------------------------
    VENDAS
    ------------------------------------------------------------
    */

    const {
      data: salesData,
      error: salesError,
    } = await supabase
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

    /*
    ------------------------------------------------------------
    CAIXA ABERTO
    ------------------------------------------------------------
    */

    const {
      data: cashData,
      error: cashError,
    } = await supabase
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

    const currentCash =
      cashData &&
      cashData.length > 0
        ? cashData[0]
        : null

    /*
    ------------------------------------------------------------
    SAÍDAS DO CAIXA
    ------------------------------------------------------------
    */

    let outflowsData: any[] = []

    if (currentCash) {
      const {
        data,
        error,
      } = await supabase
        .from("cash_outflows")
        .select("*")
        .eq(
          "cash_register_id",
          currentCash.id
        )
        .order("created_at", {
          ascending: false,
        })

      if (error) {
        console.error(
          "ERRO AO CARREGAR SAÍDAS:",
          error
        )
      }

      outflowsData =
        data || []
    }

    setProducts(
      productsData || []
    )

    setSales(
      salesData || []
    )

    setCashRegister(
      currentCash
    )

    setOutflows(
      outflowsData
    )

    setLoading(false)
  }

  /*
  ============================================================
  ESTOQUE
  ============================================================
  */

  const totalProducts =
    products.length

  const lowStockProducts =
    products.filter(
      (product) =>
        Number(
          product.stock || 0
        ) <= 5
    )

  const lowStock =
    lowStockProducts.length

  const stockPurchaseValue =
    products.reduce(
      (
        total,
        product
      ) =>
        total +
        Number(
          product.stock || 0
        ) *
          Number(
            product.purchase_price || 0
          ),
      0
    )

  /*
  ============================================================
  FIADOS PENDENTES
  ============================================================
  */

  const pendingFiado =
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
  VENDAS DO CAIXA ATUAL
  ============================================================
  */

  const vendasDoCaixa =
    cashRegister
      ? sales.filter(
          (sale) => {
            if (
              !sale.date
            ) {
              return false
            }

            if (
              sale.payment ===
              "Fiado"
            ) {
              return false
            }

            if (
              sale.status !==
              "Pago"
            ) {
              return false
            }

            return (
              new Date(
                sale.date
              ).getTime() >=
              new Date(
                cashRegister.opened_at
              ).getTime()
            )
          }
        )
      : []

  /*
  ============================================================
  FIADOS RECEBIDOS NO CAIXA
  ============================================================
  */

  const fiadosRecebidos =
    cashRegister
      ? sales.filter(
          (sale) => {
            return (
              sale.payment ===
                "Fiado" &&
              sale.status ===
                "Pago" &&
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
  RECEBIMENTOS DO CAIXA
  ============================================================
  */

  const recebimentosDoCaixa = [
    ...vendasDoCaixa,
    ...fiadosRecebidos,
  ]

  const recebimentosUnicos =
    Array.from(
      new Map(
        recebimentosDoCaixa.map(
          (sale) => [
            sale.id,
            sale,
          ]
        )
      ).values()
    )

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
            item.quantity || 0
          )

        const purchasePrice =
          Number(
            item.purchasePrice || 0
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
  VALOR RECEBIDO
  ============================================================
  */

  const getValorRecebido =
    (sale: any) => {
      if (
        sale.payment !==
        "Fiado"
      ) {
        return Number(
          sale.total || 0
        )
      }

      return Number(
        sale.received_total || 0
      )
    }

  /*
  ============================================================
  LUCRO
  ============================================================
  */

  const getLucro = (
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

    const custo =
      getCustoProdutos(
        sale
      )

    const valorProdutos =
      Number(
        sale.received_total || 0
      ) -
      Number(
        sale.delivery_fee || 0
      )

    return (
      valorProdutos -
      custo
    )
  }

  /*
  ============================================================
  TOTAL RECEBIDO
  ============================================================
  */

  const totalRecebido =
    recebimentosUnicos.reduce(
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
  FRETES
  ============================================================
  */

  const totalFretes =
    recebimentosUnicos.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.delivery_fee || 0
        ),
      0
    )

  /*
  ============================================================
  LUCRO
  ============================================================
  */

  const lucroVendas =
    recebimentosUnicos.reduce(
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
            outflow.amount || 0
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
    totalRecebido -
    totalSaidas

  /*
  ============================================================
  LUCRO DISPONÍVEL
  ============================================================
  */

  const lucroDisponivel =
    lucroVendas -
    totalDespesas

  /*
  ============================================================
  QUANTIDADE DE VENDAS
  ============================================================
  */

  const quantidadeVendas =
    vendasDoCaixa.length

  /*
  ============================================================
  ITENS VENDIDOS
  ============================================================
  */

  const totalQuantitySold =
    vendasDoCaixa.reduce(
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
                  item.stockQuantity ||
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
  ÚLTIMAS VENDAS
  ============================================================
  */

  const ultimasVendas =
    sales
      .filter(
        (sale) =>
          sale.status ===
          "Pago"
      )
      .slice(0, 5)

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold">
          Dashboard
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
          Dashboard
        </h1>

        <p className="mt-2 text-gray-500">
          Visão geral da ZERO GRAU
        </p>

      </div>

      {/* STATUS DO CAIXA */}

      {cashRegister ? (

        <div className="mt-6 bg-green-50 border border-green-200 p-5 rounded-xl">

          <div className="flex justify-between items-center gap-4">

            <div>

              <p className="text-green-700 font-bold">
                🟢 Caixa aberto
              </p>

              {cashRegister.name && (
                <p className="text-gray-600 mt-1">
                  {cashRegister.name}
                </p>
              )}

              <p className="text-gray-600 text-sm mt-1">
                Aberto em:{" "}
                {new Intl.DateTimeFormat(
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
                    cashRegister.opened_at
                  )
                )}
              </p>

            </div>

            <div className="text-right">

              <p className="text-gray-500 text-sm">
                Dinheiro inicial
              </p>

              <p className="text-lg font-bold">
                R${" "}
                {Number(
                  cashRegister.opening_amount ||
                    0
                ).toFixed(2)}
              </p>

            </div>

          </div>

        </div>

      ) : (

        <div className="mt-6 bg-orange-50 border border-orange-200 p-5 rounded-xl">

          <p className="text-orange-700 font-bold">
            🔴 Caixa fechado
          </p>

          <p className="text-gray-600 text-sm mt-1">
            Abra um caixa para começar a contabilizar as movimentações.
          </p>

        </div>

      )}

      {/* INDICADORES */}

      <div className="grid grid-cols-2 xl:grid-cols-6 gap-6 mt-8">

        <div className="bg-purple-50 border border-purple-200 p-6 rounded-xl shadow">

          <p className="text-purple-700 font-semibold">
            💰 Saldo disponível
          </p>

          <p className="text-sm text-purple-600 mt-1">
            Inicial + recebido - saídas.
          </p>

          <h2 className="text-2xl font-bold text-purple-800 mt-2">
            R${" "}
            {saldoDisponivel.toFixed(2)}
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

        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl shadow">

          <p className="text-blue-700 font-semibold">
            💵 Total recebido
          </p>

          <p className="text-sm text-blue-600 mt-1">
            Vendas e fiados recebidos neste caixa.
          </p>

          <h2 className="text-2xl font-bold text-blue-800 mt-2">
            R${" "}
            {totalRecebido.toFixed(2)}
          </h2>

        </div>

        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow">

          <p className="text-red-700 font-semibold">
            💸 Saídas
          </p>

          <p className="text-sm text-red-600 mt-1">
            Tudo que saiu deste caixa.
          </p>

          <h2 className="text-2xl font-bold text-red-700 mt-2">
            R${" "}
            {totalSaidas.toFixed(2)}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500 font-semibold">
            🛒 Vendas
          </p>

          <p className="text-sm text-gray-400 mt-1">
            Quantidade de vendas pagas neste caixa.
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {quantidadeVendas}
          </h2>

        </div>

        <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow">

          <p className="text-red-700 font-semibold">
            📝 Fiado pendente
          </p>

          <p className="text-sm text-red-600 mt-1">
            Valor que clientes ainda devem.
          </p>

          <h2 className="text-2xl font-bold text-red-700 mt-2">
            R${" "}
            {pendingFiado.toFixed(2)}
          </h2>

        </div>

      </div>

      {/* RESUMO FINANCEIRO */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold text-lg">
          💰 Resumo financeiro
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Entenda os valores do caixa atual.
        </p>

        <div className="mt-5 space-y-3">

          <div className="flex justify-between">
            <span>
              💵 Recebido
            </span>

            <strong>
              R${" "}
              {totalRecebido.toFixed(2)}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>
              🚚 Fretes
            </span>

            <strong>
              R${" "}
              {totalFretes.toFixed(2)}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>
              📈 Lucro das vendas
            </span>

            <strong className="text-green-700">
              R${" "}
              {lucroVendas.toFixed(2)}
            </strong>
          </div>

          <div className="flex justify-between">
            <span>
              💸 Saídas
            </span>

            <strong className="text-red-700">
              - R${" "}
              {totalSaidas.toFixed(2)}
            </strong>
          </div>

          <div className="border-t pt-4 flex justify-between font-bold text-lg">

            <span>
              💰 Saldo disponível
            </span>

            <strong className="text-purple-700">
              R${" "}
              {saldoDisponivel.toFixed(2)}
            </strong>

          </div>

        </div>

      </div>

      {/* ESTOQUE */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-8">

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            📦 Produtos cadastrados
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {totalProducts}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <div className="flex justify-between items-start gap-3">

            <div>

              <p className="text-gray-500">
                💰 Valor do estoque
              </p>

              <p className="text-sm text-gray-400 mt-1">
                Valor de compra dos produtos em estoque.
              </p>

              <h2 className="text-2xl font-bold mt-2">
                R${" "}
                {stockPurchaseValue.toFixed(2)}
              </h2>

            </div>

            <button
              onClick={() =>
                setShowStockDetails(
                  true
                )
              }
              className="text-gray-500 hover:text-blue-700 text-xl"
              title="Ver detalhes do estoque"
            >
              👁
            </button>

          </div>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            🛒 Itens vendidos
          </p>

          <h2 className="text-2xl font-bold mt-2">
            {totalQuantitySold}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            🚚 Fretes
          </p>

          <h2 className="text-2xl font-bold mt-2">
            R${" "}
            {totalFretes.toFixed(2)}
          </h2>

        </div>

      </div>

      {/* ESTOQUE BAIXO */}

      <div className="mt-8 bg-white rounded-xl shadow overflow-hidden">

        <button
          onClick={() =>
            setShowLowStock(
              !showLowStock
            )
          }
          className="w-full p-6 flex justify-between items-center gap-4 text-left hover:bg-gray-50"
        >

          <div>

            <h2 className="font-bold text-lg">
              ⚠ Produtos com estoque baixo
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {showLowStock
                ? "Clique para ocultar os produtos."
                : "Clique para visualizar os produtos."}
            </p>

          </div>

          <div className="flex items-center gap-3">

            <span className="font-bold text-red-600">
              {lowStock}
            </span>

            <span className="text-gray-500 text-lg">
              {showLowStock
                ? "▲"
                : "▼"}
            </span>

          </div>

        </button>

        {showLowStock && (
          <div className="px-6 pb-6">

            <div className="space-y-3">

              {lowStockProducts.length ===
              0 ? (

                <p className="text-gray-500">
                  Nenhum produto com estoque baixo.
                </p>

              ) : (

                lowStockProducts.map(
                  (product) => (

                    <div
                      key={product.id}
                      className="flex justify-between items-center border-b pb-3 gap-4"
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

                      <button
                        onClick={() =>
                          setSelectedProduct(
                            product
                          )
                        }
                        className="font-bold text-red-600 hover:underline"
                      >
                        {Number(
                          product.stock || 0
                        )}{" "}
                        un
                      </button>

                    </div>

                  )
                )

              )}

            </div>

          </div>
        )}

      </div>

      {/* ÚLTIMAS VENDAS */}

      <div className="mt-8 bg-white rounded-xl shadow overflow-hidden">

        <button
          onClick={() =>
            setShowRecentSales(
              !showRecentSales
            )
          }
          className="w-full p-6 flex justify-between items-center gap-4 text-left hover:bg-gray-50"
        >

          <div>

            <h2 className="font-bold text-lg">
              🛒 Últimas vendas
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {showRecentSales
                ? "Clique para ocultar as vendas."
                : "Clique para visualizar as vendas."}
            </p>

          </div>

          <div className="flex items-center gap-3">

            <span className="font-bold text-gray-700">
              {ultimasVendas.length}
            </span>

            <span className="text-gray-500 text-lg">
              {showRecentSales
                ? "▲"
                : "▼"}
            </span>

          </div>

        </button>

        {showRecentSales && (
          <div className="px-6 pb-6">

            <div className="space-y-3">

              {ultimasVendas.length ===
              0 ? (

                <p className="text-gray-500">
                  Nenhuma venda registrada.
                </p>

              ) : (

                ultimasVendas.map(
                  (sale) => (

                    <button
                      key={sale.id}
                      onClick={() =>
                        setSelectedSale(
                          sale
                        )
                      }
                      className="w-full text-left flex justify-between items-center border-b pb-3 gap-4 hover:bg-gray-50 rounded-lg px-2 py-2"
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

                        <p className="text-sm text-gray-500">
                          {sale.payment ||
                            "-"}
                        </p>

                        <p className="text-sm text-gray-500">
                          {sale.date
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
                                  sale.date
                                )
                              )
                            : "-"}
                        </p>

                      </div>

                      <p className="font-bold">
                        R${" "}
                        {Number(
                          sale.total ||
                            0
                        ).toFixed(2)}
                      </p>

                    </button>

                  )
                )

              )}

            </div>

          </div>
        )}

      </div>

      {/* ======================================================
          MODAL DETALHES DO ESTOQUE
      ====================================================== */}

      {showStockDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">

            <div className="p-6 border-b flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold">
                  👁 Detalhes do estoque
                </h2>

                <p className="text-gray-500 mt-1">
                  Produtos incluídos no valor do estoque.
                </p>

              </div>

              <button
                onClick={() =>
                  setShowStockDetails(
                    false
                  )
                }
                className="text-gray-500 text-2xl"
              >
                ✕
              </button>

            </div>

            <div className="p-6">

              <div className="space-y-3">

                {products.length ===
                0 ? (

                  <p className="text-gray-500">
                    Nenhum produto cadastrado.
                  </p>

                ) : (

                  products.map(
                    (product) => {

                      const stock =
                        Number(
                          product.stock ||
                            0
                        )

                      const purchasePrice =
                        Number(
                          product.purchase_price ||
                            0
                        )

                      const total =
                        stock *
                        purchasePrice

                      return (
                        <div
                          key={product.id}
                          className="border rounded-xl p-4"
                        >

                          <div className="flex justify-between gap-4">

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

                            <p className="font-bold text-right">
                              R${" "}
                              {total.toFixed(
                                2
                              )}
                            </p>

                          </div>

                          <div className="grid grid-cols-3 gap-3 mt-3">

                            <div className="bg-gray-50 p-3 rounded-lg">

                              <p className="text-xs text-gray-500">
                                Estoque
                              </p>

                              <p className="font-bold">
                                {stock} un
                              </p>

                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">

                              <p className="text-xs text-gray-500">
                                Preço de compra
                              </p>

                              <p className="font-bold">
                                R${" "}
                                {purchasePrice.toFixed(
                                  2
                                )}
                              </p>

                            </div>

                            <div className="bg-blue-50 p-3 rounded-lg">

                              <p className="text-xs text-blue-600">
                                Valor em estoque
                              </p>

                              <p className="font-bold text-blue-700">
                                R${" "}
                                {total.toFixed(
                                  2
                                )}
                              </p>

                            </div>

                          </div>

                        </div>
                      )
                    }
                  )

                )}

              </div>

              <div className="border-t mt-6 pt-4 flex justify-between font-bold text-lg">

                <span>
                  Total do estoque
                </span>

                <span className="text-blue-700">
                  R${" "}
                  {stockPurchaseValue.toFixed(
                    2
                  )}
                </span>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          MODAL DETALHES DO PRODUTO
      ====================================================== */}

      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

            <div className="p-6 border-b flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold">
                  📦 Detalhes do produto
                </h2>

                <p className="text-gray-500 mt-1">
                  {selectedProduct.name}
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedProduct(
                    null
                  )
                }
                className="text-gray-500 text-2xl"
              >
                ✕
              </button>

            </div>

            <div className="p-6 space-y-3">

              <div className="flex justify-between">
                <span>
                  Marca
                </span>

                <strong>
                  {selectedProduct.brand ||
                    "-"}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Sabor
                </span>

                <strong>
                  {selectedProduct.flavor ||
                    "-"}
                </strong>
              </div>

              <div className="flex justify-between">
                <span>
                  Volume
                </span>

                <strong>
                  {selectedProduct.volume ||
                    "-"}
                </strong>
              </div>

              <div className="border-t pt-3 flex justify-between">

                <span>
                  Estoque
                </span>

                <strong className="text-red-600">
                  {Number(
                    selectedProduct.stock ||
                      0
                  )}{" "}
                  un
                </strong>

              </div>

              <div className="flex justify-between">

                <span>
                  Preço de compra
                </span>

                <strong>
                  R${" "}
                  {Number(
                    selectedProduct.purchase_price ||
                      0
                  ).toFixed(2)}
                </strong>

              </div>

              <div className="flex justify-between">

                <span>
                  Preço de venda
                </span>

                <strong className="text-green-700">
                  R${" "}
                  {Number(
                    selectedProduct.sale_price ||
                      0
                  ).toFixed(2)}
                </strong>

              </div>

              <div className="border-t pt-3 flex justify-between font-bold">

                <span>
                  Valor do estoque
                </span>

                <strong className="text-blue-700">
                  R${" "}
                  {(
                    Number(
                      selectedProduct.stock ||
                        0
                    ) *
                    Number(
                      selectedProduct.purchase_price ||
                        0
                    )
                  ).toFixed(2)}
                </strong>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ======================================================
          MODAL DETALHES DA VENDA
      ====================================================== */}

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">

            <div className="p-6 border-b flex justify-between items-center">

              <div>

                <h2 className="text-xl font-bold">
                  🛒 Detalhes da venda
                </h2>

                <p className="text-gray-500 mt-1">
                  Venda #{selectedSale.id}
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedSale(
                    null
                  )
                }
                className="text-gray-500 text-2xl"
              >
                ✕
              </button>

            </div>

            <div className="p-6">

              <div className="space-y-2">

                <p>
                  <strong>
                    Cliente:
                  </strong>{" "}
                  {selectedSale.customer ||
                    "Não informado"}
                </p>

                <p>
                  <strong>
                    Pagamento:
                  </strong>{" "}
                  {selectedSale.received_payment ||
                    selectedSale.payment ||
                    "-"}
                </p>

                <p>
                  <strong>
                    Data:
                  </strong>{" "}
                  {selectedSale.date
                    ? new Intl.DateTimeFormat(
                        "pt-BR",
                        {
                          timeZone:
                            "America/Sao_Paulo",
                          dateStyle:
                            "short",
                          timeStyle:
                            "medium",
                        }
                      ).format(
                        new Date(
                          selectedSale.date
                        )
                      )
                    : "-"}
                </p>

              </div>

              <div className="mt-6">

                <h3 className="font-bold text-lg mb-3">
                  Produtos
                </h3>

                {Array.isArray(
                  selectedSale.products
                ) &&
                selectedSale.products.length >
                  0 ? (

                  <div className="space-y-3">

                    {selectedSale.products.map(
                      (
                        item: any,
                        index: number
                      ) => {

                        const quantity =
                          Number(
                            item.quantity ||
                              0
                          )

                        const salePrice =
                          Number(
                            item.salePrice ||
                              0
                          )

                        const purchasePrice =
                          Number(
                            item.purchasePrice ||
                              0
                          )

                        const totalItem =
                          Number(
                            item.total ||
                              salePrice *
                                quantity
                          )

                        return (
                          <div
                            key={`${item.id}-${index}`}
                            className="border rounded-xl p-4"
                          >

                            <div className="flex justify-between gap-4">

                              <div>

                                <p className="font-bold">
                                  {item.displayName ||
                                    item.name ||
                                    "Produto"}
                                </p>

                                <p className="text-sm text-gray-500">
                                  Quantidade:{" "}
                                  {quantity}
                                </p>

                              </div>

                              <p className="font-bold">
                                R${" "}
                                {totalItem.toFixed(
                                  2
                                )}
                              </p>

                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">

                              <div className="bg-gray-50 p-3 rounded-lg">

                                <p className="text-xs text-gray-500">
                                  Venda
                                </p>

                                <p className="font-bold">
                                  R${" "}
                                  {salePrice.toFixed(
                                    2
                                  )}
                                </p>

                              </div>

                              <div className="bg-gray-50 p-3 rounded-lg">

                                <p className="text-xs text-gray-500">
                                  Custo
                                </p>

                                <p className="font-bold">
                                  R${" "}
                                  {purchasePrice.toFixed(
                                    2
                                  )}
                                </p>

                              </div>

                              <div className="bg-green-50 p-3 rounded-lg">

                                <p className="text-xs text-gray-500">
                                  Lucro
                                </p>

                                <p className="font-bold text-green-700">
                                  R${" "}
                                  {(
                                    (
                                      salePrice -
                                      purchasePrice
                                    ) *
                                    quantity
                                  ).toFixed(
                                    2
                                  )}
                                </p>

                              </div>

                            </div>

                          </div>
                        )
                      }
                    )}

                  </div>

                ) : (

                  <p className="text-gray-500">
                    Produtos não informados.
                  </p>

                )}

              </div>

              <div className="border-t mt-6 pt-4 space-y-2">

                <div className="flex justify-between">

                  <span>
                    Valor da venda
                  </span>

                  <strong>
                    R${" "}
                    {Number(
                      selectedSale.total ||
                        0
                    ).toFixed(2)}
                  </strong>

                </div>

                {Number(
                  selectedSale.delivery_fee ||
                    0
                ) > 0 && (

                  <div className="flex justify-between">

                    <span>
                      Frete
                    </span>

                    <strong>
                      R${" "}
                      {Number(
                        selectedSale.delivery_fee
                      ).toFixed(2)}
                    </strong>

                  </div>

                )}

                {Number(
                  selectedSale.discount ||
                    0
                ) > 0 && (

                  <div className="flex justify-between text-red-600">

                    <span>
                      Desconto
                    </span>

                    <strong>
                      - R${" "}
                      {Number(
                        selectedSale.discount
                      ).toFixed(2)}
                    </strong>

                  </div>

                )}

                <div className="border-t pt-3 flex justify-between font-bold text-lg">

                  <span>
                    Total
                  </span>

                  <strong className="text-blue-700">
                    R${" "}
                    {Number(
                      selectedSale.total ||
                        0
                    ).toFixed(2)}
                  </strong>

                </div>

                <div className="flex justify-between">

                  <span>
                    Custo
                  </span>

                  <strong>
                    R${" "}
                    {getCustoProdutos(
                      selectedSale
                    ).toFixed(2)}
                  </strong>

                </div>

                <div className="flex justify-between text-green-700 font-bold">

                  <span>
                    Lucro
                  </span>

                  <strong>
                    R${" "}
                    {getLucro(
                      selectedSale
                    ).toFixed(2)}
                  </strong>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Dashboard