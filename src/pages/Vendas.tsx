
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Vendas() {
  const [products, setProducts] = useState<any[]>([])
  const [sales, setSales] = useState<any[]>([])

  const [productId, setProductId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [cart, setCart] = useState<any[]>([])

  const [saleType, setSaleType] =
    useState<"Unidade" | "Fardo">("Unidade")

  const [customer, setCustomer] = useState("")
  const [payment, setPayment] = useState("")
  const [discount, setDiscount] = useState("")
  const [hasDelivery, setHasDelivery] = useState(false)
  const [deliveryFee, setDeliveryFee] = useState(0)

  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    async function loadData() {
      const {
        data: settingsData,
        error: settingsError,
      } = await supabase
        .from("settings")
        .select("delivery_fee")
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

      if (productsData) {
        const formattedProducts =
          productsData.map((item: any) => ({
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
              item.sale_price_package !== null &&
              item.sale_price_package !== undefined
                ? Number(
                    item.sale_price_package
                  )
                : null,

            stock:
              Number(
                item.stock || 0
              ),
          }))

        setProducts(
          formattedProducts
        )
      }

      if (salesData) {
        setSales(salesData)
      }
    }

    loadData()
  }, [])

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
          productSearch.toLowerCase()
        )
    )

  function addToCart() {
    const product =
      products.find(
        (item) =>
          item.id === Number(productId)
      )

    if (!product) {
      alert("Selecione um produto!")
      return
    }

    const qtd = Number(quantity)

    if (qtd <= 0) {
      alert("Quantidade inválida")
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
            product.salePricePackage || 0
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
          item.id === product.id &&
          item.saleType === saleType
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
      alert("Estoque insuficiente!")
      return
    }

    if (alreadyInCart) {
      setCart(
        cart.map((item) =>
          item.id === product.id &&
          item.saleType === saleType
            ? {
                ...item,

                quantity:
                  item.quantity + qtd,

                stockQuantity:
                  item.stockQuantity +
                  stockQuantity,

                total:
                  (item.quantity + qtd) *
                  item.salePrice,
              }
            : item
        )
      )
    } else {
      setCart([
        ...cart,

        {
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
              product.itemsPerPackage || 0
            ),

          salePrice: price,

          purchasePrice:
            saleType === "Fardo"
              ? Number(
                  product.purchasePrice || 0
                ) *
                Number(
                  product.itemsPerPackage ||
                    0
                )
              : Number(
                  product.purchasePrice || 0
                ),

          total:
            price * qtd,
        },
      ])
    }

    setProductId("")
    setQuantity("")
    setProductSearch("")
    setSaleType("Unidade")
  }

  function removeFromCart(
    id: number,
    saleType: "Unidade" | "Fardo"
  ) {
    setCart(
      cart.filter(
        (item) =>
          !(
            item.id === id &&
            item.saleType === saleType
          )
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
      ? deliveryFee
      : 0

  const discountValue =
    Number(discount || 0)

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
        (
          Number(
            item.salePrice || 0
          ) -
          Number(
            item.purchasePrice || 0
          )
        ) *
          Number(
            item.quantity || 0
          ),
      0
    )

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

    if (!confirmDelete) return

    if (sale.products) {
      for (
        const soldProduct of sale.products
      ) {
        const product =
          products.find(
            (item) =>
              item.id ===
              soldProduct.id
          )

        if (!product) continue

        const quantityToReturn =
          Number(
            soldProduct.stockQuantity ||
              soldProduct.quantity ||
              0
          )

        const newStock =
          Number(
            product.stock || 0
          ) +
          quantityToReturn

        const {
          error,
        } = await supabase
          .from("products")
          .update({
            stock: newStock,
          })
          .eq(
            "id",
            product.id
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

            type: "Entrada",

            quantity:
              quantityToReturn,

            date:
              new Date().toISOString(),
          })

        if (movementError) {
          console.error(
            "ERRO AO REGISTRAR DEVOLUÇÃO NO HISTÓRICO:",
            movementError
          )

          alert(
            "O estoque foi devolvido, mas houve erro no histórico."
          )

          return
        }
      }
    }

    const {
      error,
    } = await supabase
      .from("sales")
      .delete()
      .eq("id", id)

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

  
const updatedProducts =
  products.map(
    (product) => {
      const totalQuantitySold =
        cart
          .filter(
            (cartItem) =>
              cartItem.id ===
              product.id
          )
          .reduce(
            (
              total: number,
              cartItem: any
            ) =>
              total +
              Number(
                cartItem.stockQuantity ||
                  cartItem.quantity ||
                  0
              ),
            0
          )

      if (totalQuantitySold > 0) {
        return {
          ...product,

          stock:
            Number(
              product.stock || 0
            ) -
            totalQuantitySold,
        }
      }

      return product
    }
  )



    setProducts(
      updatedProducts
    )

    setSales(
      sales.filter(
        (item) =>
          item.id !== id
      )
    )

    alert(
      "Venda excluída e estoque devolvido!"
    )
  }

  async function finalizeSale() {
    if (cart.length === 0) {
      alert("Carrinho vazio!")
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

    for (
      const item of cart
    ) {
      const product =
        products.find(
          (p) =>
            p.id === item.id
        )

      if (!product) {
        alert(
          `Produto ${item.name} não encontrado.`
        )
        return
      }

      if (
        Number(
          item.stockQuantity ||
            item.quantity ||
            0
        ) >
        Number(
          product.stock || 0
        )
      ) {
        alert(
          `Estoque insuficiente para ${item.name}.`
        )
        return
      }
    }

    const total =
      finalTotal

    const profit =
      cartProfit -
      discountValue

    for (
      const item of cart
    ) {
      const product =
        products.find(
          (p) =>
            p.id === item.id
        )

      if (!product) {
        alert(
          `Produto ${item.name} não encontrado.`
        )
        return
      }

      

      const quantityToRemove =
  Number(
    item.stockQuantity ||
      item.quantity ||
      0
  )

const newStock =
  Number(
    product.stock || 0
  ) -
  quantityToRemove

const {
  error: stockError,
} = await supabase
  .from("products")
  .update({
    stock: newStock,
  })
  .eq(
    "id",
    product.id
  )

if (stockError) {
  console.error(
    "ERRO AO ATUALIZAR ESTOQUE:",
    stockError
  )

  alert(
    "Não foi possível atualizar o estoque."
  )

  return
}

const {
  data: movementData,
  error: movementError,
} = await supabase
  .from("stock_movements")
  .insert({
  product_id: product.id,
  product_name: product.name,
  type: "Saída",
  quantity: quantityToRemove,
  date: new Date().toISOString(),
})
  .select()

console.log("MOVIMENTAÇÃO SALVA:", movementData)
console.log("ERRO REAL DO HISTÓRICO:", movementError)

if (movementError) {
  alert(
    "ERRO REAL DO HISTÓRICO:\n\n" +
    `Código: ${movementError.code}\n` +
    `Mensagem: ${movementError.message}\n` +
    `Detalhes: ${movementError.details}\n` +
    `Hint: ${movementError.hint}`
  )

  return
}

    }

    const saleData = {
      products: cart,

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
          (total, item) =>
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
        payment === "Fiado"
          ? "Pendente"
          : "Pago",

      date:
        new Date().toISOString(),
    }

    const {
      data: newSaleData,
      error: saleError,
    } = await supabase
      .from("sales")
      .insert(saleData)
      .select()

   if (saleError) {
  console.error(
    "ERRO AO SALVAR VENDA:",
    saleError
  )

  alert(
    `Erro ao registrar a venda: ${saleError.message}`
  )

  return
}

      
  

    const updatedProducts =
      products.map(
        (product) => {
          const item =
            cart.find(
              (cartItem) =>
                cartItem.id ===
                product.id
            )

          if (item) {
            return {
              ...product,

              stock:
                Number(
                  product.stock || 0
                ) -
                Number(
                  item.stockQuantity ||
                    item.quantity ||
                    0
                ),
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
    setHasDelivery(false)
    setProductSearch("")
    setProductId("")
    setQuantity("")

    alert(
      "Venda registrada!"
    )
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
          saleDate < start
        ) {
          return false
        }

        if (
          end &&
          saleDate > end
        ) {
          return false
        }

        return true
      }
    )

  const paidSales =
    filteredSales.filter(
      (sale) =>
        sale.status === "Pago"
    )

  const periodTotal =
  paidSales.reduce(
    (total, sale) =>
      total +
      Number(sale.total || 0) -
      Number(sale.delivery_fee || 0),
    0
  )

const periodProfit =
  paidSales.reduce(
    (total, sale) =>
      total +
      Number(sale.profit || 0),
    0
  )

const periodDeliveryFees =
  paidSales.reduce(
    (total, sale) =>
      total +
      Number(sale.delivery_fee || 0),
    0
  )

  const periodQuantity =
    paidSales.reduce(
      (total, sale) => {
        if (!sale.products) {
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
                item.stockQuantity ||
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

      <div className="grid grid-cols-2 gap-6 mt-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold text-lg">
            🛒 Nova venda
          </h2>

          <input
            className="border p-2 rounded w-full mt-4"
            placeholder="Pesquisar produto..."
            value={productSearch}
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
                  key={product.id}
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
              value={saleType}
              onChange={(e) =>
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
                  Number(productId)
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
            value={quantity}
            onChange={(e) =>
              setQuantity(
                e.target.value
              )
            }
          />

          <button
            onClick={addToCart}
            className="mt-4 bg-green-700 text-white px-5 py-2 rounded-lg"
          >
            Adicionar ao carrinho
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold text-lg">
            🛒 Carrinho
          </h2>

          {cart.length === 0 ? (
            <p className="text-gray-500 mt-4">
              Nenhum produto adicionado.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {cart.map(
                (item) => (
                  <div
                    key={`${item.id}-${item.saleType}`}
                    className="border rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold">
                        {item.displayName ||
                          item.name}
                      </p>

                      <p className="text-gray-500">
                        {item.quantity}{" "}
                        {item.saleType ===
                        "Fardo"
                          ? "fardo(s)"
                          : "unidade(s)"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p>
                        R${" "}
                        {Number(
                          item.total || 0
                        ).toFixed(2)}
                      </p>

                      <button
                        onClick={() =>
                          removeFromCart(
                            item.id,
                            item.saleType
                          )
                        }
                        className="text-red-600 text-sm mt-1"
                      >
                        Remover
                      </button>
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
                checked={hasDelivery}
                onChange={(e) =>
                  setHasDelivery(
                    e.target.checked
                  )
                }
              />

              <span className="font-medium">
                🚚 Adicionar frete
              </span>
            </label>

            {hasDelivery && (
              <p className="text-gray-600 mt-2">
                Frete: R${" "}
                {deliveryFee.toFixed(2)}
              </p>
            )}

            <p className="font-bold text-lg mt-3">
              Subtotal: R${" "}
              {cartTotal.toFixed(2)}
            </p>

            <input
              className="border p-2 rounded w-full mt-3"
              type="number"
              min="0"
              placeholder="Desconto em R$"
              value={discount}
              onChange={(e) =>
                setDiscount(
                  e.target.value
                )
              }
            />

            {discountValue > 0 && (
              <p className="text-red-600 mt-2">
                Desconto: -R${" "}
                {discountValue.toFixed(2)}
              </p>
            )}

            <p className="font-bold text-xl text-blue-800 mt-2">
              Total: R${" "}
              {finalTotal.toFixed(2)}
            </p>

            <p className="text-green-600">
              Lucro: R${" "}
              {cartProfit.toFixed(2)}
            </p>
          </div>

          <input
            className="border p-2 rounded w-full mt-4"
            type="text"
            placeholder="Nome do cliente"
            value={customer}
            onChange={(e) =>
              setCustomer(
                e.target.value
              )
            }
          />

          <select
            className="border p-2 rounded w-full mt-3"
            value={payment}
            onChange={(e) =>
              setPayment(
                e.target.value
              )
            }
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

          <button
            onClick={finalizeSale}
            className="mt-5 w-full bg-blue-800 text-white py-3 rounded-lg font-bold"
          >
            Finalizar venda
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          🔎 Pesquisar vendas
        </h2>

        <div className="flex gap-4 mt-4">
          <input
            type="date"
            className="border p-2 rounded"
            value={startDate}
            onChange={(e) =>
              setStartDate(
                e.target.value
              )
            }
          />

          <input
            type="date"
            className="border p-2 rounded"
            value={endDate}
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

     <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            💰 Faturamento
          </h2>

          <p className="text-2xl font-bold mt-2">
            R${" "}
            {periodTotal.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            📈 Lucro
          </h2>
          <div className="bg-white p-6 rounded-xl shadow">
  <h2 className="text-gray-500">
    🚚 Fretes
  </h2>

  <p className="text-2xl font-bold mt-2">
    R$ {periodDeliveryFees.toFixed(2)}
  </p>
</div>

          <p className="text-2xl font-bold mt-2">
            R${" "}
            {periodProfit.toFixed(2)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            🛒 Quantidade vendida
          </h2>

          <p className="text-2xl font-bold mt-2">
            {periodQuantity} un
          </p>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          Histórico de vendas
        </h2>

        <div className="mt-4 space-y-3">
          {filteredSales.map(
            (sale) => (
              <div
                key={sale.id}
                className="border rounded-lg p-4 flex justify-between"
              >
                <div>
                  <p className="font-bold">
                    {sale.product}
                  </p>

                  <p className="text-gray-500">
                    Quantidade:{" "}
                    {Number(
                      sale.quantity || 0
                    )}
                  </p>

                  <p className="text-gray-500">
                    📅{" "}
                    {new Date(
                      sale.date
                    ).toLocaleString(
                      "pt-BR"
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

                  {Number(
                    sale.delivery_fee || 0
                  ) > 0 && (
                    <p className="text-gray-500">
                      🚚 Frete: R${" "}
                      {Number(
                        sale.delivery_fee
                      ).toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="font-bold">
                    R${" "}
                    {Number(
                      sale.total || 0
                    ).toFixed(2)}
                  </p>

                  <p className="text-green-600">
                    Lucro: R${" "}
                    {Number(
                      sale.profit || 0
                    ).toFixed(2)}
                  </p>

                  <button
                    onClick={() =>
                      deleteSale(
                        sale.id
                      )
                    }
                    className="mt-2 bg-red-600 text-white px-3 py-1 rounded"
                  >
                    🗑 Excluir
                  </button>
                </div>
              </div>
            )
          )}

          {filteredSales.length === 0 && (
            <p className="text-gray-500">
              Nenhuma venda encontrada.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Vendas
