import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Fiados() {
  const [sales, setSales] = useState<any[]>([])
  const [payment, setPayment] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [discount, setDiscount] = useState("")
  const [addition, setAddition] = useState("")
  const [receiving, setReceiving] = useState(false)
  const [selectedFiado, setSelectedFiado] = useState<any | null>(null)

  useEffect(() => {
    loadSales()
  }, [])

  async function loadSales() {
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("date", {
        ascending: false,
      })

    if (error) {
      console.error(
        "ERRO AO CARREGAR FIADOS:",
        error
      )
      return
    }

    setSales(data || [])
  }
function getValorFiado(sale: any) {
  const payment = String(sale.payment || "")

  // Venda dividida: pega somente a parte que ficou no fiado
  if (payment.includes(" + ")) {
    return payment
      .split(" + ")
      .reduce((total, part) => {
        const [method, valueText] =
          part.split(": R$ ")

        if (
          String(method).trim() !==
          "Fiado"
        ) {
          return total
        }

        return (
          total +
          Number(
            String(valueText || "0")
              .replace(",", ".")
          )
        )
      }, 0)
  }

  // Venda totalmente fiada
  if (payment === "Fiado") {
    return Number(sale.total || 0)
  }

  return 0
}
const pendingFiados = sales.filter(
  (sale) =>
    getValorFiado(sale) > 0 &&
    sale.status === "Pendente"
)
const paidFiados = sales
  .filter(
    (sale) =>
      getValorFiado(sale) > 0 &&
      sale.status === "Pago"
  )
  .sort((a, b) => {
    const dateA = a.received_at
      ? new Date(a.received_at).getTime()
      : 0

    const dateB = b.received_at
      ? new Date(b.received_at).getTime()
      : 0

    return dateB - dateA
  })
const totalFiado = pendingFiados.reduce(
  (total, sale) =>
    total + getValorFiado(sale),
  0
)

  async function receiveFiado() {
    if (selectedId === null) {
      alert("Selecione um fiado.")
      return
    }

    if (!payment) {
      alert("Escolha a forma de pagamento!")
      return
    }

    const sale = sales.find(
      (item) => item.id === selectedId
    )

    if (!sale) {
      alert("Fiado não encontrado.")
      return
    }

    /*
    ============================================================
    BUSCA O CAIXA ABERTO
    ============================================================
    */

    const {
      data: cashData,
      error: cashError,
    } = await supabase
      .from("cash_registers")
      .select("id")
      .eq("status", "Aberto")
      .order("opened_at", {
        ascending: false,
      })
      .limit(1)

    if (cashError) {
      console.error(
        "ERRO AO BUSCAR CAIXA ABERTO:",
        cashError
      )

      alert(
        "Não foi possível verificar o caixa aberto."
      )

      return
    }

    if (
      !cashData ||
      cashData.length === 0
    ) {
      alert(
        "Não existe nenhum caixa aberto. Abra o caixa antes de receber um fiado."
      )

      return
    }

    const cashRegisterId =
      cashData[0].id

    /*
    ============================================================
    VALORES DO FIADO
    ============================================================
    */

   
const valorFiado =
  getValorFiado(sale)
    const frete =
      Number(
        sale.delivery_fee || 0
      )

    /*
    O valor dos produtos é o total
    menos o frete.
    */

    const valorProdutos =
  Math.max(
    0,
    valorFiado - frete
  )
  const originalDiscountValue =
  Number(sale.discount || 0)

const originalAdditionValue =
  Number(sale.addition || 0)

    const discountValue = Number(
      String(discount)
        .replace(",", ".") || 0
    )
    const additionValue = Number(
  String(addition)
    .replace(",", ".") || 0
)

    if (
      isNaN(discountValue) ||
      discountValue < 0
    ) {
      alert(
        "Informe um desconto válido."
      )
      return
    }

    if (
      discountValue >
      valorProdutos
    ) {
      alert(
        "O desconto não pode ser maior que o valor dos produtos."
      )
      return
    }
    if (
  isNaN(additionValue) ||
  additionValue < 0
) {
  alert(
    "Informe um acréscimo válido."
  )
  return
}

    /*
    O desconto é aplicado somente
    sobre os produtos.

    O frete fica separado.
    */

  const receivedTotal =
  Math.max(
    valorProdutos +
      frete -
      discountValue +
      additionValue,
    0
  )

    setReceiving(true)

    /*
    ============================================================
    RECEBE O FIADO
    ============================================================
    */

    const {
      data,
      error,
    } = await supabase
      .from("sales")
      .update({
  status: "Pago",

  discount:
    originalDiscountValue,

  addition:
    originalAdditionValue,

  received_total:
    receivedTotal,

  received_discount:
    discountValue,

  received_addition:
    additionValue,

        received_at:
          new Date().toISOString(),

        received_cash_register_id:
          cashRegisterId,

        received_payment:
          payment,
      })
      .eq("id", selectedId)
      .select()

    if (error) {
      console.error(
        "ERRO AO RECEBER FIADO:",
        error
      )

      alert(
        `Erro ao registrar pagamento:\n${error.message}`
      )

      setReceiving(false)
      return
    }

    if (
      !data ||
      data.length === 0
    ) {
      alert(
        "O pagamento não foi atualizado. Verifique as permissões do Supabase."
      )

      setReceiving(false)
      return
    }

    /*
    ============================================================
    ATUALIZA A LISTA
    ============================================================
    */

    setSales(
      sales.map((sale) =>
        sale.id === selectedId
          ? data[0]
          : sale
      )
    )

    setPayment("")
setDiscount("")
setAddition("")
setSelectedId(null)

    setReceiving(false)

    alert(
      `Fiado recebido!\n\n` +
      `Produtos: R$ ${valorProdutos.toFixed(2)}\n` +
      `Frete: R$ ${frete.toFixed(2)}\n` +
      `Desconto: R$ ${discountValue.toFixed(2)}\n` +
      `Recebido: R$ ${receivedTotal.toFixed(2)}`
    )
  }

  async function deleteFiado(
    id: number
  ) {
    const confirmDelete =
      window.confirm(
        "Excluir esse fiado e devolver o estoque?"
      )

    if (!confirmDelete) {
      return
    }

    const sale = sales.find(
      (item) => item.id === id
    )

    if (!sale) {
      alert("Fiado não encontrado.")
      return
    }

    /*
    ============================================================
    DEVOLVE OS PRODUTOS AO ESTOQUE
    ============================================================
    */

    if (
      sale.products &&
      Array.isArray(sale.products)
    ) {
      for (
        const soldProduct of sale.products
      ) {
        const {
          data: productData,
          error: productError,
        } = await supabase
          .from("products")
          .select("stock")
          .eq(
            "id",
            soldProduct.id
          )
          .single()

        if (productError) {
          console.error(
            "ERRO AO BUSCAR PRODUTO:",
            productError
          )

          alert(
            "Erro ao localizar produto para devolver o estoque."
          )

          return
        }

        const previousStock =
          Number(
            productData?.stock || 0
          )

        const quantity =
          Number(
            soldProduct.quantity || 0
          )

        const currentStock =
          previousStock +
          quantity

        const {
          error: stockError,
        } = await supabase
          .from("products")
          .update({
            stock:
              currentStock,
          })
          .eq(
            "id",
            soldProduct.id
          )

        if (stockError) {
          console.error(
            "ERRO AO DEVOLVER ESTOQUE:",
            stockError
          )

          alert(
            "Erro ao devolver o estoque."
          )

          return
        }

        /*
        ========================================================
        REGISTRA DEVOLUÇÃO NO HISTÓRICO
        ========================================================
        */

        const {
          error: movementError,
        } = await supabase
          .from("stock_movements")
          .insert({
            product_id:
              soldProduct.id,

            product_name:
              soldProduct.name,

            type: "Entrada",

            quantity:
              quantity,

            date:
              new Date().toISOString(),
          })

        if (movementError) {
          console.error(
            "ERRO AO REGISTRAR DEVOLUÇÃO:",
            movementError
          )

          alert(
            "O estoque foi devolvido, mas houve erro ao registrar o histórico."
          )

          return
        }
      }
    }

    /*
    ============================================================
    EXCLUI A VENDA
    ============================================================
    */

    const {
      error,
    } = await supabase
      .from("sales")
      .delete()
      .eq("id", id)

    if (error) {
      console.error(
        "ERRO AO EXCLUIR FIADO:",
        error
      )

      alert(
        "O estoque foi devolvido, mas não foi possível excluir o fiado."
      )

      return
    }

    setSales(
      sales.filter(
        (sale) =>
          sale.id !== id
      )
    )

    if (
      selectedId === id
    ) {
      setSelectedId(null)
      setPayment("")
      setDiscount("")
    }

    if (
      selectedFiado &&
      selectedFiado.id === id
    ) {
      setSelectedFiado(null)
    }

    alert(
      "Fiado excluído e estoque devolvido!"
    )
  }

  function openReceive(
    sale: any
  ) {
    setSelectedId(
      sale.id
    )

    setPayment("")
setDiscount("")
setAddition("")
  }

  function closeReceive() {
    setSelectedId(null)
    setPayment("")
    setDiscount("")
    setAddition("")
  }

  return (
    <div>

      <h1 className="text-3xl font-bold">
        Fiados
      </h1>

      <p className="mt-2 text-gray-500">
        Controle de clientes pendentes
      </p>

      {/* RESUMO */}

      <div className="mt-6 grid grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            Clientes devendo
          </p>

          <h2 className="text-2xl font-bold">
            {pendingFiados.length}
          </h2>

        </div>

        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            Total pendente
          </p>

          <h2 className="text-2xl font-bold text-red-600">
            R$ {totalFiado.toFixed(2)}
          </h2>

        </div>

      </div>

      {/* LISTA DE FIADOS */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold text-lg">
          📝 Fiados pendentes
        </h2>

        <div className="mt-4 space-y-4">

          {pendingFiados.map(
            (sale) => (
              <div
                key={sale.id}
                className="border rounded-lg p-4 flex justify-between"
              >

                <div>

                  <p className="font-bold">
                    {sale.customer ||
                      "Cliente não informado"}
                  </p>

                  <p className="text-gray-500">
                    {sale.products?.length
                      ? sale.products
                          .map(
                            (
                              item: any
                            ) =>
                              `${item.displayName || item.name} (${item.quantity})`
                          )
                          .join(", ")
                      : "Produtos não informados"}
                  </p>

                  <p className="text-gray-500">
                    📅{" "}
                    {sale.date
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
                            sale.date
                          )
                        )
                      : "-"}
                  </p>

                </div>

                <div className="text-right">

                  <p className="font-bold">
                   R$ {getValorFiado(sale).toFixed(2)}
                  </p>

                  <p className="text-red-600">
                    Pendente
                  </p>

                  <div className="flex flex-wrap justify-end gap-2 mt-2">

                    <button
                      onClick={() =>
                        setSelectedFiado(
                          sale
                        )
                      }
                      className="bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Ver detalhes
                    </button>

                    <button
                      onClick={() =>
                        openReceive(
                          sale
                        )
                      }
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Receber
                    </button>

                    <button
                      onClick={() =>
                        deleteFiado(
                          sale.id
                        )
                      }
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      🗑
                    </button>

                  </div>

                </div>

              </div>
            )
          )}

          {pendingFiados.length ===
            0 && (
            <p className="text-gray-500">
              Nenhum fiado pendente.
            </p>
          )}
{paidFiados.length > 0 && (
  <div className="mt-10 pt-6 border-t">
    <h2 className="font-bold text-lg">
      ✅ Fiados baixados
    </h2>

    <div className="mt-4 space-y-4">
      {paidFiados.map((sale) => (
        <div
          key={sale.id}
          className="border rounded-lg p-4 flex justify-between"
        >
          <div>
            <p className="font-bold">
              {sale.customer ||
                "Cliente não informado"}
            </p>

            <p className="text-gray-500">
              {sale.products?.length
                ? sale.products
                    .map(
                      (item: any) =>
                        `${item.displayName || item.name} (${item.quantity})`
                    )
                    .join(", ")
                : "Produtos não informados"}
            </p>

            <p className="text-gray-500">
              📅 Baixado em:{" "}
              {sale.received_at
                ? new Intl.DateTimeFormat(
                    "pt-BR",
                    {
                      timeZone:
                        "America/Sao_Paulo",
                      dateStyle: "short",
                      timeStyle: "medium",
                    }
                  ).format(
                    new Date(
                      sale.received_at
                    )
                  )
                : "-"}
            </p>
          </div>

          <div className="text-right">
            <p className="font-bold">
              R$ {Number(
                sale.received_total || 0
              ).toFixed(2)}
            </p>

            <p className="text-green-600">
              Pago
            </p>

            <div className="flex flex-wrap justify-end gap-2 mt-2">
              <button
                onClick={() =>
                  setSelectedFiado(sale)
                }
                className="bg-blue-700 text-white px-3 py-1 rounded"
              >
                Ver detalhes
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
        </div>

      </div>

           {/* MODAL DE RECEBIMENTO */}

      {selectedId !== null &&
        (() => {
          const selectedSale =
            sales.find(
              (sale) =>
                sale.id === selectedId
            )

          if (!selectedSale) {
            return null
          }

          const originalTotal =
            getValorFiado(selectedSale)

          const frete =
            Number(
              selectedSale.delivery_fee || 0
            )

          const valorProdutos =
            Math.max(
              0,
              originalTotal - frete
            )

          const discountValue =
            Number(
              String(discount)
                .replace(",", ".") || 0
            )

          const additionValue =
            Number(
              String(addition)
                .replace(",", ".") || 0
            )

          const receivedTotal =
            Math.max(
              valorProdutos +
                frete -
                discountValue +
                additionValue,
              0
            )

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

              <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">

                {/* CABEÇALHO */}

                <div className="p-6 border-b flex justify-between items-center">

                  <div>
                    <h2 className="text-xl font-bold">
                      💰 Dar baixa no fiado
                    </h2>

                    <p className="text-gray-500 mt-1">
                      {selectedSale.customer ||
                        "Cliente não informado"}
                    </p>
                  </div>

                  <button
                    onClick={closeReceive}
                    disabled={receiving}
                    className="text-gray-500 text-2xl"
                  >
                    ✕
                  </button>

                </div>

                {/* CONTEÚDO */}

                <div className="p-6">

                  <div className="mb-5 bg-gray-50 p-4 rounded-xl">

                    <p className="text-sm text-gray-500">
                      Fiado
                    </p>

                    <p className="text-lg font-bold">
                      {selectedSale.products?.length
                        ? selectedSale.products
                            .map(
                              (item: any) =>
                                `${item.displayName || item.name} (${item.quantity})`
                            )
                            .join(", ")
                        : "Produtos não informados"}
                    </p>

                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div className="bg-gray-50 p-4 rounded-xl">

                      <p className="text-sm text-gray-500">
                        Produtos
                      </p>

                      <p className="text-xl font-bold">
                        R$ {valorProdutos.toFixed(2)}
                      </p>

                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl">

                      <p className="text-sm text-gray-500">
                        Frete
                      </p>

                      <p className="text-xl font-bold">
                        R$ {frete.toFixed(2)}
                      </p>

                    </div>

                    <div className="bg-red-50 p-4 rounded-xl">

                      <p className="text-sm text-gray-500">
                        Desconto
                      </p>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discount}
                        onChange={(e) =>
                          setDiscount(
                            e.target.value
                          )
                        }
                        placeholder="0,00"
                        className="border p-2 rounded w-full mt-1"
                      />

                    </div>

                    <div className="bg-blue-50 p-4 rounded-xl">

                      <p className="text-sm text-gray-500">
                        Acréscimo
                      </p>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={addition}
                        onChange={(e) =>
                          setAddition(
                            e.target.value
                          )
                        }
                        placeholder="0,00"
                        className="border p-2 rounded w-full mt-1"
                      />

                    </div>

                  </div>

                  {/* VALOR A RECEBER */}

                  <div className="mt-5 bg-green-50 border border-green-200 p-5 rounded-xl">

                    <p className="text-sm text-green-700">
                      Valor a receber
                    </p>

                    <p className="text-3xl font-bold text-green-700">
                      R$ {receivedTotal.toFixed(2)}
                    </p>

                  </div>

                  {/* FORMA DE PAGAMENTO */}

                  <div className="mt-5">

                    <p className="font-medium mb-2">
                      Forma de recebimento
                    </p>

                    <select
                      className="border p-3 rounded-xl w-full"
                      value={payment}
                      onChange={(e) =>
                        setPayment(
                          e.target.value
                        )
                      }
                    >

                      <option value="">
                        Forma de recebimento
                      </option>

                      <option value="Pix">
                        Pix
                      </option>

                      <option value="Dinheiro">
                        Dinheiro
                      </option>

                      <option value="Débito">
                        Cartão de débito
                      </option>

                      <option value="Crédito">
                        Cartão de crédito
                      </option>

                    </select>

                  </div>

                  {/* BOTÕES */}

                  <div className="mt-6 flex justify-end gap-3">

                    <button
                      onClick={closeReceive}
                      disabled={receiving}
                      className="bg-gray-500 text-white px-5 py-2 rounded-xl disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      onClick={receiveFiado}
                      disabled={receiving}
                      className="bg-green-600 text-white px-5 py-2 rounded-xl disabled:opacity-50"
                    >
                      {receiving
                        ? "Recebendo..."
                        : "Confirmar recebimento"}
                    </button>

                  </div>

                </div>

              </div>

            </div>
          )
        })()}

      {/* MODAL DE DETALHES */}

      {selectedFiado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">

            <div className="p-6 border-b flex justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  Detalhes do fiado
                </h2>

                <p className="text-gray-500 mt-1">
                  {selectedFiado.customer ||
                    "Cliente não informado"}
                </p>

              </div>

              <button
                onClick={() =>
                  setSelectedFiado(
                    null
                  )
                }
                className="text-gray-500 text-2xl"
              >
                ✕
              </button>

            </div>

            <div className="p-6">

           <div className="text-gray-500 mb-4 space-y-1">

  <p>
    📅 Data da venda:{" "}
    {selectedFiado.date
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
            selectedFiado.date
          )
        )
      : "-"}
  </p>

  {selectedFiado.status === "Pago" && (
    <p>
      💰 Baixado em:{" "}
      {selectedFiado.received_at
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
              selectedFiado.received_at
            )
          )
        : "-"}
    </p>
  )}

</div>

              <h3 className="font-bold text-lg mb-3">
                Produtos
              </h3>

              <div className="space-y-3">

                {selectedFiado.products &&
                selectedFiado.products.length > 0 ? (
                  selectedFiado.products.map(
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

                      const total =
                        Number(
                          item.total ||
                            salePrice *
                              quantity
                        )

                      const profit =
                        (
                          salePrice -
                          purchasePrice
                        ) *
                        quantity

                      return (
                        <div
                          key={`${item.id}-${index}`}
                          className="border rounded-xl p-4"
                        >

                          <p className="font-bold">
                            {item.displayName ||
                              item.name}
                          </p>

                          <p className="text-gray-500">
                            Quantidade:{" "}
                            {quantity}{" "}
                            {item.saleType ===
                            "Fardo"
                              ? "fardo(s)"
                              : "unidade(s)"}
                          </p>

                          <div className="grid grid-cols-3 gap-3 mt-3">

                            <div className="bg-gray-50 p-3 rounded">

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

                            <div className="bg-gray-50 p-3 rounded">

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

                            <div className="bg-green-50 p-3 rounded">

                              <p className="text-xs text-gray-500">
                                Lucro
                              </p>

                              <p className="font-bold text-green-700">
                                R${" "}
                                {profit.toFixed(
                                  2
                                )}
                              </p>

                            </div>

                          </div>

                          <p className="font-bold mt-3">
                            Total: R${" "}
                            {total.toFixed(
                              2
                            )}
                          </p>

                        </div>
                      )
                    }
                  )
                ) : (
                  <p className="text-gray-500">
                    Os produtos desta venda não foram salvos.
                  </p>
                )}

              </div>

             <div className="border-t mt-6 pt-4 space-y-3">

  <h3 className="font-bold text-lg mb-3">
    💰 Resumo financeiro
  </h3>

  <div className="flex justify-between">
    <span>Valor original da venda</span>

    <span className="font-bold">
      R${" "}
      {Number(
        selectedFiado.total || 0
      ).toFixed(2)}
    </span>
  </div>

  {Number(
    selectedFiado.delivery_fee || 0
  ) > 0 && (
    <div className="flex justify-between">
      <span>Frete</span>

      <span className="font-bold">
        R${" "}
        {Number(
          selectedFiado.delivery_fee || 0
        ).toFixed(2)}
      </span>
    </div>
  )}

  <div className="border-t pt-3 mt-3">

  <p className="font-bold mb-2">
    🧾 Ajustes da venda original
  </p>

  <div className="flex justify-between">
    <span>Desconto na venda</span>

    <span className="font-bold text-red-600">
      - R${" "}
      {Number(
        selectedFiado.discount || 0
      ).toFixed(2)}
    </span>
  </div>

  <div className="flex justify-between">
    <span>Acréscimo na venda</span>

    <span className="font-bold text-blue-600">
      + R${" "}
      {Number(
        selectedFiado.addition || 0
      ).toFixed(2)}
    </span>
  </div>

