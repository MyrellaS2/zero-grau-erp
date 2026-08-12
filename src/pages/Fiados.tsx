  import { useEffect, useState } from "react"
  import { supabase } from "../lib/supabase"

  function Fiados() {
  const [sales, setSales] = useState<any[]>([])
  const [payment, setPayment] = useState("")
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [discount, setDiscount] = useState("")
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

  const pendingFiados = sales.filter(
  (sale) =>
  sale.payment === "Fiado" &&
  sale.status === "Pendente"
  )

  const totalFiado = pendingFiados.reduce(
  (total, sale) =>
  total + Number(sale.total || 0),
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

  if (!cashData || cashData.length === 0) {
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

  const originalTotal = Number(
    sale.total || 0
  )

  const discountValue = Number(
    discount.replace(",", ".") || 0
  )

  if (
    isNaN(discountValue) ||
    discountValue < 0
  ) {
    alert("Informe um desconto válido.")
    return
  }

  if (discountValue > originalTotal) {
    alert(
      "O desconto não pode ser maior que o valor do fiado."
    )
    return
  }

  const receivedTotal =
    originalTotal - discountValue

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
      discountValue,

    received_total:
      receivedTotal,

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

  if (!data || data.length === 0) {
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
  setSelectedId(null)

  setReceiving(false)

  alert(
    `Fiado recebido!


  Valor original: R$ ${originalTotal.toFixed(
  2
  )}

  Desconto: R$ ${discountValue.toFixed(
  2
  )}

  Recebido: R$ ${receivedTotal.toFixed(
  2
  )}`
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
        .eq("id", soldProduct.id)
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
        previousStock + quantity

      const {
        error: stockError,
      } = await supabase
        .from("products")
        .update({
          stock: currentStock,
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
      ============================================================
      REGISTRA DEVOLUÇÃO NO HISTÓRICO
      ============================================================
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

  if (selectedId === id) {
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
  setSelectedId(sale.id)
  setPayment("")
  setDiscount("")
  }

  function closeReceive() {
  setSelectedId(null)
  setPayment("")
  setDiscount("")
  }

  return ( <div> <h1 className="text-3xl font-bold">
  Fiados </h1>


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
          (item: any) =>
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
                  R${" "}
                  {Number(
                    sale.total || 0
                  ).toFixed(2)}
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
      </div>
    </div>

    {/* RECEBIMENTO */}

    {selectedId !== null &&
      (() => {
        const selectedSale =
          sales.find(
            (sale) =>
              sale.id ===
              selectedId
          )

        if (!selectedSale) {
          return null
        }

        const originalTotal =
          Number(
            selectedSale.total ||
              0
          )

        const discountValue =
          Number(
            discount.replace(
              ",",
              "."
            ) || 0
          )

        const receivedTotal =
          Math.max(
            originalTotal -
              discountValue,
            0
          )

        return (
          <div className="mt-6 bg-white p-6 rounded-xl shadow">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">
                  💰 Receber pagamento
                </h2>

                <p className="text-gray-500 mt-1">
                  {selectedSale.customer ||
                    "Cliente não informado"}
                </p>
              </div>

              <button
                onClick={
                  closeReceive
                }
                className="text-gray-500 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  Valor original
                </p>

                <p className="text-xl font-bold">
                  R${" "}
                  {originalTotal.toFixed(
                    2
                  )}
                </p>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  Desconto
                </p>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={
                    discount
                  }
                  onChange={(
                    e
                  ) =>
                    setDiscount(
                      e.target.value
                    )
                  }
                  placeholder="0,00"
                  className="border p-2 rounded w-full mt-1"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">
                  Valor a receber
                </p>

                <p className="text-xl font-bold text-green-700">
                  R${" "}
                  {receivedTotal.toFixed(
                    2
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <p className="font-medium mb-2">
                Forma de recebimento
              </p>

              <select
                className="border p-2 rounded w-full"
                value={
                  payment
                }
                onChange={(
                  e
                ) =>
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

            <div className="mt-5 flex gap-3">
              <button
                onClick={
                  receiveFiado
                }
                disabled={
                  receiving
                }
                className="bg-green-600 text-white px-5 py-2 rounded disabled:opacity-50"
              >
                {receiving
                  ? "Recebendo..."
                  : "Confirmar recebimento"}
              </button>

              <button
                onClick={
                  closeReceive
                }
                disabled={
                  receiving
                }
                className="bg-gray-500 text-white px-5 py-2 rounded disabled:opacity-50"
              >
                Cancelar
              </button>
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
            <p className="text-gray-500 mb-4">
              Data:{" "}
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

            <h3 className="font-bold text-lg mb-3">
              Produtos
            </h3>

            <div className="space-y-3">
              {selectedFiado.products &&
              selectedFiado.products
                .length > 0 ? (
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
                      (salePrice -
                        purchasePrice) *
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
                  Os produtos desta venda não
                  foram salvos.
                </p>
              )}
            </div>

            <div className="border-t mt-6 pt-4 space-y-2">
              <div className="flex justify-between">
                <span>
                  Total original
                </span>

                <span className="font-bold">
                  R${" "}
                  {Number(
                    selectedFiado.total ||
                      0
                  ).toFixed(2)}
                </span>
              </div>

              {Number(
                selectedFiado.discount ||
                  0
              ) > 0 && (
                <>
                  <div className="flex justify-between text-red-600">
                    <span>
                      Desconto
                    </span>

                    <span className="font-bold">
                      - R${" "}
                      {Number(
                        selectedFiado.discount ||
                          0
                      ).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span>
                      Valor recebido
                    </span>

                    <span className="font-bold text-green-700">
                      R${" "}
                      {Number(
                        selectedFiado.received_total ||
                          0
                      ).toFixed(2)}
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
