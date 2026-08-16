import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

interface Copao {
  id: number
  name: string
  sale_price: number
  dose_product_id: number
  dose_extra_price: number
  garrafinha_enabled: boolean
  garrafinha_quantity: number
  copo_product_id: number | null
  garrafinha_product_id: number | null
  active: boolean
}

interface Product {
  id: number
  name: string
  category: string
  brand?: string
  flavor?: string
  volume?: string
  purchase_price?: number
  sale_price?: number
  stock?: number
}

function Copoes() {
  const [copoes, setCopoes] = useState<Copao[]>([])

  const [products, setProducts] = useState<Product[]>([])
  const [doseProducts, setDoseProducts] = useState<Product[]>([])
  const [copoProducts, setCopoProducts] = useState<Product[]>([])
  const [garrafinhaProducts, setGarrafinhaProducts] =
    useState<Product[]>([])

  const [name, setName] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [doseProductId, setDoseProductId] = useState("")
  const [doseExtraPrice, setDoseExtraPrice] = useState("")

  const [copoProductId, setCopoProductId] = useState("")
  const [garrafinhaProductId, setGarrafinhaProductId] =
    useState("")

  const [garrafinhaEnabled, setGarrafinhaEnabled] =
    useState(false)

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)

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

    if (copoesError) {
      console.error(
        "ERRO AO CARREGAR COPÕES:",
        copoesError
      )
    }

    const {
      data: productsData,
      error: productsError,
    } = await supabase
      .from("products")
      .select("*")
      .order("name", {
        ascending: true,
      })

    if (productsError) {
      console.error(
        "ERRO AO CARREGAR PRODUTOS:",
        productsError
      )
    }

    if (copoesData) {
      setCopoes(copoesData)
    }

    if (productsData) {
      const formattedProducts =
        productsData.map((product: any) => ({
          ...product,
          purchase_price: Number(
            product.purchase_price || 0
          ),
          sale_price: Number(
            product.sale_price || 0
          ),
          stock: Number(
            product.stock || 0
          ),
        }))

      setProducts(formattedProducts)

      const normalize = (value: string) =>
        String(value || "")
          .trim()
          .toLowerCase()

      setDoseProducts(
        formattedProducts.filter(
          (product: Product) =>
            normalize(
              product.category
            ) === "dose"
        )
      )

      setCopoProducts(
        formattedProducts.filter(
          (product: Product) =>
            normalize(
              product.category
            ) === "copo"
        )
      )

      setGarrafinhaProducts(
        formattedProducts.filter(
          (product: Product) => {
            const category =
              normalize(
                product.category
              )

            const name =
              normalize(
                product.name
              )

            return (
              category ===
                "garrafinha" ||
              name.includes(
                "garrafinha"
              )
            )
          }
        )
      )
    }

    setLoading(false)
  }

  function clearForm() {
    setName("")
    setSalePrice("")
    setDoseProductId("")
    setDoseExtraPrice("")
    setCopoProductId("")
    setGarrafinhaProductId("")
    setGarrafinhaEnabled(false)
    setEditingId(null)
  }

  function editCopao(copao: Copao) {
    setEditingId(copao.id)

    setName(copao.name)

    setSalePrice(
      String(copao.sale_price)
    )

    setDoseProductId(
      String(copao.dose_product_id)
    )

    setDoseExtraPrice(
      String(copao.dose_extra_price)
    )

    setCopoProductId(
      copao.copo_product_id
        ? String(
            copao.copo_product_id
          )
        : ""
    )

    setGarrafinhaEnabled(
      copao.garrafinha_enabled
    )

    setGarrafinhaProductId(
      copao.garrafinha_product_id
        ? String(
            copao.garrafinha_product_id
          )
        : ""
    )

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  function getProduct(
    id: string
  ) {
    return products.find(
      (product) =>
        product.id === Number(id)
    )
  }

  function getPurchasePrice(
    id: string
  ) {
    return Number(
      getProduct(id)
        ?.purchase_price || 0
    )
  }

  function calculateBaseCost() {
    const doseCost =
      getPurchasePrice(
        doseProductId
      ) * 2

    const copoCost =
      getPurchasePrice(
        copoProductId
      )

    const garrafinhaCost =
      garrafinhaEnabled
        ? getPurchasePrice(
            garrafinhaProductId
          ) * 2
        : 0

    return (
      doseCost +
      copoCost +
      garrafinhaCost
    )
  }

  const baseCost =
    calculateBaseCost()

  const baseSalePrice =
    Number(
      String(salePrice || "0").replace(
        ",",
        "."
      )
    )

  const baseProfit =
    baseSalePrice -
    baseCost

  const doseExtraPriceValue =
    Number(
      String(
        doseExtraPrice || "0"
      ).replace(",", ".")
    )

  const doseExtraCost =
    getPurchasePrice(
      doseProductId
    )

  const doseExtraProfit =
    doseExtraPriceValue -
    doseExtraCost

  async function saveCopao() {
    if (!name.trim()) {
      alert(
        "Informe o nome do copão."
      )
      return
    }

    const price = Number(
      String(salePrice).replace(
        ",",
        "."
      )
    )

    const extraPrice =
      Number(
        String(
          doseExtraPrice ||
            "0"
        ).replace(",", ".")
      )

    if (
      isNaN(price) ||
      price <= 0
    ) {
      alert(
        "Informe um preço base válido."
      )
      return
    }

    if (!doseProductId) {
      alert(
        "Selecione a dose."
      )
      return
    }

    if (!copoProductId) {
      alert(
        "Selecione o copo."
      )
      return
    }

    if (
      garrafinhaEnabled &&
      !garrafinhaProductId
    ) {
      alert(
        "Selecione a garrafinha."
      )
      return
    }

    if (
      isNaN(extraPrice) ||
      extraPrice < 0
    ) {
      alert(
        "Informe um valor válido para a dose extra."
      )
      return
    }

    setSaving(true)

    const copaoData = {
      name: name.trim(),

      sale_price:
        price,

      dose_product_id:
        Number(
          doseProductId
        ),

      dose_extra_price:
        extraPrice,

      copo_product_id:
        Number(
          copoProductId
        ),

      garrafinha_enabled:
        garrafinhaEnabled,

      garrafinha_quantity:
        2,

      garrafinha_product_id:
        garrafinhaEnabled
          ? Number(
              garrafinhaProductId
            )
          : null,

      active: true,
    }

    let copaoId =
      editingId

    if (editingId) {
      const {
        error,
      } = await supabase
        .from("copoes")
        .update(copaoData)
        .eq(
          "id",
          editingId
        )

      if (error) {
        console.error(
          "ERRO AO ATUALIZAR COPÃO:",
          error
        )

        alert(
          `Erro ao atualizar copão:\n\n${error.message}`
        )

        setSaving(false)
        return
      }
    } else {
      const {
        data,
        error,
      } = await supabase
        .from("copoes")
        .insert(copaoData)
        .select()

      if (error) {
        console.error(
          "ERRO AO CRIAR COPÃO:",
          error
        )

        alert(
          `Erro ao criar copão:\n\n${error.message}`
        )

        setSaving(false)
        return
      }

      if (
        !data ||
        data.length === 0
      ) {
        alert(
          "O copão não foi criado."
        )

        setSaving(false)
        return
      }

      copaoId =
        data[0].id
    }

    if (!copaoId) {
      setSaving(false)
      return
    }

    /*
    COMPONENTES FIXOS DO COPÃO

    O produto específico de energético
    e gelo será escolhido apenas na venda.
    */

    await supabase
      .from(
        "copao_components"
      )
      .delete()
      .eq(
        "copao_id",
        copaoId
      )

    const components = [
      {
        copao_id:
          copaoId,

        component_type:
          "energetico",

        quantity: 1,
      },

      {
        copao_id:
          copaoId,

        component_type:
          "gelo",

        quantity: 1,
      },

      {
        copao_id:
          copaoId,

        component_type:
          "copo",

        quantity: 1,
      },
    ]

    const {
      error:
        componentsError,
    } = await supabase
      .from(
        "copao_components"
      )
      .insert(
        components
      )

    if (componentsError) {
      console.error(
        "ERRO AO SALVAR COMPONENTES:",
        componentsError
      )

      alert(
        `Copão salvo, mas houve erro nos componentes:\n\n${componentsError.message}`
      )

      setSaving(false)
      return
    }

    alert(
      editingId
        ? "Copão atualizado com sucesso!"
        : "Copão criado com sucesso!"
    )

    clearForm()

    await loadData()

    setSaving(false)
  }

  async function deleteCopao(
    id: number
  ) {
    const confirmDelete =
      window.confirm(
        "Excluir este copão?"
      )

    if (!confirmDelete) {
      return
    }

    const {
      error,
    } = await supabase
      .from("copoes")
      .update({
        active: false,
      })
      .eq(
        "id",
        id
      )

    if (error) {
      console.error(
        "ERRO AO EXCLUIR COPÃO:",
        error
      )

      alert(
        `Erro ao excluir copão:\n\n${error.message}`
      )

      return
    }

    setCopoes(
      copoes.filter(
        (copao) =>
          copao.id !== id
      )
    )
  }

  function getProductName(
    id: number | null
  ) {
    if (!id) {
      return "Não definido"
    }

    const product =
      products.find(
        (item) =>
          item.id === id
      )

    if (!product) {
      return "Produto não encontrado"
    }

    return (
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
  }

  return (
    <div>
      <h1 className="text-3xl font-bold">
        Copões
      </h1>

      <p className="mt-2 text-gray-500">
        Cadastro e controle das receitas
        de Copões da ZERO GRAU
      </p>

      {/* ================================================== */}
      {/* FORMULÁRIO */}
      {/* ================================================== */}

      <div className="mt-8 bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-bold">
          {editingId
            ? "Editar copão"
            : "Novo copão"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome do copão
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Ex.: Copão Red Label"
              className="border rounded-lg px-4 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Preço de venda base
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                salePrice
              }
              onChange={(e) =>
                setSalePrice(
                  e.target.value
                )
              }
              placeholder="Ex.: 35,00"
              className="border rounded-lg px-4 py-2 w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Dose usada
            </label>

            <select
              value={
                doseProductId
              }
              onChange={(e) =>
                setDoseProductId(
                  e.target.value
                )
              }
              className="border rounded-lg px-4 py-2 w-full bg-white"
            >
              <option value="">
                Selecione a dose
              </option>

              {doseProducts.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {product.name}
                    {product.brand
                      ? ` • ${product.brand}`
                      : ""}
                    {product.volume
                      ? ` • ${product.volume}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Copo usado
            </label>

            <select
              value={
                copoProductId
              }
              onChange={(e) =>
                setCopoProductId(
                  e.target.value
                )
              }
              className="border rounded-lg px-4 py-2 w-full bg-white"
            >
              <option value="">
                Selecione o copo
              </option>

              {copoProducts.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {product.name}
                    {product.volume
                      ? ` • ${product.volume}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Valor da dose extra
            </label>

            <input
              type="number"
              min="0"
              step="0.01"
              value={
                doseExtraPrice
              }
              onChange={(e) =>
                setDoseExtraPrice(
                  e.target.value
                )
              }
              placeholder="Ex.: 5,00"
              className="border rounded-lg px-4 py-2 w-full"
            />

            <p className="text-xs text-gray-500 mt-1">
              O custo dessa dose é puxado automaticamente do produto Dose.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Garrafinha
            </label>

            <select
              value={
                garrafinhaProductId
              }
              onChange={(e) =>
                setGarrafinhaProductId(
                  e.target.value
                )
              }
              disabled={
                !garrafinhaEnabled
              }
              className="border rounded-lg px-4 py-2 w-full bg-white disabled:bg-gray-100"
            >
              <option value="">
                Selecione a garrafinha
              </option>

              {garrafinhaProducts.map(
                (product) => (
                  <option
                    key={
                      product.id
                    }
                    value={
                      product.id
                    }
                  >
                    {product.name}
                    {product.volume
                      ? ` • ${product.volume}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {doseProducts.length ===
          0 && (
          <p className="text-sm text-orange-600 mt-3">
            Cadastre pelo menos um produto na categoria "Dose" antes de criar um Copão.
          </p>
        )}

        {copoProducts.length ===
          0 && (
          <p className="text-sm text-orange-600 mt-2">
            Cadastre pelo menos um produto na categoria "Copo".
          </p>
        )}

        <div className="mt-5 border rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={
                garrafinhaEnabled
              }
              onChange={(e) => {
                setGarrafinhaEnabled(
                  e.target.checked
                )

                if (
                  !e.target.checked
                ) {
                  setGarrafinhaProductId(
                    ""
                  )
                }
              }}
            />

            <div>
              <p className="font-semibold">
                Usar garrafinha
              </p>

              <p className="text-sm text-gray-500">
                2 unidades no padrão. Cada dose extra adiciona mais 1.
              </p>
            </div>
          </label>
        </div>

        {/* ================================================== */}
        {/* RESUMO DE CUSTOS */}
        {/* ================================================== */}

        <div className="mt-5 bg-gray-50 rounded-xl p-5">
          <h3 className="font-bold text-lg">
            Resumo de custos
          </h3>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>
                Dose × 2
              </span>

              <span>
                R${" "}
                {(
                  getPurchasePrice(
                    doseProductId
                  ) * 2
                ).toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Copo × 1
              </span>

              <span>
                R${" "}
                {getPurchasePrice(
                  copoProductId
                ).toFixed(2)}
              </span>
            </div>

            {garrafinhaEnabled && (
              <div className="flex justify-between">
                <span>
                  Garrafinha × 2
                </span>

                <span>
                  R${" "}
                  {(
                    getPurchasePrice(
                      garrafinhaProductId
                    ) * 2
                  ).toFixed(2)}
                </span>
              </div>
            )}

            <div className="border-t pt-3 flex justify-between font-bold">
              <span>
                Custo base
              </span>

              <span>
                R${" "}
                {baseCost.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Preço de venda base
              </span>

              <span>
                R${" "}
                {baseSalePrice.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between text-green-700 font-bold">
              <span>
                Lucro base
              </span>

              <span>
                R${" "}
                {baseProfit.toFixed(2)}
              </span>
            </div>

            <div className="border-t pt-3 mt-3 flex justify-between">
              <span>
                Custo de 1 dose extra
              </span>

              <span>
                R${" "}
                {doseExtraCost.toFixed(
                  2
                )}
              </span>
            </div>

            <div className="flex justify-between">
              <span>
                Preço de 1 dose extra
              </span>

              <span>
                R${" "}
                {doseExtraPriceValue.toFixed(
                  2
                )}
              </span>
            </div>

            <div className="flex justify-between text-blue-700 font-bold">
              <span>
                Lucro de 1 dose extra
              </span>

              <span>
                R${" "}
                {doseExtraProfit.toFixed(
                  2
                )}
              </span>
            </div>

            <p className="text-xs text-gray-500 pt-2">
              Energético e gelo não entram no custo base porque serão escolhidos na hora da venda.
            </p>
          </div>
        </div>

        <div className="mt-5 bg-gray-50 rounded-lg p-4">
          <p className="font-semibold">
            Composição padrão
          </p>

          <div className="mt-3 space-y-2 text-gray-700">
            <p>
              🥃{" "}
              {getProductName(
                Number(
                  doseProductId
                )
              )}{" "}
              →{" "}
              <strong>
                2 doses
              </strong>
            </p>

            <p>
              ⚡ Energético →{" "}
              <strong>
                1 unidade
              </strong>{" "}
              <span className="text-gray-500">
                (escolhido na venda)
              </span>
            </p>

            <p>
              🧊 Gelo →{" "}
              <strong>
                1 unidade
              </strong>{" "}
              <span className="text-gray-500">
                (escolhido na venda)
              </span>
            </p>

            <p>
              🥤{" "}
              {getProductName(
                Number(
                  copoProductId
                )
              )}{" "}
              →{" "}
              <strong>
                1 unidade
              </strong>
            </p>

            {garrafinhaEnabled && (
              <p>
                🧴{" "}
                {getProductName(
                  Number(
                    garrafinhaProductId
                  )
                )}{" "}
                →{" "}
                <strong>
                  2 unidades
                </strong>
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={
              saveCopao
            }
            disabled={
              saving
            }
            className="bg-blue-800 text-white px-5 py-2 rounded-lg font-bold disabled:opacity-50"
          >
            {saving
              ? "Salvando..."
              : editingId
              ? "Atualizar copão"
              : "Salvar copão"}
          </button>

          {editingId && (
            <button
              onClick={
                clearForm
              }
              className="border px-5 py-2 rounded-lg"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* ================================================== */}
      {/* LISTA */}
      {/* ================================================== */}

      <div className="mt-8">
        <h2 className="text-xl font-bold">
          Copões cadastrados
        </h2>

        {loading ? (
          <p className="text-gray-500 mt-4">
            Carregando...
          </p>
        ) : copoes.length ===
          0 ? (
          <div className="bg-white rounded-xl shadow p-6 mt-4">
            <p className="text-gray-500">
              Nenhum copão cadastrado.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">
            {copoes.map(
              (copao) => {
                const doseCost =
                  getPurchasePrice(
                    String(
                      copao.dose_product_id
                    )
                  ) * 2

                const copoCost =
                  getPurchasePrice(
                    String(
                      copao.copo_product_id ||
                        ""
                    )
                  )

                const garrafinhaCost =
                  copao.garrafinha_enabled
                    ? getPurchasePrice(
                        String(
                          copao.garrafinha_product_id ||
                            ""
                        )
                      ) * 2
                    : 0

                const totalCost =
                  doseCost +
                  copoCost +
                  garrafinhaCost

                const profit =
                  Number(
                    copao.sale_price || 0
                  ) -
                  totalCost

                return (
                  <div
                    key={
                      copao.id
                    }
                    className="bg-white rounded-xl shadow p-5"
                  >
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-bold">
                          {copao.name}
                        </h3>

                        <p className="text-gray-500 mt-1">
                          Dose:{" "}
                          {getProductName(
                            copao.dose_product_id
                          )}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Venda
                        </p>

                        <p className="text-xl font-bold text-green-700">
                          R${" "}
                          {Number(
                            copao.sale_price
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Custo base
                        </p>

                        <p className="font-semibold">
                          R${" "}
                          {totalCost.toFixed(
                            2
                          )}
                        </p>
                      </div>

                      <div className="bg-green-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Lucro base
                        </p>

                        <p className="font-bold text-green-700">
                          R${" "}
                          {profit.toFixed(
                            2
                          )}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Dose
                        </p>

                        <p className="font-semibold">
                          2 unidades
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Dose extra
                        </p>

                        <p className="font-semibold">
                          R${" "}
                          {Number(
                            copao.dose_extra_price
                          ).toFixed(
                            2
                          )}
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Copo
                        </p>

                        <p className="font-semibold">
                          1 unidade
                        </p>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">
                          Garrafinha
                        </p>

                        <p className="font-semibold">
                          {copao.garrafinha_enabled
                            ? "2 unidades • opcional"
                            : "Não usa"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-5">
                      <button
                        onClick={() =>
                          editCopao(
                            copao
                          )
                        }
                        className="border px-4 py-2 rounded-lg"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          deleteCopao(
                            copao.id
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                )
              }
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Copoes