</div>

{selectedFiado.status === "Pago" && (
  <div className="border-t pt-3 mt-3">

    <p className="font-bold mb-2">
      💰 Ajustes na baixa do fiado
    </p>

    <div className="flex justify-between">
      <span>Desconto ao pagar</span>

      <span className="font-bold text-red-600">
        - R${" "}
        {Number(
          selectedFiado.received_discount || 0
        ).toFixed(2)}
      </span>
    </div>

    <div className="flex justify-between">
      <span>Acréscimo ao pagar</span>

      <span className="font-bold text-blue-600">
        + R${" "}
        {Number(
          selectedFiado.received_addition || 0
        ).toFixed(2)}
      </span>
    </div>

  </div>
)}

  <div className="flex justify-between border-t pt-3">
    <span>Valor recebido</span>

    <span className="font-bold text-green-700">
      R${" "}
      {Number(
        selectedFiado.received_total || 0
      ).toFixed(2)}
    </span>
  </div>

  {selectedFiado.status === "Pago" && (
    <>
      <div className="flex justify-between">
        <span>Forma de pagamento</span>

        <span className="font-bold">
          {selectedFiado.received_payment ||
            "-"}
        </span>
      </div>

      <div className="flex justify-between">
        <span>Baixado em</span>

        <span className="font-bold">
          {selectedFiado.received_at
            ? new Intl.DateTimeFormat(
                "pt-BR",
                {
                  timeZone:
                    "America/Sao_Paulo",
                  dateStyle: "short",
                  timeStyle: "medium",
                }
              ).format(
                new Date(
                  selectedFiado.received_at
                )
              )
            : "-"}
        </span>
      </div>

      <div className="flex justify-between">
        <span>Status</span>

        <span className="font-bold text-green-600">
          ✅ Pago
        </span>
      </div>

      <div className="flex justify-between">
        <span>Caixa da baixa</span>

        <span className="font-bold">
          {selectedFiado.received_cash_register_id
            ? `Caixa #${selectedFiado.received_cash_register_id}`
            : "-"}
        </span>
      </div>
    </>
  )}

</div>

            </div>

          </div>

        </div>
      )}

    </div>
  )
}

export default Fiados