import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

interface Copao {
  id: number
  name: string
  sale_price: number
  dose_product_id: number | null
  dose_extra_price: number
  copo_product_id: number | null
  garrafinha_enabled?: boolean
  garrafinha_quantity?: number
  garrafinha_product_id?: number | null
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

interface CopaoComponent {
  id?: number
  copao_id?: number
  product_id: number
  quantity: number
  unit_type: string
  role: string
  optional: boolean
  component_type?: string
  product?: Product
}

function Copoes() {
  const [copoes, setCopoes] = useState<Copao[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [components, setComponents] = useState<
    Record<number, CopaoComponent[]>
  >({})

  const [name, setName] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [doseExtraPrice, setDoseExtraPrice] = useState("")

  const [editingId, setEditingId] =
    useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [recipeComponents, setRecipeComponents] =
    useState<CopaoComponent[]>([])

  const [componentSearches, setComponentSearches] =
    useState<Record<number, string>>({})

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

    const {
      data: componentsData,
      error: componentsError,
    } = await supabase
      .from("copao_components")
      .select("*")

    if (componentsError) {
      console.error(
        "ERRO AO CARREGAR COMPONENTES DOS COPÕES:",
        componentsError
      )
    }

    const formattedProducts: Product[] =
      (productsData || []).map(
        (product: any) => ({
          ...product,

          purchase_price:
            Number(
              product.purchase_price || 0
            ),

          sale_price:
            Number(
              product.sale_price || 0
            ),

          stock:
            Number(
              product.stock || 0
            ),
        })
      )

    setProducts(
      formattedProducts
    )

    if (copoesData) {
      setCopoes(
        copoesData.map(
          (copao: any) => ({
            ...copao,

            sale_price:
              Number(
                copao.sale_price || 0
              ),

            dose_extra_price:
              Number(
                copao.dose_extra_price || 0
              ),
          })
        )
      )
    }

    if (componentsData) {
      const grouped: Record<
        number,
        CopaoComponent[]
      > = {}

      componentsData.forEach(
        (item: any) => {
          const copaoId =
            Number(
              item.copao_id
            )

          const product =
            formattedProducts.find(
              (product) =>
                Number(product.id) ===
                Number(item.product_id)
            )

          if (!grouped[copaoId]) {
            grouped[copaoId] = []
          }

          grouped[copaoId].push({
            id:
              item.id,

            copao_id:
              Number(
                item.copao_id
              ),

            product_id:
              Number(
                item.product_id
              ),

            quantity:
              Number(
                item.quantity || 0
              ),

            unit_type:
              item.unit_type ||
              "Unidade",

            role:
              item.role ||
              item.component_type ||
              "",

            component_type:
              item.component_type ||
              item.role ||
              "",

            optional:
              item.role === "gelo"
                ? true
                : Boolean(
                    item.optional
                  ),

            product:
              product
                ? {
                    ...product,
                  }
                : undefined,
          })
        }
      )

      setComponents(
        grouped
      )
    }

    setLoading(false)
  }

  function clearForm() {
    setName("")
    setSalePrice("")
    setDoseExtraPrice("")
    setEditingId(null)
    setRecipeComponents([])
    setComponentSearches({})
  }

  function getProduct(
    id: number
  ) {
    return products.find(
      (product) =>
        product.id === id
    )
  }

  function getProductName(
    id: number
  ) {
    const product =
      getProduct(id)

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

  function parseVolumeToMl(
    volume: string | undefined
  ) {
    if (!volume) {
      return 0
    }

    const normalized =
      String(volume)
        .trim()
        .toLowerCase()
        .replace(",", ".")

    const numberMatch =
      normalized.match(
        /[\d.]+/
      )

    if (!numberMatch) {
      return 0
    }

    const value =
      Number(
        numberMatch[0]
      )

    if (
      Number.isNaN(value)
    ) {
      return 0
    }

    if (
      normalized.includes("ml")
    ) {
      return value
    }

    if (
      normalized.includes("cl")
    ) {
      return value * 10
    }

    if (
      normalized.includes("l")
    ) {
      return value * 1000
    }

    return value
  }

  function addComponent() {
    setRecipeComponents([
      ...recipeComponents,

      {
        product_id: 0,
        quantity: 1,
        unit_type: "Unidade",
        role: "",
        optional: false,
      },
    ])
  }

  function removeComponent(
    index: number
  ) {
    setRecipeComponents(
      recipeComponents.filter(
        (_, i) =>
          i !== index
      )
    )

    setComponentSearches(
      (previous) => {
        const next = {
          ...previous,
        }

        delete next[index]

        return next
      }
    )
  }

  function updateComponent(
    index: number,
    field: keyof CopaoComponent,
    value: any
  ) {
    setRecipeComponents(
      recipeComponents.map(
        (
          component,
          i
        ) => {
          if (
            i !== index
          ) {
            return component
          }

          const updated = {
            ...component,
            [field]: value,
          }

          if (
            field === "role" &&
            value === "gelo"
          ) {
            updated.optional =
              true
          }

          if (
            field === "role" &&
            value !== "gelo" &&
            component.role ===
              "gelo"
          ) {
            updated.optional =
              false
          }

          return updated
        }
      )
    )
  }

  async function editCopao(
    copao: Copao
  ) {
    setEditingId(
      copao.id
    )

    setName(
      copao.name
    )

    setSalePrice(
      String(
        copao.sale_price || 0
      )
    )

    setDoseExtraPrice(
      String(
        copao.dose_extra_price ||
          0
      )
    )

    const {
      data,
      error,
    } = await supabase
      .from(
        "copao_components"
      )
      .select("*")
      .eq(
        "copao_id",
        copao.id
      )
      .order("id", {
        ascending: true,
      })

    if (error) {
      console.error(
        "ERRO AO CARREGAR RECEITA:",
        error
      )

      alert(
        `Não foi possível carregar a receita.\n\n${error.message}`
      )

      return
    }

    const recipe =
      (data || []).map(
        (item: any) => {
          const product =
            products.find(
              (product) =>
                Number(
                  product.id
                ) ===
                Number(
                  item.product_id
                )
            )

          return {
            id:
              item.id,

            copao_id:
              Number(
                item.copao_id
              ),

            product_id:
              Number(
                item.product_id
              ),

            quantity:
              Number(
                item.quantity || 0
              ),

            unit_type:
              item.unit_type ||
              "Unidade",

            role:
              item.role ||
              item.component_type ||
              "",

            component_type:
              item.component_type ||
              item.role ||
              "",

            optional:
              item.role === "gelo"
                ? true
                : Boolean(
                    item.optional
                  ),

            product:
              product
                ? {
                    ...product,
                  }
                : undefined,
          }
        }
      )

    setRecipeComponents(
      recipe
    )

    setComponentSearches({})

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  function calculateComponentCost(
    component: CopaoComponent
  ) {
    const product =
      getProduct(
        Number(
          component.product_id
        )
      )

    if (!product) {
      return 0
    }

    const purchasePrice =
      Number(
        product.purchase_price ||
          0
      )

    const quantity =
      Number(
        component.quantity ||
          0
      )

    if (
      component.unit_type ===
      "Ml"
    ) {
      const volumeMl =
        parseVolumeToMl(
          product.volume
        )

      if (
        volumeMl <= 0
      ) {
        return 0
      }

      return (
        purchasePrice *
        (
          quantity /
          volumeMl
        )
      )
    }

    return (
      purchasePrice *
      quantity
    )
  }

  function calculateRecipeCost(
    recipe: CopaoComponent[]
  ) {
    let total = 0
    let geloJaContado =
      false

    recipe.forEach(
      (component) => {
        /*
        Componentes opcionais,
        exceto gelo, não entram
        no custo base.
        */

        if (
          component.optional &&
          component.role !==
            "gelo"
        ) {
          return
        }

        /*
        Todos os sabores de gelo
        têm o mesmo valor.
        Apenas 1 é contabilizado.
        */

        if (
          component.role ===
          "gelo"
        ) {
          if (
            geloJaContado
          ) {
            return
          }

          geloJaContado =
            true
        }

        total +=
          calculateComponentCost(
            component
          )
      }
    )

    return total
  }

  const baseCost =
    calculateRecipeCost(
      recipeComponents
    )

  const baseSalePrice =
    Number(
      String(
        salePrice || "0"
      ).replace(",", ".")
    )

  const baseProfit =
    baseSalePrice -
    baseCost

  const doseComponent =
    recipeComponents.find(
      (component) =>
        component.role ===
        "dose"
    )

  const doseExtraCost =
    doseComponent
      ? calculateComponentCost(
          {
            ...doseComponent,
            quantity: 1,
          }
        )
      : 0

  const doseExtraPriceValue =
    Number(
      String(
        doseExtraPrice || "0"
      ).replace(",", ".")
    )

  const doseExtraProfit =
    doseExtraPriceValue -
    doseExtraCost

  /*
  ============================================================
  COMPONENTES CONTABILIZADOS NO RESUMO
  ============================================================
  */

  let geloJaContabilizadoResumo =
    false

  const componentesContabilizados =
    recipeComponents.filter(
      (component) => {
        if (
          component.optional &&
          component.role !==
            "gelo"
        ) {
          return false
        }

        if (
          component.role ===
          "gelo"
        ) {
          if (
            geloJaContabilizadoResumo
          ) {
            return false
          }

          geloJaContabilizadoResumo =
            true
        }

        return true
      }
    )

  async function saveCopao() {
    if (
      !name.trim()
    ) {
      alert(
        "Informe o nome do copão."
      )
      return
    }

    const price =
      Number(
        String(
          salePrice
        ).replace(",", ".")
      )

    const extraPrice =
      Number(
        String(
          doseExtraPrice ||
            "0"
        ).replace(",", ".")
      )

    if (
      Number.isNaN(price) ||
      price <= 0
    ) {
      alert(
        "Informe um preço base válido."
      )
      return
    }

    if (
      Number.isNaN(
        extraPrice
      ) ||
      extraPrice < 0
    ) {
      alert(
        "Informe um valor válido para a dose extra."
      )
      return
    }

    if (
      recipeComponents.length ===
      0
    ) {
      alert(
        "Adicione pelo menos um componente à receita."
      )
      return
    }

    for (
      const component of recipeComponents
    ) {
      if (
        !component.product_id ||
        Number(
          component.product_id
        ) <= 0
      ) {
        alert(
          "Todos os componentes precisam ter um produto selecionado."
        )
        return
      }

      if (
        Number(
          component.quantity
        ) <= 0
      ) {
        alert(
          "Todos os componentes precisam ter uma quantidade maior que zero."
        )
        return
      }

      if (
        !component.unit_type
      ) {
        alert(
          "Informe a unidade de cada componente."
        )
        return
      }

      if (
        component.unit_type ===
        "Ml"
      ) {
        const product =
          getProduct(
            Number(
              component.product_id
            )
          )

        if (
          parseVolumeToMl(
            product?.volume
          ) <= 0
        ) {
          alert(
            `O produto ${getProductName(
              Number(
                component.product_id
              )
            )} precisa ter o volume cadastrado para ser usado em ml.`
          )

          return
        }
      }
    }

    const normalizedRecipeComponents =
      recipeComponents.map(
        (component) => ({
          ...component,

          optional:
            component.role ===
            "gelo"
              ? true
              : Boolean(
                  component.optional
                ),

          component_type:
            component.role ||
            component.component_type ||
            "outro",
        })
      )

    setSaving(true)

    try {
      const doseComponentForDb =
        normalizedRecipeComponents.find(
          (component) =>
            component.role ===
            "dose"
        )

      const copoComponentForDb =
        normalizedRecipeComponents.find(
          (component) =>
            component.role ===
            "copo"
        )

      const copaoData = {
        name:
          name.trim(),

        sale_price:
          price,

        dose_product_id:
          doseComponentForDb
            ? Number(
                doseComponentForDb.product_id
              )
            : null,

        dose_extra_price:
          extraPrice,

        copo_product_id:
          copoComponentForDb
            ? Number(
                copoComponentForDb.product_id
              )
            : null,

        /*
        Campos antigos mantidos
        */

        garrafinha_enabled:
          false,

        garrafinha_quantity:
          0,

        garrafinha_product_id:
          null,

        active:
          true,
      }

      let copaoId =
        editingId

      /*
      ========================================================
      CRIA OU ATUALIZA COPÃO
      ========================================================
      */

      if (
        editingId
      ) {
        const {
          error,
        } = await supabase
          .from("copoes")
          .update(
            copaoData
          )
          .eq(
            "id",
            editingId
          )

        if (error) {
          throw new Error(
            `Erro ao atualizar copão: ${error.message}`
          )
        }
      } else {
        const {
          data,
          error,
        } = await supabase
          .from("copoes")
          .insert(
            copaoData
          )
          .select()

        if (error) {
          throw new Error(
            `Erro ao criar copão: ${error.message}`
          )
        }

        if (
          !data ||
          data.length === 0
        ) {
          throw new Error(
            "O copão não foi criado."
          )
        }

        copaoId =
          Number(
            data[0].id
          )
      }

      if (!copaoId) {
        throw new Error(
          "Não foi possível identificar o Copão."
        )
      }

      /*
      ========================================================
      APAGA COMPONENTES ANTIGOS
      ========================================================
      */

      const {
        error:
          deleteComponentsError,
      } = await supabase
        .from(
          "copao_components"
        )
        .delete()
        .eq(
          "copao_id",
          copaoId
        )

      if (
        deleteComponentsError
      ) {
        throw new Error(
          `Não foi possível limpar a receita antiga: ${deleteComponentsError.message}`
        )
      }

      /*
      ========================================================
      SALVA NOVOS COMPONENTES
      ========================================================
      */

      const componentRows =
        normalizedRecipeComponents.map(
          (component) => ({
            copao_id:
              copaoId,

            component_type:
              component.role ||
              component.component_type ||
              "outro",

            product_id:
              Number(
                component.product_id
              ),

            quantity:
              Number(
                component.quantity
              ),

            unit_type:
              component.unit_type,

            role:
              component.role ||
              null,

            optional:
              Boolean(
                component.optional
              ),
          })
        )

      const {
        error:
          componentsError,
      } = await supabase
        .from(
          "copao_components"
        )
        .insert(
          componentRows
        )

      if (
        componentsError
      ) {
        throw new Error(
          `Erro ao salvar a receita: ${componentsError.message}`
        )
      }

      alert(
        editingId
          ? "Copão atualizado com sucesso!"
          : "Copão criado com sucesso!"
      )

      clearForm()

      await loadData()
    } catch (error: any) {
      console.error(
        "ERRO AO SALVAR COPÃO:",
        error
      )

      alert(
        error?.message ||
          "Não foi possível salvar o copão."
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteCopao(
    id: number
  ) {
    const confirmDelete =
      window.confirm(
        "Excluir este copão?"
      )

    if (
      !confirmDelete
    ) {
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

    setComponents(
      (previous) => {
        const next = {
          ...previous,
        }

        delete next[id]

        return next
      }
    )
  }

  function getCopaoComponents(
    copaoId: number
  ) {
    return (
      components[
        copaoId
      ] || []
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">

          <div>
            <label className="block text-sm font-medium mb-1">
              Nome do copão
            </label>

            <input
              type="text"
              value={
                name
              }
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Ex.: White Horse"
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
              Usado quando a receita possuir uma Dose.
            </p>
          </div>

        </div>

        {/* ================================================== */}
        {/* RECEITA */}
        {/* ================================================== */}

        <div className="mt-8 border rounded-xl p-5">

          <div className="flex justify-between items-center gap-4">

            <div>
              <h3 className="font-bold text-lg">
                Composição do Copão
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                Adicione todos os produtos consumidos por cada Copão.
              </p>
            </div>

            <button
              type="button"
              onClick={
                addComponent
              }
              className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
            >
              ➕ Adicionar componente
            </button>

          </div>

          {recipeComponents.length ===
          0 ? (

            <div className="mt-5 bg-gray-50 border rounded-lg p-4 text-gray-500">
              Nenhum componente adicionado.
            </div>

          ) : (

            <div className="mt-5 space-y-4">

              {recipeComponents.map(
                (
                  component,
                  index
                ) => {

                  const selectedProduct =
                    getProduct(
                      Number(
                        component.product_id
                      )
                    )

                  return (
                    <div
                      key={
                        component.id ||
                        `new-${index}`
                      }
                      className="border rounded-xl p-4 bg-gray-50"
                    >

                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

                        <div className="lg:col-span-2">

                          <label className="block text-sm font-medium mb-1">
                            Produto
                          </label>

                          <input
                            type="text"
                            placeholder="Pesquisar produto..."
                            value={
                              componentSearches[
                                index
                              ] ||
                              (
                                selectedProduct
                                  ? getProductName(
                                      selectedProduct.id
                                    )
                                  : ""
                              )
                            }
                            onChange={(e) => {

                              setComponentSearches(
                                (
                                  previous
                                ) => ({
                                  ...previous,
                                  [index]:
                                    e.target.value,
                                })
                              )

                              updateComponent(
                                index,
                                "product_id",
                                0
                              )
                            }}
                            className="border rounded-lg px-3 py-2 w-full"
                          />

                          {componentSearches[
                            index
                          ] &&
                            componentSearches[
                              index
                            ].trim() !==
                              "" && (

                              <div className="mt-1 border rounded-lg bg-white max-h-48 overflow-auto shadow-sm">

                                {products
                                  .filter(
                                    (
                                      product
                                    ) =>
                                      (
                                        product.name +
                                        " " +
                                        (
                                          product.brand ||
                                          ""
                                        ) +
                                        " " +
                                        (
                                          product.flavor ||
                                          ""
                                        ) +
                                        " " +
                                        (
                                          product.volume ||
                                          ""
                                        )
                                      )
                                        .toLowerCase()
                                        .includes(
                                          componentSearches[
                                            index
                                          ].toLowerCase()
                                        )
                                  )
                                  .map(
                                    (
                                      product
                                    ) => (

                                      <button
                                        type="button"
                                        key={
                                          product.id
                                        }
                                        onClick={() => {

                                          updateComponent(
                                            index,
                                            "product_id",
                                            product.id
                                          )

                                          setComponentSearches(
                                            (
                                              previous
                                            ) => ({
                                              ...previous,
                                              [index]:
                                                "",
                                            })
                                          )
                                        }}
                                        className="block w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
                                      >

                                        <p className="font-medium">
                                          {
                                            product.name
                                          }
                                        </p>

                                        <p className="text-xs text-gray-500">

                                          {product.brand
                                            ? `${product.brand} • `
                                            : ""}

                                          {product.flavor
                                            ? `${product.flavor} • `
                                            : ""}

                                          {
                                            product.volume ||
                                            ""
                                          }

                                        </p>

                                      </button>

                                    )
                                  )}

                              </div>
                            )}

                          {selectedProduct && (
                            <div className="mt-2 bg-white border rounded-lg p-2">

                              <p className="text-sm font-medium">
                                Selecionado:{" "}
                                {
                                  selectedProduct.name
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                {
                                  getProductName(
                                    selectedProduct.id
                                  )
                                }
                              </p>

                              <p className="text-xs text-gray-500">
                                Estoque atual:{" "}
                                {
                                  selectedProduct.stock
                                }
                              </p>

                            </div>
                          )}

                        </div>

                        <div>

                          <label className="block text-sm font-medium mb-1">
                            Quantidade
                          </label>

                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              component.quantity
                            }
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "quantity",
                                Number(
                                  e.target.value
                                )
                              )
                            }
                            className="border rounded-lg px-3 py-2 w-full"
                          />

                        </div>

                        <div>

                          <label className="block text-sm font-medium mb-1">
                            Tipo
                          </label>

                          <select
                            value={
                              component.unit_type
                            }
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "unit_type",
                                e.target.value
                              )
                            }
                            className="border rounded-lg px-3 py-2 w-full bg-white"
                          >

                            <option value="Unidade">
                              Unidade
                            </option>

                            <option value="Dose">
                              Dose
                            </option>

                            <option value="Ml">
                              ml
                            </option>

                          </select>

                        </div>

                        <div>

                          <label className="block text-sm font-medium mb-1">
                            Função
                          </label>

                          <select
                            value={
                              component.role
                            }
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "role",
                                e.target.value
                              )
                            }
                            className="border rounded-lg px-3 py-2 w-full bg-white"
                          >

                            <option value="">
                              Selecione a função
                            </option>

                            <option value="dose">
                              🥃 Dose
                            </option>

                            <option value="energetico">
                              ⚡ Energético
                            </option>

                            <option value="gelo">
                              🧊 Gelo
                            </option>

                            <option value="copo">
                              🥤 Copo
                            </option>

                            <option value="lacre">
                              🔒 Lacre
                            </option>

                            <option value="outro">
                              📦 Outro
                            </option>

                          </select>

                        </div>

                      </div>

                      <div className="flex justify-between items-center mt-4 gap-4">

                        <label className="flex items-center gap-2 cursor-pointer">

                          <input
                            type="checkbox"
                            checked={
                              component.role ===
                              "gelo"
                                ? true
                                : component.optional
                            }
                            disabled={
                              component.role ===
                              "gelo"
                            }
                            onChange={(e) =>
                              updateComponent(
                                index,
                                "optional",
                                e.target.checked
                              )
                            }
                          />

                          <span className="text-sm">
                            {component.role ===
                            "gelo"
                              ? "🧊 Escolha 1 sabor na venda"
                              : "Opcional na venda"}
                          </span>

                        </label>

                        <button
                          type="button"
                          onClick={() =>
                            removeComponent(
                              index
                            )
                          }
                          className="text-red-600 text-sm font-semibold hover:underline"
                        >
                          🗑 Remover componente
                        </button>

                      </div>

                    </div>
                  )
                }
              )}

            </div>
          )}

        </div>

        {/* ================================================== */}
        {/* RESUMO */}
        {/* ================================================== */}

        <div className="mt-6 bg-gray-50 rounded-xl p-5">

          <h3 className="font-bold text-lg">
            Resumo da receita
          </h3>

          <div className="mt-4 space-y-3">

            {componentesContabilizados.length ===
            0 ? (

              <p className="text-gray-500">
                Nenhum componente está sendo contabilizado.
              </p>

            ) : (

              componentesContabilizados.map(
                (
                  component,
                  index
                ) => {

                  const product =
                    getProduct(
                      Number(
                        component.product_id
                      )
                    )

                  if (!product) {
                    return null
                  }

                  const componentCost =
                    calculateComponentCost(
                      component
                    )

                  return (
                    <div
                      key={
                        component.id ||
                        `cost-${index}`
                      }
                      className="bg-white border rounded-lg p-3"
                    >

                      <div className="flex justify-between gap-4">

                        <div>

                          <p className="font-semibold">

                            {component.role ===
                            "dose"
                              ? "🥃 "
                              : component.role ===
                                "energetico"
                              ? "⚡ "
                              : component.role ===
                                "gelo"
                              ? "🧊 "
                              : component.role ===
                                "copo"
                              ? "🥤 "
                              : component.role ===
                                "lacre"
                              ? "🔒 "
                              : "📦 "}

                            {
                              getProductName(
                                product.id
                              )
                            }

                          </p>

                          <p className="text-sm text-gray-500 mt-1">

                            {
                              component.quantity
                            }{" "}

                            {component.unit_type ===
                            "Ml"
                              ? "ml"
                              : component.unit_type ===
                                "Dose"
                              ? component.quantity ===
                                1
                                ? "dose"
                                : "doses"
                              : component.quantity ===
                                1
                              ? "unidade"
                              : "unidades"}

                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-xs text-gray-500">
                            Custo
                          </p>

                          <p className="font-bold">
                            R${" "}
                            {componentCost.toFixed(
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

            <div className="border-t pt-4 mt-4 flex justify-between font-bold">

              <span>
                Custo base
              </span>

              <span>
                R${" "}
                {baseCost.toFixed(
                  2
                )}
              </span>

            </div>

            <div className="flex justify-between">

              <span>
                Preço de venda
              </span>

              <span>
                R${" "}
                {baseSalePrice.toFixed(
                  2
                )}
              </span>

            </div>

            <div className="flex justify-between text-green-700 font-bold text-lg">

              <span>
                Lucro base
              </span>

              <span>
                R${" "}
                {baseProfit.toFixed(
                  2
                )}
              </span>

            </div>

            {doseComponent && (

              <div className="border-t pt-4 mt-4 space-y-2">

                <div className="flex justify-between">

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
                    Preço da dose extra
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
                    Lucro da dose extra
                  </span>

                  <span>
                    R${" "}
                    {doseExtraProfit.toFixed(
                      2
                    )}
                  </span>

                </div>

              </div>

            )}

          </div>

        </div>

        {/* ================================================== */}
        {/* BOTÕES */}
        {/* ================================================== */}

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
              disabled={
                saving
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

        ) : copoes.length === 0 ? (

          <div className="bg-white rounded-xl shadow p-6 mt-4">

            <p className="text-gray-500">
              Nenhum copão cadastrado.
            </p>

          </div>

        ) : (

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-4">

            {copoes.map(
              (copao) => {

                const copaoComponents =
                  getCopaoComponents(
                    copao.id
                  )

                const totalCost =
                  calculateRecipeCost(
                    copaoComponents
                  )

                const profit =
                  Number(
                    copao.sale_price ||
                      0
                  ) -
                  totalCost

                let geloJaContado =
                  false

                const visibleComponents =
                  copaoComponents.filter(
                    (component) => {

                      if (
                        component.optional &&
                        component.role !==
                          "gelo"
                      ) {
                        return false
                      }

                      if (
                        component.role ===
                        "gelo"
                      ) {
                        if (
                          geloJaContado
                        ) {
                          return false
                        }

                        geloJaContado =
                          true
                      }

                      return true
                    }
                  )

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
                          Componentes contabilizados:
                        </p>

                      </div>

                      <div className="text-right">

                        <p className="text-sm text-gray-500">
                          Venda
                        </p>

                        <p className="text-xl font-bold text-green-700">
                          R${" "}
                          {Number(
                            copao.sale_price ||
                              0
                          ).toFixed(
                            2
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 space-y-2">

                      {visibleComponents.length ===
                      0 ? (

                        <p className="text-sm text-gray-500">
                          Nenhum componente contabilizado.
                        </p>

                      ) : (

                        visibleComponents.map(
                          (
                            component
                          ) => {

                            const componentCost =
                              calculateComponentCost(
                                component
                              )

                            return (
                              <div
                                key={
                                  component.id
                                }
                                className="flex justify-between gap-3 text-sm"
                              >

                                <span className="text-gray-700">

                                  {component.role ===
                                  "dose"
                                    ? "🥃 "
                                    : component.role ===
                                      "energetico"
                                    ? "⚡ "
                                    : component.role ===
                                      "gelo"
                                    ? "🧊 "
                                    : component.role ===
                                      "copo"
                                    ? "🥤 "
                                    : component.role ===
                                      "lacre"
                                    ? "🔒 "
                                    : "📦 "}

                                  {
                                    getProductName(
                                      Number(
                                        component.product_id
                                      )
                                    )
                                  }

                                  {" — "}

                                  {
                                    component.quantity
                                  }{" "}

                                  {component.unit_type ===
                                  "Ml"
                                    ? "ml"
                                    : component.unit_type ===
                                      "Dose"
                                    ? component.quantity ===
                                      1
                                      ? "dose"
                                      : "doses"
                                    : component.quantity ===
                                      1
                                    ? "unidade"
                                    : "unidades"}

                                </span>

                                <strong>
                                  R${" "}
                                  {componentCost.toFixed(
                                    2
                                  )}
                                </strong>

                              </div>
                            )
                          }
                        )

                      )}

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