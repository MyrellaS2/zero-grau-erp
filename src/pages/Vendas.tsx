import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Vendas() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])
  const [copoes, setCopoes] = useState<any[]>([])

  const [saleMode, setSaleMode] =
    useState<"Produto" | "Copao">("Produto")

  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [productSearch, setProductSearch] = useState("")

  const [selectedCopaoId, setSelectedCopaoId] =
    useState("")
  const [selectedEnergeticoId, setSelectedEnergeticoId] =
    useState("")
  const [selectedGeloId, setSelectedGeloId] =
    useState("")
  const [useGarrafinha, setUseGarrafinha] =
    useState(false)
  const [extraDoses, setExtraDoses] =
    useState("0")
  const [copaoQuantity, setCopaoQuantity] =
    useState("1")

  const [cart, setCart] = useState<any[]>([])

  const [saleType, setSaleType] =
    useState<"Unidade" | "Fardo">("Unidade")

  const [customer, setCustomer] = useState("")
  const [payment, setPayment] = useState("")
  const [discount, setDiscount] = useState("")

  const [cashGiven, setCashGiven] = useState("")
  const [changeMethod, setChangeMethod] =
    useState<"Dinheiro" | "Pix">("Dinheiro")

  const [hasDelivery, setHasDelivery] =
    useState(false)

  const [deliveryType, setDeliveryType] =
    useState<"Normal" | "Noturno">("Normal")

  const [deliveryFee, setDeliveryFee] = useState(0)
  const [deliveryFeeNight, setDeliveryFeeNight] =
    useState(0)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  const [selectedSale, setSelectedSale] =
    useState<any | null>(null)

  const [savingSale, setSavingSale] =
    useState(false)

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
    const {
      data: settingsData,
      error: settingsError,
    } = await supabase
      .from("settings")
      .select(
        "delivery_fee, delivery_fee_night"
      )
      .limit(1)

    if (settingsError) {
      console.error(
        "ERRO AO CARREGAR FRETE:",
        settingsError
      )
    } else if (
      settingsData &&
      settingsData.length > 0
    ) {
      setDeliveryFee(
        Number(
          settingsData[0].delivery_fee || 0
        )
      )

      setDeliveryFeeNight(
        Number(
          settingsData[0]
            .delivery_fee_night || 0
        )
      )
    }

    const {
      data: productsData,
      error: productsError,
    } = await supabase
      .from("products")
      .select("*")

    const {
      data: salesData,
      error: salesError,
    } = await supabase
      .from("sales")
      .select("*")
      .order("date", {
        ascending: false,
      })

    const {
      data: copoesData,
      error: copoesError,
    } = await supabase
      .from("copoes")
      .select("*")
      .eq("active", true)
      .order("name", {
        ascending: true,
      })

    if (productsError) {
      console.error(
        "ERRO AO CARREGAR PRODUTOS:",
        productsError
      )
    }

    if (salesError) {
      console.error(
        "ERRO AO CARREGAR VENDAS:",
        salesError
      )
    }

    if (copoesError) {
      console.error(
        "ERRO AO CARREGAR COPÕES:",
        copoesError
      )
    }

    if (productsData) {
      const formattedProducts =
        productsData.map(
          (item: any) => ({
            ...item,

            entryType:
              item.entry_type,

            itemsPerPackage:
              item.items_per_package,

            purchasePrice:
              Number(
                item.purchase_price || 0
              ),

            salePrice:
              Number(
                item.sale_price || 0
              ),

            salePricePackage:
              item.sale_price_package !==
                null &&
              item.sale_price_package !==
                undefined
                ? Number(
                    item.sale_price_package
                  )
                : null,

            stock:
              Number(
                item.stock || 0
              ),
          })
        )

      setProducts(
        formattedProducts
      )
    }

    if (salesData) {
      setSales(salesData)
    }

    if (copoesData) {
      setCopoes(copoesData)
    }
  }

  const filteredProducts =
    products.filter((product) =>
      (
        product.name +
        " " +
        (product.brand || "") +
        " " +
        (product.flavor || "") +
        " " +
        (product.volume || "")
      )
        .toLowerCase()
        .includes(
          productSearch
            .toLowerCase()
        )
    )

  const energeticos =
    products.filter(
      (product) =>
        String(
          product.category || ""
        )
          .trim()
          .toLowerCase() ===
        "energético"
    )

  const gelos =
    products.filter(
      (product) =>
        String(
          product.category || ""
        )
          .trim()
          .toLowerCase() ===
        "gelo"
    )

  const selectedCopao =
    copoes.find(
      (copao) =>
        copao.id ===
        Number(
          selectedCopaoId
        )
    )

  const selectedDose =
    selectedCopao
      ? products.find(
          (product) =>
            product.id ===
            Number(
              selectedCopao.dose_product_id
            )
        )
      : null

  const selectedCopo =
    selectedCopao
      ? products.find(
          (product) =>
            product.id ===
            Number(
              selectedCopao.copo_product_id
            )
        )
      : null

  const selectedGarrafinha =
    selectedCopao
      ? products.find(
          (product) =>
            product.id ===
            Number(
              selectedCopao.garrafinha_product_id
            )
        )
      : null

  function formatDateTime(
    dateValue: string
  ) {
    if (!dateValue) {
      return "-"
    }

    const date =
      new Date(dateValue)

    if (
      isNaN(
        date.getTime()
      )
    ) {
      return "-"
    }

    date.setHours(
      date.getHours() - 3
    )

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone:
          "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }
    ).format(date)
  }

  function addToCart() {
    const product =
      products.find(
        (item) =>
          item.id ===
          Number(productId)
      )

    if (!product) {
      alert(
        "Selecione um produto!"
      )
      return
    }

    const qtd =
      Number(quantity)

    if (qtd <= 0) {
      alert(
        "Quantidade inválida"
      )
      return
    }

    if (
      saleType === "Fardo" &&
      (!product.itemsPerPackage ||
        Number(
          product.itemsPerPackage
        ) <= 0)
    ) {
      alert(
        "Esse produto não possui quantidade por fardo cadastrada."
      )
      return
    }

    const stockQuantity =
      saleType === "Fardo"
        ? qtd *
          Number(
            product.itemsPerPackage
          )
        : qtd

    const price =
      saleType === "Fardo"
        ? Number(
            product.salePricePackage ||
              0
          )
        : Number(
            product.salePrice || 0
          )

    if (price <= 0) {
      alert(
        "Esse produto não possui preço de venda cadastrado."
      )
      return
    }

    const alreadyInCart =
      cart.find(
        (item) =>
          item.type === "Produto" &&
          item.id === product.id &&
          item.saleType ===
            saleType
      )

    const totalStockQuantity =
      alreadyInCart
        ? alreadyInCart.stockQuantity +
          stockQuantity
        : stockQuantity

    if (
      totalStockQuantity >
      Number(product.stock)
    ) {
      alert(
        "Estoque insuficiente!"
      )
      return
    }

    if (alreadyInCart) {
      setCart(
        cart.map((item) =>
          item.type ===
            "Produto" &&
          item.id ===
            product.id &&
          item.saleType ===
            saleType
            ? {
                ...item,

                quantity:
                  item.quantity +
                  qtd,

                stockQuantity:
                  item.stockQuantity +
                  stockQuantity,

                total:
                  (item.quantity +
                    qtd) *
                  item.salePrice,
              }
            : item
        )
      )
    } else {
      setCart([
        ...cart,

        {
          type: "Produto",

          id: product.id,

          name: product.name,

          displayName:
            product.name +
            (product.brand
              ? ` • ${product.brand}`
              : "") +
            (product.flavor
              ? ` • ${product.flavor}`
              : "") +
            (product.volume
              ? ` • ${product.volume}`
              : ""),

          quantity: qtd,

          saleType,

          stockQuantity,

          itemsPerPackage:
            Number(
              product.itemsPerPackage ||
                0
            ),

          salePrice: price,

          purchasePrice:
            saleType ===
            "Fardo"
              ? Number(
                  product.purchasePrice ||
                    0
                ) *
                Number(
                  product.itemsPerPackage ||
                    0
                )
              : Number(
                  product.purchasePrice ||
                    0
                ),

          total:
            price * qtd,

          stockItems: [
            {
              id: product.id,
              name: product.name,
              quantity:
                stockQuantity,
            },
          ],
        },
      ])
    }

    setProductId("")
    setQuantity("")
    setProductSearch("")
    setSaleType("Unidade")
  }

  function addCopaoToCart() {
    if (!selectedCopao) {
      alert(
        "Selecione um Copão."
      )
      return
    }

    if (!selectedDose) {
      alert(
        "A dose cadastrada nesse Copão não foi encontrada."
      )
      return
    }

    if (!selectedCopo) {
      alert(
        "O copo cadastrado nesse Copão não foi encontrado."
      )
      return
    }

    if (
      !selectedEnergeticoId
    ) {
      alert(
        "Escolha o energético."
      )
      return
    }

    if (
      !selectedGeloId
    ) {
      alert(
        "Escolha o gelo."
      )
      return
    }

    const qtdCopoes =
      Number(
        copaoQuantity
      )

    const qtdExtras =
      Number(
        extraDoses || 0
      )

    if (
      qtdCopoes <= 0
    ) {
      alert(
        "Quantidade de Copões inválida."
      )
      return
    }

    if (
      qtdExtras < 0
    ) {
      alert(
        "Quantidade de doses extras inválida."
      )
      return
    }

    const energetico =
      products.find(
        (product) =>
          product.id ===
          Number(
            selectedEnergeticoId
          )
      )

    const gelo =
      products.find(
        (product) =>
          product.id ===
          Number(
            selectedGeloId
          )
      )

    if (!energetico) {
      alert(
        "Energético não encontrado."
      )
      return
    }

    if (!gelo) {
      alert(
        "Gelo não encontrado."
      )
      return
    }

    const doseQuantityPerCopao =
      2 + qtdExtras

    const doseTotal =
      doseQuantityPerCopao *
      qtdCopoes

    const energeticoTotal =
      qtdCopoes

    const geloTotal =
      qtdCopoes

    const copoTotal =
      qtdCopoes

    const garrafinhaTotal =
      selectedCopao.garrafinha_enabled &&
      useGarrafinha
        ? (
            2 +
            qtdExtras
          ) *
          qtdCopoes
        : 0

    const basePrice =
      Number(
        selectedCopao.sale_price ||
          0
      )

    const extraPrice =
      Number(
        selectedCopao.dose_extra_price ||
          0
      )

    const unitPrice =
      basePrice +
      qtdExtras *
        extraPrice

    const total =
      unitPrice *
      qtdCopoes

    const stockItems = [
      {
        id: selectedDose.id,
        name: selectedDose.name,
        quantity: doseTotal,
      },

      {
        id: energetico.id,
        name: energetico.name,
        quantity:
          energeticoTotal,
      },

      {
        id: gelo.id,
        name: gelo.name,
        quantity: geloTotal,
      },

      {
        id: selectedCopo.id,
        name: selectedCopo.name,
        quantity: copoTotal,
      },
    ]

    if (
      garrafinhaTotal > 0 &&
      selectedGarrafinha
    ) {
      stockItems.push({
        id:
          selectedGarrafinha.id,
        name:
          selectedGarrafinha.name,
        quantity:
          garrafinhaTotal,
      })
    }

    const requiredStock: Record<
      number,
      number
    > = {}

    stockItems.forEach(
      (item) => {
        requiredStock[
          item.id
        ] =
          (
            requiredStock[
              item.id
            ] || 0
          ) +
          item.quantity
      }
    )

    for (
      const [
        id,
        required,
      ] of Object.entries(
        requiredStock
      )
    ) {
      const product =
        products.find(
          (item) =>
            item.id ===
            Number(id)
        )

      if (!product) {
        alert(
          `Produto de estoque não encontrado: ${id}`
        )
        return
      }

      if (
        required >
        Number(
          product.stock || 0
        )
      ) {
        alert(
          `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}. Necessário: ${required}.`
        )
        return
      }
    }

    const doseCost =
      Number(
        selectedDose.purchasePrice ||
          0
      ) *
      doseQuantityPerCopao

    const energeticoCost =
      Number(
        energetico.purchasePrice ||
          0
      )

    const geloCost =
      Number(
        gelo.purchasePrice ||
          0
      )

    const copoCost =
      Number(
        selectedCopo.purchasePrice ||
          0
      )

    const garrafinhaCost =
      selectedGarrafinha &&
      garrafinhaTotal > 0
        ? Number(
            selectedGarrafinha.purchasePrice ||
              0
          ) *
          (
            2 +
            qtdExtras
          )
        : 0

    const unitCost =
      doseCost +
      energeticoCost +
      geloCost +
      copoCost +
      garrafinhaCost

    const itemProfit =
      unitPrice -
      unitCost

    setCart([
      ...cart,

      {
        type: "Copao",

        id: `copao-${selectedCopao.id}-${Date.now()}`,

        copaoId:
          selectedCopao.id,

        name:
          selectedCopao.name,

        displayName:
          selectedCopao.name,

        quantity:
          qtdCopoes,

        saleType:
          "Unidade",

        stockQuantity:
          0,

        salePrice:
          unitPrice,

        purchasePrice:
          unitCost,

        total,

        profit:
          itemProfit *
          qtdCopoes,

        doseExtra:
          qtdExtras,

        useGarrafinha,

        energeticoName:
          energetico.name,

        geloName:
          gelo.name,

        components:
          stockItems.map(
            (item) => ({
              ...item,
            })
          ),

        stockItems,
      },
    ])

    setSelectedCopaoId("")
    setSelectedEnergeticoId("")
    setSelectedGeloId("")
    setUseGarrafinha(false)
    setExtraDoses("0")
    setCopaoQuantity("1")
  }

  function removeCartItem(
    index: number
  ) {
    setCart(
      cart.filter(
        (_, i) =>
          i !== index
      )
    )
  }

  const cartTotal =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.total || 0
        ),
      0
    )

  const deliveryTotal =
    hasDelivery
      ? deliveryType ===
        "Noturno"
        ? deliveryFeeNight
        : deliveryFee
      : 0

  const discountValue =
    Number(
      String(discount)
        .replace(",", ".") ||
        0
    )

  const finalTotal =
    Math.max(
      0,
      cartTotal +
        deliveryTotal -
        discountValue
    )

  const cartProfit =
    cart.reduce(
      (total, item) =>
        total +
        Number(
          item.profit !==
            undefined
            ? item.profit
            : (
                Number(
                  item.salePrice ||
                    0
                ) -
                Number(
                  item.purchasePrice ||
                    0
                )
              ) *
                Number(
                  item.quantity ||
                    0
                )
        ),
      0
    )

  const cashGivenValue =
    Number(
      String(cashGiven)
        .replace(",", ".") ||
        0
    )

  const changeAmount =
    payment ===
      "Dinheiro" &&
    cashGiven !== ""
      ? Math.max(
          cashGivenValue -
            finalTotal,
          0
        )
      : 0

  async function deleteSale(
    id: number
  ) {
    const sale =
      sales.find(
        (item) =>
          item.id === id
      )

    if (!sale) return

    const confirmDelete =
      window.confirm(
        "Excluir essa venda e devolver o estoque?"
      )

    if (!confirmDelete)
      return

    const stockToReturn: Record<
      number,
      {
        name: string
        quantity: number
      }
    > = {}

    if (
      Array.isArray(
        sale.products
      )
    ) {
      sale.products.forEach(
        (soldProduct: any) => {
          const items =
            Array.isArray(
              soldProduct.stockItems
            )
              ? soldProduct.stockItems
              : [
                  {
                    id:
                      soldProduct.id,
                    name:
                      soldProduct.name,
                    quantity:
                      Number(
                        soldProduct.stockQuantity ||
                          soldProduct.quantity ||
                          0
                      ),
                  },
                ]

          items.forEach(
            (stockItem: any) => {
              if (
                !stockItem.id
              ) {
                return
              }

              if (
                !stockToReturn[
                  stockItem.id
                ]
              ) {
                stockToReturn[
                  stockItem.id
                ] = {
                  name:
                    stockItem.name,
                  quantity:
                    0,
                }
              }

              stockToReturn[
                stockItem.id
              ].quantity +=
                Number(
                  stockItem.quantity ||
                    0
                )
            }
          )
        }
      )
    }

    for (
      const [
        productId,
        item,
      ] of Object.entries(
        stockToReturn
      )
    ) {
      const product =
        products.find(
          (p) =>
            p.id ===
            Number(
              productId
            )
        )

      if (!product)
        continue

      const previousStock =
        Number(
          product.stock || 0
        )

      const newStock =
        previousStock +
        Number(
          item.quantity
        )

      const {
        error,
      } = await supabase
        .from("products")
        .update({
          stock:
            newStock,
        })
        .eq(
          "id",
          Number(
            productId
          )
        )

      if (error) {
        console.error(
          "ERRO AO DEVOLVER ESTOQUE:",
          error
        )

        alert(
          "Erro ao devolver estoque."
        )

        return
      }

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
            "Entrada",

          quantity:
            Number(
              item.quantity
            ),

          previous_stock:
            previousStock,

          current_stock:
            newStock,

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

    const {
      error,
    } = await supabase
      .from("sales")
      .delete()
      .eq(
        "id",
        id
      )

    if (error) {
      console.error(
        "ERRO AO EXCLUIR VENDA:",
        error
      )

      alert(
        "Erro ao excluir venda."
      )

      return
    }

    setProducts(
      products.map(
        (product) => {
          const returned =
            stockToReturn[
              product.id
            ]

          if (!returned) {
            return product
          }

          return {
            ...product,
            stock:
              Number(
                product.stock || 0
              ) +
              Number(
                returned.quantity
              ),
          }
        }
      )
    )

    setSales(
      sales.filter(
        (item) =>
          item.id !== id
      )
    )

    setSelectedSale(null)

    alert(
      "Venda excluída e estoque devolvido!"
    )
  }

  async function finalizeSale() {
    if (savingSale)
      return

    if (
      cart.length === 0
    ) {
      alert(
        "Carrinho vazio!"
      )
      return
    }

    if (!payment) {
      alert(
        "Selecione a forma de pagamento!"
      )
      return
    }

    if (
      payment === "Fiado" &&
      !customer.trim()
    ) {
      alert(
        "Informe o nome do cliente!"
      )
      return
    }

    if (
      payment === "Dinheiro"
    ) {
      if (
        cashGiven === ""
      ) {
        alert(
          "Informe quanto o cliente entregou em dinheiro."
        )
        return
      }

      if (
        isNaN(
          cashGivenValue
        ) ||
        cashGivenValue < 0
      ) {
        alert(
          "Valor entregue inválido."
        )
        return
      }

      if (
        cashGivenValue <
        finalTotal
      ) {
        alert(
          `O valor entregue é menor que o total da venda.\n\nTotal: R$ ${finalTotal.toFixed(
            2
          )}\nEntregue: R$ ${cashGivenValue.toFixed(
            2
          )}`
        )
        return
      }
    }

    setSavingSale(true)

    try {
      const requiredStock: Record<
        number,
        number
      > = {}

      cart.forEach(
        (item) => {
          const items =
            Array.isArray(
              item.stockItems
            )
              ? item.stockItems
              : []

          items.forEach(
            (stockItem: any) => {
              requiredStock[
                stockItem.id
              ] =
                (
                  requiredStock[
                    stockItem.id
                  ] || 0
                ) +
                Number(
                  stockItem.quantity ||
                    0
                )
            }
          )
        }
      )

      for (
        const [
          id,
          required,
        ] of Object.entries(
          requiredStock
        )
      ) {
        const product =
          products.find(
            (p) =>
              p.id ===
              Number(id)
          )

        if (!product) {
          throw new Error(
            `Produto não encontrado: ${id}`
          )
        }

        if (
          Number(
            product.stock || 0
          ) < required
        ) {
          throw new Error(
            `Estoque insuficiente para ${product.name}. Disponível: ${product.stock}. Necessário: ${required}.`
          )
        }
      }

      const stocksAfterSale: Record<
        number,
        number
      > = {}

      for (
        const [
          id,
          required,
        ] of Object.entries(
          requiredStock
        )
      ) {
        const product =
          products.find(
            (p) =>
              p.id ===
              Number(id)
          )

        if (!product) {
          throw new Error(
            `Produto não encontrado: ${id}`
          )
        }

        const previousStock =
          Number(
            product.stock || 0
          )

        const {
          data: newStock,
          error:
            stockError,
        } = await supabase.rpc(
          "baixar_estoque",
          {
            p_product_id:
              product.id,

            p_quantity:
              Number(
                required
              ),
          }
        )

        if (stockError) {
          throw new Error(
            `Erro ao atualizar estoque de ${product.name}: ${stockError.message}`
          )
        }

        const currentStock =
          Number(
            newStock
          )

        stocksAfterSale[
          product.id
        ] =
          currentStock

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
              "Saída",

            quantity:
              Number(
                required
              ),

            previous_stock:
              previousStock,

            current_stock:
              currentStock,

            date:
              new Date().toISOString(),
          })

        if (movementError) {
          throw new Error(
            `Erro ao salvar histórico de ${product.name}: ${movementError.message}`
          )
        }
      }

      const total =
        finalTotal

      const profit =
        cartProfit -
        discountValue

      const saleProducts =
        cart.map(
          (item) => ({
            ...item,

            profit:
              Number(
                item.profit || 0
              ),

            stockItems:
              Array.isArray(
                item.stockItems
              )
                ? item.stockItems
                : [],
          })
        )

      const saleData = {
        products:
          saleProducts,

        delivery_fee:
          deliveryTotal,

        product:
          cart
            .map(
              (item) =>
                item.displayName ||
                item.name
            )
            .join(", "),

        quantity:
          cart.reduce(
            (
              total,
              item
            ) =>
              total +
              Number(
                item.quantity || 0
              ),
            0
          ),

        total,

        profit,

        customer:
          customer.trim() ||
          null,

        payment,

        status:
          payment ===
          "Fiado"
            ? "Pendente"
            : "Pago",

        change_amount:
          payment ===
          "Dinheiro"
            ? changeAmount
            : 0,

        change_method:
          payment ===
            "Dinheiro" &&
          changeAmount > 0
            ? changeMethod
            : null,

        amount_received:
          payment ===
          "Dinheiro"
            ? cashGivenValue
            : 0,

        date:
          new Date().toISOString(),
      }

      const {
        data: newSaleData,
        error:
          saleError,
      } = await supabase
        .from("sales")
        .insert(
          saleData
        )
        .select()

      if (saleError) {
        throw new Error(
          `Erro ao registrar a venda: ${saleError.message}`
        )
      }

      const updatedProducts =
        products.map(
          (product) => {
            if (
              stocksAfterSale[
                product.id
              ] !==
              undefined
            ) {
              return {
                ...product,
                stock:
                  stocksAfterSale[
                    product.id
                  ],
              }
            }

            return product
          }
        )

      setProducts(
        updatedProducts
      )

      if (newSaleData) {
        setSales([
          newSaleData[0],
          ...sales,
        ])
      }

      setCart([])
      setCustomer("")
      setPayment("")
      setDiscount("")
      setCashGiven("")
      setChangeMethod(
        "Dinheiro"
      )
      setHasDelivery(false)
      setDeliveryType(
        "Normal"
      )
      setProductSearch("")
      setProductId("")
      setQuantity("")

      setSelectedCopaoId("")
      setSelectedEnergeticoId("")
      setSelectedGeloId("")
      setUseGarrafinha(false)
      setExtraDoses("0")
      setCopaoQuantity("1")
      setSaleMode("Produto")

      if (
        payment ===
          "Dinheiro" &&
        changeAmount > 0
      ) {
        alert(
          `Venda registrada!\n\nTroco: R$ ${changeAmount.toFixed(
            2
          )}\nTroco em: ${
            changeMethod ===
            "Pix"
              ? "Pix"
              : "Dinheiro"
          }`
        )
      } else {
        alert(
          "Venda registrada!"
        )
      }
    } catch (error: any) {
      console.error(
        "ERRO AO FINALIZAR VENDA:",
        error
      )

      alert(
        error?.message ||
          "Não foi possível registrar a venda."
      )
    } finally {
      setSavingSale(false)
    }
  }

  const filteredSales =
    sales.filter(
      (sale) => {
        if (
          !startDate &&
          !endDate
        ) {
          return true
        }

        const saleDate =
          new Date(
            sale.date
          )

        const start =
          startDate
            ? new Date(
                `${startDate}T00:00:00`
              )
            : null

        const end =
          endDate
            ? new Date(
                `${endDate}T23:59:59`
              )
            : null

        if (
          start &&
          saleDate <
            start
        ) {
          return false
        }

        if (
          end &&
          saleDate >
            end
        ) {
          return false
        }

        return true
      }
    )

  const paidSales =
    filteredSales.filter(
      (sale) =>
        sale.status ===
        "Pago"
    )

  const periodTotal =
    paidSales.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.total || 0
        ) -
        Number(
          sale.delivery_fee ||
            0
        ),
      0
    )

  const periodProfit =
    paidSales.reduce(
      (
        total,
        sale
      ) =>
        total +
        Number(
          sale.profit || 0
        ),
      0
    )

  const periodDeliveryFees =
    paidSales.reduce(
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

  const periodQuantity =
    paidSales.reduce(
      (
        total,
        sale
      ) => {
        if (
          !sale.products
        ) {
          return (
            total +
            Number(
              sale.quantity ||
                0
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

  return (
    <div>
      <h1 className="text-2xl font-bold">
        Vendas
      </h1>

      <p className="mt-2 text-gray-500">
        Controle de vendas da ZERO GRAU
      </p>

      {/* ======================================================
          NOVA VENDA
      ====================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold text-lg">
            🛒 Nova venda
          </h2>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() =>
                setSaleMode(
                  "Produto"
                )
              }
              className={`py-2 rounded-lg font-semibold ${
                saleMode ===
                "Produto"
                  ? "bg-blue-800 text-white"
                  : "border"
              }`}
            >
              Produtos
            </button>

            <button
              onClick={() =>
                setSaleMode(
                  "Copao"
                )
              }
              className={`py-2 rounded-lg font-semibold ${
                saleMode ===
                "Copao"
                  ? "bg-blue-800 text-white"
                  : "border"
              }`}
            >
              🥤 Copões
            </button>
          </div>

          {saleMode ===
            "Produto" && (
            <>
              <input
                className="border p-2 rounded w-full mt-4"
                placeholder="Pesquisar produto..."
                value={
                  productSearch
                }
                onChange={(e) =>
                  setProductSearch(
                    e.target.value
                  )
                }
              />

              <div className="mt-2 max-h-48 overflow-auto border rounded">
                {filteredProducts.map(
                  (product) => (
                    <button
                      key={
                        product.id
                      }
                      onClick={() => {
                        setProductId(
                          product.id.toString()
                        )

                        setProductSearch(
                          product.name +
                            (product.brand
                              ? ` • ${product.brand}`
                              : "") +
                            (product.flavor
                              ? ` • ${product.flavor}`
                              : "") +
                            (product.volume
                              ? ` • ${product.volume}`
                              : "")
                        )
                      }}
                      className="block w-full text-left p-2 hover:bg-gray-100"
                    >
                      {product.name}

                      {product.brand &&
                        ` • ${product.brand}`}

                      {product.flavor &&
                        ` • ${product.flavor}`}

                      {product.volume &&
                        ` • ${product.volume}`}
                    </button>
                  )
                )}
              </div>

              {productId && (
                <select
                  className="border p-2 rounded w-full mt-3"
                  value={
                    saleType
                  }
                  onChange={(
                    e
                  ) =>
                    setSaleType(
                      e.target.value as
                        | "Unidade"
                        | "Fardo"
                    )
                  }
                >
                  <option value="Unidade">
                    Venda por unidade
                  </option>

                  {products.find(
                    (item) =>
                      item.id ===
                      Number(
                        productId
                      )
                  )?.entryType ===
                    "Fardo" && (
                    <option value="Fardo">
                      Venda por fardo
                    </option>
                  )}
                </select>
              )}

              <input
                className="border p-2 rounded w-full mt-3"
                type="number"
                min="1"
                placeholder="Quantidade"
                value={
                  quantity
                }
                onChange={(e) =>
                  setQuantity(
                    e.target.value
                  )
                }
              />

              <button
                onClick={
                  addToCart
                }
                className="mt-4 bg-green-700 text-white px-5 py-2 rounded-lg"
              >
                Adicionar ao carrinho
              </button>
            </>
          )}

          {saleMode ===
            "Copao" && (
            <div className="mt-4 space-y-3">
              <select
                className="border p-2 rounded w-full"
                value={
                  selectedCopaoId
                }
                onChange={(e) => {
                  const id =
                    e.target.value

                  setSelectedCopaoId(
                    id
                  )

                  const copao =
                    copoes.find(
                      (item) =>
                        item.id ===
                        Number(
                          id
                        )
                    )

                  setUseGarrafinha(
                    false
                  )

                  setExtraDoses(
                    "0"
                  )

                  if (
                    copao &&
                    !copao.garrafinha_enabled
                  ) {
                    setUseGarrafinha(
                      false
                    )
                  }
                }}
              >
                <option value="">
                  Selecione o Copão
                </option>

                {copoes.map(
                  (copao) => (
                    <option
                      key={
                        copao.id
                      }
                      value={
                        copao.id
                      }
                    >
                      {copao.name} — R${" "}
                      {Number(
                        copao.sale_price
                      ).toFixed(
                        2
                      )}
                    </option>
                  )
                )}
              </select>

              {selectedCopao && (
                <>
                  <select
                    className="border p-2 rounded w-full"
                    value={
                      selectedEnergeticoId
                    }
                    onChange={(e) =>
                      setSelectedEnergeticoId(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Escolha o energético
                    </option>

                    {energeticos.map(
                      (
                        product
                      ) => (
                        <option
                          key={
                            product.id
                          }
                          value={
                            product.id
                          }
                        >
                          {product.name}{" "}
                          {product.volume
                            ? `• ${product.volume}`
                            : ""}{" "}
                          — estoque:{" "}
                          {
                            product.stock
                          }
                        </option>
                      )
                    )}
                  </select>

                  <select
                    className="border p-2 rounded w-full"
                    value={
                      selectedGeloId
                    }
                    onChange={(e) =>
                      setSelectedGeloId(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      Escolha o gelo
                    </option>

                    {gelos.map(
                      (
                        product
                      ) => (
                        <option
                          key={
                            product.id
                          }
                          value={
                            product.id
                          }
                        >
                          {product.name}{" "}
                          — estoque:{" "}
                          {
                            product.stock
                          }
                        </option>
                      )
                    )}
                  </select>

                  <label className="flex items-center gap-3 border rounded-lg p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={
                        useGarrafinha
                      }
                      disabled={
                        !selectedCopao.garrafinha_enabled
                      }
                      onChange={(e) =>
                        setUseGarrafinha(
                          e.target.checked
                        )
                      }
                    />

                    <div>
                      <p className="font-semibold">
                        🧴 Usar garrafinha
                      </p>

                      <p className="text-sm text-gray-500">
                        {selectedCopao.garrafinha_enabled
                          ? "2 unidades no padrão. Cada dose extra adiciona mais 1."
                          : "Esse Copão não usa garrafinha."}
                      </p>
                    </div>
                  </label>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Doses extras
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        extraDoses
                      }
                      onChange={(e) =>
                        setExtraDoses(
                          e.target.value
                        )
                      }
                      className="border p-2 rounded w-full"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                      + R${" "}
                      {Number(
                        selectedCopao.dose_extra_price ||
                          0
                      ).toFixed(
                        2
                      )}{" "}
                      por dose.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Quantidade de Copões
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        copaoQuantity
                      }
                      onChange={(e) =>
                        setCopaoQuantity(
                          e.target.value
                        )
                      }
                      className="border p-2 rounded w-full"
                    />
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold">
                      Resumo
                    </p>

                    <p className="text-sm mt-2">
                      🥃 Dose:{" "}
                      {2 +
                        Number(
                          extraDoses ||
                            0
                        )}{" "}
                      por Copão
                    </p>

                    <p className="text-sm">
                      ⚡ Energético: 1
                    </p>

                    <p className="text-sm">
                      🧊 Gelo: 1
                    </p>

                    <p className="text-sm">
                      🥤 Copo: 1
                    </p>

                    {useGarrafinha && (
                      <p className="text-sm">
                        🧴 Garrafinha:{" "}
                        {2 +
                          Number(
                            extraDoses ||
                              0
                          )}
                      </p>
                    )}

                    <p className="font-bold mt-3">
                      Preço por Copão: R${" "}
                      {(
                        Number(
                          selectedCopao.sale_price ||
                            0
                        ) +
                        Number(
                          extraDoses ||
                            0
                        ) *
                          Number(
                            selectedCopao.dose_extra_price ||
                              0
                          )
                      ).toFixed(2)}
                    </p>
                  </div>

                  <button
                    onClick={
                      addCopaoToCart
                    }
                    className="w-full bg-green-700 text-white px-5 py-3 rounded-lg font-bold"
                  >
                    Adicionar Copão ao carrinho
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* CARRINHO */}
        {/* ================================================== */}

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold text-lg">
            🛒 Carrinho
          </h2>

          {cart.length ===
          0 ? (
            <p className="text-gray-500 mt-4">
              Nenhum produto adicionado.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {cart.map(
                (
                  item,
                  index
                ) => (
                  <div
                    key={`${item.id}-${index}`}
                    className="border rounded-lg p-3"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="font-bold">
                          {item.displayName ||
                            item.name}
                        </p>

                        <p className="text-gray-500">
                          {item.quantity}{" "}
                          {item.type ===
                          "Copao"
                            ? "Copão(s)"
                            : item.saleType ===
                              "Fardo"
                            ? "fardo(s)"
                            : "unidade(s)"}
                        </p>

                        {item.type ===
                          "Copao" && (
                          <p className="text-sm text-gray-500">
                            {item.energeticoName}{" "}
                            •{" "}
                            {item.geloName}
                            {item.useGarrafinha
                              ? " • com garrafinha"
                              : ""}
                            {Number(
                              item.doseExtra ||
                                0
                            ) > 0
                              ? ` • +${item.doseExtra} dose(s)`
                              : ""}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="font-bold">
                          R${" "}
                          {Number(
                            item.total ||
                              0
                          ).toFixed(
                            2
                          )}
                        </p>

                        <button
                          onClick={() =>
                            removeCartItem(
                              index
                            )
                          }
                          className="text-red-600 text-sm mt-1"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          <div className="border-t mt-5 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  hasDelivery
                }
                onChange={(e) => {
                  setHasDelivery(
                    e.target.checked
                  )

                  if (
                    !e.target
                      .checked
                  ) {
                    setDeliveryType(
                      "Normal"
                    )
                  }
                }}
              />

              <span className="font-medium">
                🚚 Adicionar frete
              </span>
            </label>

            {hasDelivery && (
              <div className="mt-3">
                <select
                  className="border p-2 rounded w-full"
                  value={
                    deliveryType
                  }
                  onChange={(e) =>
                    setDeliveryType(
                      e.target.value as
                        | "Normal"
                        | "Noturno"
                    )
                  }
                >
                  <option value="Normal">
                    🚚 Frete normal — R${" "}
                    {deliveryFee.toFixed(
                      2
                    )}
                  </option>

                  <option value="Noturno">
                    🌙 Frete noturno — R${" "}
                    {deliveryFeeNight.toFixed(
                      2
                    )}
                  </option>
                </select>

                <p className="text-gray-600 mt-2">
                  Frete selecionado: R${" "}
                  {deliveryTotal.toFixed(
                    2
                  )}
                </p>
              </div>
            )}

            <p className="font-bold text-lg mt-3">
              Subtotal: R${" "}
              {cartTotal.toFixed(
                2
              )}
            </p>

            <input
              className="border p-2 rounded w-full mt-3"
              type="number"
              min="0"
              placeholder="Desconto em R$"
              value={
                discount
              }
              onChange={(e) =>
                setDiscount(
                  e.target.value
                )
              }
            />

            {discountValue >
              0 && (
              <p className="text-red-600 mt-2">
                Desconto: -R${" "}
                {discountValue.toFixed(
                  2
                )}
              </p>
            )}

            <p className="font-bold text-xl text-blue-800 mt-2">
              Total: R${" "}
              {finalTotal.toFixed(
                2
              )}
            </p>

            <p className="text-green-600">
              Lucro: R${" "}
              {cartProfit.toFixed(
                2
              )}
            </p>
          </div>

          <input
            className="border p-2 rounded w-full mt-4"
            type="text"
            placeholder="Nome do cliente"
            value={
              customer
            }
            onChange={(e) =>
              setCustomer(
                e.target.value
              )
            }
          />

          <select
            className="border p-2 rounded w-full mt-3"
            value={
              payment
            }
            onChange={(e) => {
              setPayment(
                e.target.value
              )

              if (
                e.target.value !==
                "Dinheiro"
              ) {
                setCashGiven(
                  ""
                )

                setChangeMethod(
                  "Dinheiro"
                )
              }
            }}
          >
            <option value="">
              Forma de pagamento
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

            <option value="Fiado">
              Fiado
            </option>
          </select>

          {payment ===
            "Dinheiro" && (
            <div className="mt-4 border rounded-lg p-4 bg-gray-50">
              <p className="font-semibold">
                💵 Pagamento em dinheiro
              </p>

              <label className="block text-sm text-gray-600 mt-3">
                Quanto o cliente entregou?
              </label>

              <input
                className="border p-2 rounded w-full mt-1"
                type="number"
                min="0"
                step="0.01"
                placeholder="Ex.: 50,00"
                value={
                  cashGiven
                }
                onChange={(e) =>
                  setCashGiven(
                    e.target.value
                  )
                }
              />

              {cashGiven !==
                "" &&
                cashGivenValue >=
                  finalTotal && (
                  <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-gray-500">
                      Troco
                    </p>

                    <p className="text-xl font-bold text-green-700">
                      R${" "}
                      {changeAmount.toFixed(
                        2
                      )}
                    </p>
                  </div>
                )}

              {cashGiven !==
                "" &&
                cashGivenValue <
                  finalTotal && (
                  <p className="text-red-600 mt-2">
                    Valor entregue insuficiente.
                  </p>
                )}

              {changeAmount >
                0 && (
                <div className="mt-4">
                  <p className="font-medium mb-2">
                    O troco será dado em:
                  </p>

                  <select
                    className="border p-2 rounded w-full"
                    value={
                      changeMethod
                    }
                    onChange={(
                      e
                    ) =>
                      setChangeMethod(
                        e.target
                          .value as
                          | "Dinheiro"
                          | "Pix"
                      )
                    }
                  >
                    <option value="Dinheiro">
                      💵 Dinheiro
                    </option>

                    <option value="Pix">
                      📱 Pix
                    </option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            onClick={
              finalizeSale
            }
            disabled={
              savingSale
            }
            className="mt-5 w-full bg-blue-800 text-white py-3 rounded-lg font-bold disabled:opacity-50"
          >
            {savingSale
              ? "Registrando venda..."
              : "Finalizar venda"}
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* FILTROS */}
      {/* ================================================== */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          🔎 Pesquisar vendas
        </h2>

        <div className="flex flex-wrap gap-4 mt-4">
          <input
            type="date"
            className="border p-2 rounded"
            value={
              startDate
            }
            onChange={(e) =>
              setStartDate(
                e.target.value
              )
            }
          />

          <input
            type="date"
            className="border p-2 rounded"
            value={
              endDate
            }
            onChange={(e) =>
              setEndDate(
                e.target.value
              )
            }
          />

          <button
            onClick={() => {
              setStartDate("")
              setEndDate("")
            }}
            className="border px-4 rounded"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* ================================================== */}
      {/* RESUMO */}
      {/* ================================================== */}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            💰 Faturamento
          </h2>

          <p className="text-2xl font-bold mt-2">
            R${" "}
            {periodTotal.toFixed(
              2
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            📈 Lucro
          </h2>

          <p className="text-2xl font-bold mt-2">
            R${" "}
            {periodProfit.toFixed(
              2
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            🚚 Fretes
          </h2>

          <p className="text-2xl font-bold mt-2">
            R${" "}
            {periodDeliveryFees.toFixed(
              2
            )}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            🛒 Quantidade vendida
          </h2>

          <p className="text-2xl font-bold mt-2">
            {periodQuantity}{" "}
            un
          </p>
        </div>
      </div>

      {/* ================================================== */}
      {/* HISTÓRICO */}
      {/* ================================================== */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          Histórico de vendas
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Clique em uma venda para ver
          todos os detalhes.
        </p>

        <div className="mt-4 space-y-3">
          {filteredSales.map(
            (sale) => (
              <button
                key={sale.id}
                onClick={() =>
                  setSelectedSale(
                    sale
                  )
                }
                className="w-full text-left border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-bold">
                      {sale.product}
                    </p>

                    <p className="text-gray-500">
                      Quantidade:{" "}
                      {Number(
                        sale.quantity ||
                          0
                      )}
                    </p>

                    <p className="text-gray-500">
                      📅{" "}
                      {formatDateTime(
                        sale.date
                      )}
                    </p>

                    <p className="text-gray-500">
                      👤{" "}
                      {sale.customer ||
                        "Cliente não informado"}
                    </p>

                    <p className="text-gray-500">
                      💳{" "}
                      {sale.payment}
                    </p>

                    <p className="text-gray-500">
                      Status:{" "}
                      {sale.status}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold">
                      R${" "}
                      {Number(
                        sale.total ||
                          0
                      ).toFixed(
                        2
                      )}
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
                          ).toFixed(
                            2
                          )}{" "}
                          {sale.change_method ===
                          "Pix"
                            ? "(Pix)"
                            : "(Dinheiro)"}
                        </p>
                      )}

                    <p className="text-green-600">
                      Lucro: R${" "}
                      {Number(
                        sale.profit ||
                          0
                      ).toFixed(
                        2
                      )}
                    </p>

                    <p className="text-blue-700 text-sm mt-2">
                      Ver detalhes →
                    </p>
                  </div>
                </div>
              </button>
            )
          )}

          {filteredSales.length ===
            0 && (
            <p className="text-gray-500">
              Nenhuma venda encontrada.
            </p>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* DETALHES DA VENDA */}
      {/* ================================================== */}

      {selectedSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6 border-b flex justify-between items-start gap-4">
              <div>
                <h2 className="text-xl font-bold">
                  Detalhes da venda
                </h2>

                <p className="text-gray-500 mt-1">
                  📅{" "}
                  {formatDateTime(
                    selectedSale.date
                  )}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelectedSale(
                    null
                  )
                }
                className="text-gray-500 hover:text-black text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Cliente
                  </p>

                  <p className="font-semibold">
                    {selectedSale.customer ||
                      "Cliente não informado"}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Pagamento
                  </p>

                  <p className="font-semibold">
                    {selectedSale.payment}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Status
                  </p>

                  <p
                    className={
                      selectedSale.status ===
                      "Pago"
                        ? "font-semibold text-green-600"
                        : "font-semibold text-orange-600"
                    }
                  >
                    {selectedSale.status}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">
                    Data e horário
                  </p>

                  <p className="font-semibold">
                    {formatDateTime(
                      selectedSale.date
                    )}
                  </p>
                </div>
              </div>

              <h3 className="font-bold text-lg mb-3">
                Produtos da venda
              </h3>

              <div className="space-y-3">
                {selectedSale.products &&
                selectedSale.products
                  .length > 0 ? (
                  selectedSale.products.map(
                    (
                      item: any,
                      index: number
                    ) => {
                      if (
                        item.type ===
                        "Copao"
                      ) {
                        return (
                          <div
                            key={`${item.id}-${index}`}
                            className="border rounded-xl p-4"
                          >
                            <div className="flex justify-between gap-4">
                              <div>
                                <p className="font-bold text-lg">
                                  🥤{" "}
                                  {
                                    item.displayName
                                  }
                                </p>

                                <p className="text-gray-500 mt-1">
                                  {
                                    item.quantity
                                  }{" "}
                                  Copão(s)
                                </p>

                                <p className="text-gray-500 mt-1">
                                  Energético:{" "}
                                  {
                                    item.energeticoName
                                  }
                                </p>

                                <p className="text-gray-500">
                                  Gelo:{" "}
                                  {
                                    item.geloName
                                  }
                                </p>

                                <p className="text-gray-500">
                                  Garrafinha:{" "}
                                  {item.useGarrafinha
                                    ? "Sim"
                                    : "Não"}
                                </p>

                                <p className="text-gray-500">
                                  Doses extras:{" "}
                                  {
                                    item.doseExtra
                                  }
                                </p>
                              </div>

                              <div className="text-right">
                                <p className="font-bold">
                                  R${" "}
                                  {Number(
                                    item.total ||
                                      0
                                  ).toFixed(
                                    2
                                  )}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 border-t pt-4">
                              <p className="font-semibold">
                                Componentes consumidos
                              </p>

                              <div className="mt-2 space-y-1">
                                {(
                                  item.stockItems ||
                                  []
                                ).map(
                                  (
                                    component: any,
                                    componentIndex: number
                                  ) => (
                                    <p
                                      key={
                                        componentIndex
                                      }
                                      className="text-gray-600"
                                    >
                                      •{" "}
                                      {
                                        component.name
                                      }{" "}
                                      ×{" "}
                                      {
                                        component.quantity
                                      }
                                    </p>
                                  )
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500">
                                  Preço
                                </p>

                                <p className="font-semibold">
                                  R${" "}
                                  {Number(
                                    item.salePrice ||
                                      0
                                  ).toFixed(
                                    2
                                  )}
                                </p>
                              </div>

                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-xs text-gray-500">
                                  Custo
                                </p>

                                <p className="font-semibold">
                                  R${" "}
                                  {Number(
                                    item.purchasePrice ||
                                      0
                                  ).toFixed(
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
                                  {Number(
                                    item.profit ||
                                      0
                                  ).toFixed(
                                    2
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      }

                      const itemQuantity =
                        Number(
                          item.quantity ||
                            0
                        )

                      const itemSalePrice =
                        Number(
                          item.salePrice ||
                            0
                        )

                      const itemPurchasePrice =
                        Number(
                          item.purchasePrice ||
                            0
                        )

                      const itemTotal =
                        Number(
                          item.total ||
                            itemSalePrice *
                              itemQuantity
                        )

                      const itemProfit =
                        (
                          itemSalePrice -
                          itemPurchasePrice
                        ) *
                        itemQuantity

                      return (
                        <div
                          key={`${item.id}-${item.saleType}-${index}`}
                          className="border rounded-xl p-4"
                        >
                          <div className="flex justify-between gap-4">
                            <div>
                              <p className="font-bold">
                                {item.displayName ||
                                  item.name}
                              </p>

                              <p className="text-gray-500 mt-1">
                                {
                                  itemQuantity
                                }{" "}
                                {item.saleType ===
                                "Fardo"
                                  ? "fardo(s)"
                                  : "unidade(s)"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="font-bold">
                                R${" "}
                                {itemTotal.toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">
                                Preço de venda
                              </p>

                              <p className="font-semibold">
                                R${" "}
                                {itemSalePrice.toFixed(
                                  2
                                )}
                              </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">
                                Custo
                              </p>

                              <p className="font-semibold">
                                R${" "}
                                {itemPurchasePrice.toFixed(
                                  2
                                )}
                              </p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-3">
                              <p className="text-xs text-gray-500">
                                Lucro deste produto
                              </p>

                              <p className="font-bold text-green-700">
                                R${" "}
                                {itemProfit.toFixed(
                                  2
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    }
                  )
                ) : (
                  <p className="text-gray-500">
                    Os detalhes dos produtos não foram salvos nesta venda.
                  </p>
                )}
              </div>

              <div className="border-t mt-6 pt-5">
                <div className="flex justify-between text-gray-600">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    R${" "}
                    {(
                      Number(
                        selectedSale.total ||
                          0
                      ) -
                      Number(
                        selectedSale.delivery_fee ||
                          0
                      )
                    ).toFixed(
                      2
                    )}
                  </span>
                </div>

                {Number(
                  selectedSale.delivery_fee ||
                    0
                ) > 0 && (
                  <div className="flex justify-between text-gray-600 mt-2">
                    <span>
                      🚚 Frete
                    </span>

                    <span>
                      R${" "}
                      {Number(
                        selectedSale.delivery_fee
                      ).toFixed(
                        2
                      )}
                    </span>
                  </div>
                )}

                {Number(
                  selectedSale.change_amount ||
                    0
                ) > 0 && (
                  <div className="flex justify-between text-gray-600 mt-2">
                    <span>
                      Troco
                    </span>

                    <span>
                      R${" "}
                      {Number(
                        selectedSale.change_amount
                      ).toFixed(
                        2
                      )}{" "}
                      {selectedSale.change_method ===
                      "Pix"
                        ? "(Pix)"
                        : "(Dinheiro)"}
                    </span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-xl mt-4">
                  <span>
                    Total
                  </span>

                  <span>
                    R${" "}
                    {Number(
                      selectedSale.total ||
                        0
                    ).toFixed(
                      2
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-green-700 font-bold mt-2">
                  <span>
                    Lucro da venda
                  </span>

                  <span>
                    R${" "}
                    {Number(
                      selectedSale.profit ||
                        0
                    ).toFixed(
                      2
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() =>
                    setSelectedSale(
                      null
                    )
                  }
                  className="border px-4 py-2 rounded-lg"
                >
                  Fechar
                </button>

                <button
                  onClick={() =>
                    deleteSale(
                      selectedSale.id
                    )
                  }
                  className="bg-red-600 text-white px-4 py-2 rounded-lg"
                >
                  🗑 Excluir venda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Vendas