import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

interface Copao {
  id: number
  name: string
  sale_price: number
  dose_product_id: number | null
  dose_extra_price: number
  copo_product_id: number | null
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

  /*
  ============================================================
  COMPONENTES DA NOVA RECEITA
  ============================================================
  */

  const [recipeComponents, setRecipeComponents] =
    useState<CopaoComponent[]>([])
    const [componentSearches, setComponentSearches] =
  useState<Record<number, string>>({})

  /*
  ============================================================
  CARREGA DADOS
  ============================================================
  */

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
      .select(`
        *,
        products (
          id,
          name,
          category,
          brand,
          flavor,
          volume,
          purchase_price,
          sale_price,
          stock
        )
      `)

    if (componentsError) {
      console.error(
        "ERRO AO CARREGAR COMPONENTES DOS COPÕES:",
        componentsError
      )
    }

    if (copoesData) {
      setCopoes(copoesData)
    }

    if (productsData) {
      const formattedProducts =
        productsData.map(
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

          if (!grouped[copaoId]) {
            grouped[copaoId] = []
          }

          grouped[copaoId].push({
            id: item.id,
            copao_id:
              item.copao_id,
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
              "",
            optional:
              Boolean(
                item.optional
              ),
            product:
              item.products
                ? {
                    ...item.products,
                    purchase_price:
                      Number(
                        item.products
                          .purchase_price ||
                          0
                      ),
                    sale_price:
                      Number(
                        item.products
                          .sale_price ||
                          0
                      ),
                    stock:
                      Number(
                        item.products
                          .stock ||
                          0
                      ),
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

  /*
  ============================================================
  LIMPA FORMULÁRIO
  ============================================================
  */

  function clearForm() {
    setName("")
    setSalePrice("")
    setDoseExtraPrice("")
    setEditingId(null)
    setRecipeComponents([])
    setComponentSearches({})
  }

  /*
  ============================================================
  PRODUTO
  ============================================================
  */

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

  /*
  ============================================================
  COMPONENTES
  ============================================================
  */

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
  }

  function updateComponent(
  index: number,
  field: keyof CopaoComponent,
  value: any
) {
  setRecipeComponents(
    recipeComponents.map(
      (component, i) => {
        if (i !== index) {
          return component
        }

        const updated = {
          ...component,
          [field]: value,
        }

        /*
        --------------------------------------------------------
        SE A FUNÇÃO FOR GELO
        O SISTEMA TRATA COMO OPÇÃO DE ESCOLHA NA VENDA.
        --------------------------------------------------------
        */

        if (
          field === "role" &&
          value === "gelo"
        ) {
          updated.optional = true
        }

        /*
        --------------------------------------------------------
        SE DEIXAR DE SER GELO
        VOLTA A SER OBRIGATÓRIO.
        --------------------------------------------------------
        */

        if (
          field === "role" &&
          value !== "gelo"
        ) {
          updated.optional = false
        }

        return updated
      }
    )
  )
}
  /*
  ============================================================
  EDITAR COPÃO
  ============================================================
  */

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
        copao.sale_price
      )
    )

    setDoseExtraPrice(
      String(
        copao.dose_extra_price ||
          0
      )
    )

    const { data, error } =
      await supabase
        .from(
          "copao_components"
        )
        .select(`
          *,
          products (
            id,
            name,
            category,
            brand,
            flavor,
            volume,
            purchase_price,
            sale_price,
            stock
          )
        `)
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

    setRecipeComponents(
      (data || []).map(
        (item: any) => ({
          id: item.id,

          copao_id:
            item.copao_id,

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
            "",

          optional:
            Boolean(
              item.optional
            ),

          product:
            item.products
              ? {
                  ...item.products,

                  purchase_price:
                    Number(
                      item.products
                        .purchase_price ||
                        0
                    ),

                  sale_price:
                    Number(
                      item.products
                        .sale_price ||
                        0
                    ),

                  stock:
                    Number(
                      item.products
                        .stock ||
                        0
                    ),
                }
              : undefined,
        })
      )
    )

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  /*
  ============================================================
  CUSTO DA RECEITA
  ============================================================
  */

  function calculateRecipeCost() {
    return recipeComponents.reduce(
      (
        total,
        component
      ) => {
        const product =
          getProduct(
            Number(
              component.product_id
            )
          )

        if (!product) {
          return total
        }

        /*
        ML NÃO É CONVERTIDO AQUI.
        Isso será tratado na venda.
        */

        if (
          component.unit_type ===
          "Ml"
        ) {
          return total
        }

        return (
          total +
          Number(
            product.purchase_price ||
              0
          ) *
            Number(
              component.quantity ||
                0
            )
        )
      },
      0
    )
  }

  const baseCost =
    calculateRecipeCost()

  const baseSalePrice =
    Number(
      String(
        salePrice || "0"
      ).replace(
        ",",
        "."
      )
    )

  const baseProfit =
    baseSalePrice -
    baseCost

  /*
  ============================================================
  SALVAR COPÃO
  ============================================================
  */

  async function saveCopao() {
    if (!name.trim()) {
      alert(
        "Informe o nome do copão."
      )
      return
    }

    const price =
      Number(
        String(
          salePrice
        ).replace(
          ",",
          "."
        )
      )

    const extraPrice =
      Number(
        String(
          doseExtraPrice ||
            "0"
        ).replace(
          ",",
          "."
        )
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

    if (
      isNaN(extraPrice) ||
      extraPrice < 0
    ) {
      alert(
        "Informe um valor válido para a dose extra."
      )
      return
    }

    /*
    ------------------------------------------------------------
    VALIDA COMPONENTES
    ------------------------------------------------------------
    */

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
    }
/*
------------------------------------------------------------
NORMALIZA RECEITA DE GELO
------------------------------------------------------------
*/

const normalizedRecipeComponents =
  recipeComponents.map(
    (component) => ({
      ...component,

      optional:
        component.role === "gelo"
          ? true
          : Boolean(
              component.optional
            ),
    })
  )
    setSaving(true)

    /*
    ------------------------------------------------------------
    ENCONTRA COMPONENTES IMPORTANTES
    ------------------------------------------------------------
    */

    const doseComponent =
      recipeComponents.find(
        (component) =>
          component.role ===
          "dose"
      )

    const copoComponent =
      recipeComponents.find(
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
        doseComponent
          ? Number(
              doseComponent.product_id
            )
          : null,

      dose_extra_price:
        extraPrice,

      copo_product_id:
        copoComponent
          ? Number(
              copoComponent.product_id
            )
          : null,

      /*
      CAMPOS ANTIGOS MANTIDOS
      PARA NÃO QUEBRAR OS DADOS EXISTENTES.
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
    ------------------------------------------------------------
    CRIA / ATUALIZA
    ------------------------------------------------------------
    */

    if (editingId) {
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
        .insert(
          copaoData
        )
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
        data.length ===
          0
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
    ------------------------------------------------------------
    REMOVE COMPONENTES ANTIGOS DA RECEITA
    ------------------------------------------------------------
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
      console.error(
        "ERRO AO LIMPAR COMPONENTES:",
        deleteComponentsError
      )

      alert(
        `Copão salvo, mas não foi possível atualizar os componentes.\n\n${deleteComponentsError.message}`
      )

      setSaving(false)
      return
    }

    /*
    ------------------------------------------------------------
    SALVA NOVA RECEITA
    ------------------------------------------------------------
    */

   const componentRows =
  normalizedRecipeComponents.map(
    (
      component
    ) => ({
      copao_id:
        copaoId,

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
      console.error(
        "ERRO AO SALVAR COMPONENTES:",
        componentsError
      )

      alert(
        `Copão salvo, mas houve erro ao salvar a receita:\n\n${componentsError.message}`
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

  /*
  ============================================================
  EXCLUIR COPÃO
  ============================================================
  */

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
        active:
          false,
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

  /*
  ============================================================
  FORMATA COMPONENTE
  ============================================================
  */

  function formatComponent(
    component: CopaoComponent
  ) {
    const product =
      getProduct(
        Number(
          component.product_id
        )
      )

    const productName =
      product
        ? getProductName(
            product.id
          )
        : "Produto não encontrado"

    let quantityText =
      `${component.quantity}`

    if (
      component.unit_type ===
      "Ml"
    ) {
      quantityText +=
        " ml"
    } else if (
      component.unit_type ===
      "Dose"
    ) {
      quantityText +=
        component.quantity ===
        1
          ? " dose"
          : " doses"
    } else if (
      component.unit_type ===
      "Unidade"
    ) {
      quantityText +=
        component.quantity ===
        1
          ? " unidade"
          : " unidades"
    }

    return `${productName} → ${quantityText}`
  }

  /*
  ============================================================
  COMPONENTES PARA LISTAGEM
  ============================================================
  */

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
              placeholder="Ex.: Copão Gin"
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
              value={salePrice}
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
              Usado somente para componentes marcados como "Dose".
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
                        index
                      }
                      className="border rounded-xl p-4 bg-gray-50"
                    >

                      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">

                        {/* PRODUTO */}

                       <div className="lg:col-span-2">

  <label className="block text-sm font-medium mb-1">
    Produto
  </label>

  <input
    type="text"
    placeholder="Pesquisar produto..."
    value={
      componentSearches[index] ||
      (
        selectedProduct
          ? selectedProduct.name +
            (selectedProduct.brand
              ? ` • ${selectedProduct.brand}`
              : "") +
            (selectedProduct.flavor
              ? ` • ${selectedProduct.flavor}`
              : "") +
            (selectedProduct.volume
              ? ` • ${selectedProduct.volume}`
              : "")
          : ""
      )
    }
    onChange={(e) => {
      setComponentSearches(
        (previous) => ({
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

  {componentSearches[index] &&
    componentSearches[index].trim() !== "" && (
      <div className="mt-1 border rounded-lg bg-white max-h-48 overflow-auto shadow-sm">

        {products
          .filter((product) =>
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
                componentSearches[index]
                  .toLowerCase()
              )
          )
          .map((product) => (
            <button
              type="button"
              key={product.id}
              onClick={() => {
                updateComponent(
                  index,
                  "product_id",
                  product.id
                )

                setComponentSearches(
                  (previous) => ({
                    ...previous,
                    [index]: "",
                  })
                )
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 border-b last:border-b-0"
            >
              <p className="font-medium">
                {product.name}
              </p>

              <p className="text-xs text-gray-500">
                {product.brand
                  ? `${product.brand} • `
                  : ""}
                {product.flavor
                  ? `${product.flavor} • `
                  : ""}
                {product.volume || ""}
              </p>
            </button>
          ))}

      </div>
    )}

  {selectedProduct && (
    <div className="mt-2 bg-gray-50 rounded-lg p-2">

      <p className="text-sm font-medium">
        Selecionado:{" "}
        {selectedProduct.name}
      </p>

      <p className="text-xs text-gray-500">
        {selectedProduct.brand
          ? `${selectedProduct.brand} • `
          : ""}
        {selectedProduct.flavor
          ? `${selectedProduct.flavor} • `
          : ""}
        {selectedProduct.volume || ""}
      </p>

      <p className="text-xs text-gray-500">
        Estoque atual:{" "}
        {Number(
          selectedProduct.stock || 0
        )}
      </p>

    </div>
  )}

</div>

                        {/* QUANTIDADE */}

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

                        {/* UNIDADE */}

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

                        {/* FUNÇÃO */}

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
                              Dose
                            </option>

                            <option value="energetico">
                              Energético
                            </option>

                            <option value="gelo">
                              Gelo
                            </option>

                            <option value="copo">
                              Copo
                            </option>

                            <option value="lacre">
                              Lacre
                            </option>

                            <option value="outro">
                              Outro
                            </option>

                          </select>

                        </div>

                      </div>

                      <div className="flex justify-between items-center mt-4 gap-4">

                       <label className="flex items-center gap-2 cursor-pointer">

  <input
    type="checkbox"
    checked={
      component.optional
    }
    disabled={
      component.role === "gelo"
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
    {component.role === "gelo"
      ? "Escolha de gelo"
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

          <div className="mt-4 space-y-2">

            {recipeComponents.length ===
            0 ? (

              <p className="text-gray-500">
                Nenhum componente.
              </p>

            ) : (

              recipeComponents.map(
                (
                  component,
                  index
                ) => (
                  <div
                    key={
                      index
                    }
                    className="flex justify-between gap-4"
                  >

                    <span>
                      {component.role
                        ? `${component.role} — `
                        : ""}
                      {formatComponent(
                        component
                      )}
                    {component.role === "gelo"
  ? " • escolha 1 sabor"
  : component.optional
  ? " • opcional"
  : ""}
                    </span>

                    <span>
                      {component.unit_type ===
                      "Ml"
                        ? "Fracionado"
                        : ""}
                    </span>

                  </div>
                )
              )

            )}

            <div className="border-t pt-3 mt-3 flex justify-between font-bold">

              <span>
                Custo base calculável
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

            <div className="flex justify-between text-green-700 font-bold">

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

            <p className="text-xs text-gray-500 pt-2">
              Componentes em ml serão convertidos no momento da venda conforme o volume cadastrado no produto.
            </p>

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

                const copaoComponents =
                  getCopaoComponents(
                    copao.id
                  )

                const totalCost =
                  copaoComponents.reduce(
                    (
                      total,
                      component
                    ) => {
                      const product =
                        getProduct(
                          Number(
                            component.product_id
                          )
                        )

                      if (!product) {
                        return total
                      }

                      if (
                        component.unit_type ===
                        "Ml"
                      ) {
                        return total
                      }

                      return (
                        total +
                        Number(
                          product.purchase_price ||
                            0
                        ) *
                          Number(
                            component.quantity ||
                              0
                          )
                      )
                    },
                    0
                  )

                const profit =
                  Number(
                    copao.sale_price ||
                      0
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
                          Componentes:
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
                          ).toFixed(
                            2
                          )}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 space-y-2">

                      {copaoComponents.length ===
                      0 ? (

                        <p className="text-sm text-gray-500">
                          Nenhum componente cadastrado.
                        </p>

                      ) : (

                        copaoComponents.map(
                          (
                            component
                          ) => (
                            <p
                              key={
                                component.id
                              }
                              className="text-sm text-gray-700"
                            >
                              •{" "}
                              {formatComponent(
                                component
                              )}
                              {component.role === "gelo"
  ? " • escolha 1 sabor"
  : component.optional
  ? " • opcional"
  : ""}
                            </p>
                          )
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