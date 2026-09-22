import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabase"

interface Product {
  id: number
  name: string
  brand?: string
  flavor?: string
  volume?: string
  purchase_price?: number
  sale_price?: number
  stock?: number
}

interface Combo {
  id: number
  name: string
  sale_price: number
  night_sale_price: number
  active: boolean
}

interface FixedComponent {
  productId: string
  quantity: string
  unitType: string
}

interface ChoiceGroup {
  name: string
  quantity: string
  unitType: string
  productIds: string[]
}

interface SavedComponent {
  id: number
  combo_id: number
  product_id: number
  quantity: number
  unit_type: string
  choice_group_id: number | null
}

interface SavedChoiceGroup {
  id: number
  combo_id: number
  name: string
  quantity: number
  unit_type: string
}

function Combos() {
  const [products, setProducts] = useState<Product[]>([])
  const [combos, setCombos] = useState<Combo[]>([])
  const [components, setComponents] = useState<SavedComponent[]>([])
  const [choiceGroups, setChoiceGroups] = useState<SavedChoiceGroup[]>([])

  const [name, setName] = useState("")
  const [salePrice, setSalePrice] = useState("")
  const [nightSalePrice, setNightSalePrice] = useState("")

  const [fixedComponents, setFixedComponents] = useState<
    FixedComponent[]
  >([])

  const [groups, setGroups] = useState<ChoiceGroup[]>([])

  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const [fixedSearches, setFixedSearches] = useState<
    Record<number, string>
  >({})

  const [groupSearches, setGroupSearches] = useState<
    Record<number, string>
  >({})

  async function loadData() {
    const [
      productsResult,
      combosResult,
      componentsResult,
      groupsResult,
    ] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .order("name", { ascending: true }),

      supabase
        .from("combos")
        .select("*")
        .eq("active", true)
        .order("name", { ascending: true }),

      supabase
        .from("combo_components")
        .select("*"),

      supabase
        .from("combo_choice_groups")
        .select("*"),
    ])

    if (productsResult.error) {
      console.error(productsResult.error)
      alert("Erro ao carregar produtos.")
      return
    }

    if (combosResult.error) {
      console.error(combosResult.error)
      alert("Erro ao carregar combos.")
      return
    }

    if (componentsResult.error) {
      console.error(componentsResult.error)
      alert("Erro ao carregar componentes dos combos.")
      return
    }

    if (groupsResult.error) {
      console.error(groupsResult.error)
      alert("Erro ao carregar grupos dos combos.")
      return
    }

    setProducts(productsResult.data || [])
    setCombos(combosResult.data || [])
    setComponents(componentsResult.data || [])
    setChoiceGroups(groupsResult.data || [])
  }

  useEffect(() => {
    loadData()
  }, [])

  function formatMoney(value: number) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  function normalizeNumber(value: string) {
    return Number(
      String(value || "")
        .replace(/\./g, "")
        .replace(",", ".") || 0
    )
  }

  function getProduct(productId: string | number) {
    return products.find(
      (product) => String(product.id) === String(productId)
    )
  }

  function getProductName(productId: string | number) {
    const product = getProduct(productId)

    if (!product) {
      return "Produto não encontrado"
    }

    return [
      product.name,
      product.brand,
      product.flavor,
      product.volume,
    ]
      .filter(Boolean)
      .join(" • ")
  }

  function getProductCost(productId: string | number) {
    return Number(
      getProduct(productId)?.purchase_price || 0
    )
  }

  function addFixedComponent() {
    const newIndex = fixedComponents.length

    setFixedComponents([
      ...fixedComponents,
      {
        productId: "",
        quantity: "1",
        unitType: "Unidade",
      },
    ])

    setFixedSearches((current) => ({
      ...current,
      [newIndex]: "",
    }))
  }

  function updateFixedComponent(
    index: number,
    field: keyof FixedComponent,
    value: string
  ) {
    setFixedComponents((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    )
  }

  function removeFixedComponent(index: number) {
    setFixedComponents((current) =>
      current.filter((_, itemIndex) => itemIndex !== index)
    )

    setFixedSearches((current) => {
      const next = { ...current }
      delete next[index]
      return next
    })
  }

  function addChoiceGroup() {
    const newIndex = groups.length

    setGroups([
      ...groups,
      {
        name: "",
        quantity: "1",
        unitType: "Unidade",
        productIds: [],
      },
    ])

    setGroupSearches((current) => ({
      ...current,
      [newIndex]: "",
    }))
  }

  function updateChoiceGroup(
    index: number,
    field: "name" | "quantity" | "unitType",
    value: string
  ) {
    setGroups((current) =>
      current.map((group, groupIndex) =>
        groupIndex === index
          ? {
              ...group,
              [field]: value,
            }
          : group
      )
    )
  }

  function removeChoiceGroup(index: number) {
    setGroups((current) =>
      current.filter((_, groupIndex) => groupIndex !== index)
    )

    setGroupSearches((current) => {
      const next = { ...current }
      delete next[index]
      return next
    })
  }

  function toggleGroupProduct(
    groupIndex: number,
    productId: string
  ) {
    setGroups((current) =>
      current.map((group, index) => {
        if (index !== groupIndex) {
          return group
        }

        const exists = group.productIds.includes(productId)

        return {
          ...group,
          productIds: exists
            ? group.productIds.filter(
                (id) => id !== productId
              )
            : [...group.productIds, productId],
        }
      })
    )
  }

  function resetForm() {
    setName("")
    setSalePrice("")
    setNightSalePrice("")
    setFixedComponents([])
    setGroups([])
    setEditingId(null)
    setFixedSearches({})
    setGroupSearches({})
  }

  async function saveCombo() {
    const comboName = name.trim()

    if (!comboName) {
      alert("Informe o nome do combo.")
      return
    }

    const normalPrice = normalizeNumber(salePrice)

    const madrugadaPrice = normalizeNumber(
      nightSalePrice
    )

    if (normalPrice <= 0) {
      alert("Informe o preço normal do combo.")
      return
    }

    if (madrugadaPrice <= 0) {
      alert("Informe o preço de madrugada.")
      return
    }

    const validFixedComponents =
      fixedComponents.filter(
        (item) =>
          item.productId &&
          Number(item.quantity) > 0
      )

    for (const component of validFixedComponents) {
      if (!getProduct(component.productId)) {
        alert("Existe um produto fixo inválido.")
        return
      }
    }

    for (const group of groups) {
      if (!group.name.trim()) {
        alert(
          "Informe o nome de todos os grupos de escolha."
        )
        return
      }

      if (Number(group.quantity) <= 0) {
        alert(
          `Informe uma quantidade válida para o grupo "${group.name}".`
        )
        return
      }

      if (group.productIds.length === 0) {
        alert(
          `Escolha pelo menos um produto para o grupo "${group.name}".`
        )
        return
      }
    }

    setLoading(true)

    try {
      let comboId = editingId

      if (editingId) {
        const { error } = await supabase
          .from("combos")
          .update({
            name: comboName,
            sale_price: normalPrice,
            night_sale_price: madrugadaPrice,
          })
          .eq("id", editingId)

        if (error) {
          throw error
        }

        await supabase
          .from("combo_components")
          .delete()
          .eq("combo_id", editingId)

        await supabase
          .from("combo_choice_groups")
          .delete()
          .eq("combo_id", editingId)
      } else {
        const { data, error } = await supabase
          .from("combos")
          .insert({
            name: comboName,
            sale_price: normalPrice,
            night_sale_price: madrugadaPrice,
            active: true,
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        comboId = data.id
      }

      if (!comboId) {
        throw new Error(
          "Não foi possível identificar o combo."
        )
      }

      if (validFixedComponents.length > 0) {
        const fixedRows = validFixedComponents.map(
          (component) => ({
            combo_id: comboId,
            product_id: Number(component.productId),
            quantity: Number(component.quantity),
            unit_type: component.unitType,
            choice_group_id: null,
          })
        )

        const { error } = await supabase
          .from("combo_components")
          .insert(fixedRows)

        if (error) {
          throw error
        }
      }

      for (const group of groups) {
        const {
          data: groupData,
          error: groupError,
        } = await supabase
          .from("combo_choice_groups")
          .insert({
            combo_id: comboId,
            name: group.name.trim(),
            quantity: Number(group.quantity),
            unit_type: group.unitType,
          })
          .select()
          .single()

        if (groupError) {
          throw groupError
        }

        const groupRows = group.productIds.map(
          (productId) => ({
            combo_id: comboId,
            product_id: Number(productId),
            quantity: 1,
            unit_type: group.unitType,
            choice_group_id: groupData.id,
          })
        )

        const { error: componentError } =
          await supabase
            .from("combo_components")
            .insert(groupRows)

        if (componentError) {
          throw componentError
        }
      }

      alert(
        editingId
          ? "Combo atualizado com sucesso!"
          : "Combo cadastrado com sucesso!"
      )

      resetForm()
      await loadData()
    } catch (error: any) {
  console.error("ERRO AO SALVAR COMBO:", error)

  alert(
    `Erro ao salvar o combo:\n\n${
      error?.message || "Erro desconhecido"
    }`
  )
}finally {
      setLoading(false)
    }
  }

  async function editCombo(combo: Combo) {
    setEditingId(combo.id)

    setName(combo.name)

    setSalePrice(
      String(combo.sale_price).replace(".", ",")
    )

    setNightSalePrice(
      String(combo.night_sale_price).replace(".", ",")
    )

    const comboGroups = choiceGroups.filter(
      (group) => group.combo_id === combo.id
    )

    const comboComponents = components.filter(
      (component) => component.combo_id === combo.id
    )

    const fixed = comboComponents.filter(
      (component) => !component.choice_group_id
    )

    const selectable = comboGroups.map((group) => {
      const groupComponents = comboComponents.filter(
        (component) =>
          component.choice_group_id === group.id
      )

      return {
        name: group.name,
        quantity: String(group.quantity),
        unitType: group.unit_type,
        productIds: groupComponents.map(
          (component) =>
            String(component.product_id)
        ),
      }
    })

    setFixedComponents(
      fixed.map((component) => ({
        productId: String(component.product_id),
        quantity: String(component.quantity),
        unitType: component.unit_type,
      }))
    )

    setGroups(selectable)

    const fixedSearches: Record<number, string> = {}

    fixed.forEach((_, index) => {
      fixedSearches[index] = ""
    })

    const groupSearches: Record<number, string> = {}

    selectable.forEach((_, index) => {
      groupSearches[index] = ""
    })

    setFixedSearches(fixedSearches)
    setGroupSearches(groupSearches)

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  async function deleteCombo(combo: Combo) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o combo "${combo.name}"?`
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from("combos")
      .update({
        active: false,
      })
      .eq("id", combo.id)

    if (error) {
      console.error(error)
      alert("Erro ao excluir o combo.")
      return
    }

    await loadData()
  }

  function getFilteredProducts(search: string) {
    const normalizedSearch = search
      .toLowerCase()
      .trim()

    if (!normalizedSearch) {
      return products
    }

    return products.filter((product) =>
      [
        product.name,
        product.brand,
        product.flavor,
        product.volume,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    )
  }

  const comboCost = useMemo(() => {
    let total = 0

    fixedComponents.forEach((component) => {
      const quantity = Number(
        component.quantity || 0
      )

      const cost = getProductCost(
        component.productId
      )

      total += cost * quantity
    })

    groups.forEach((group) => {
      const quantity = Number(
        group.quantity || 0
      )

      if (group.productIds.length > 0) {
        const averageCost =
          group.productIds.reduce(
            (sum, productId) =>
              sum + getProductCost(productId),
            0
          ) / group.productIds.length

        total += averageCost * quantity
      }
    })

    return total
  }, [fixedComponents, groups, products])

  const normalPriceValue =
    normalizeNumber(salePrice)

  const nightPriceValue =
    normalizeNumber(nightSalePrice)

  const normalProfit =
    normalPriceValue - comboCost

  const nightProfit =
    nightPriceValue - comboCost

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          Combos
        </h1>

        <p className="text-gray-500 mt-1">
          Cadastre combos com produtos fixos e opções de escolha.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {editingId
              ? "Editar combo"
              : "Cadastrar combo"}
          </h2>

          {editingId && (
            <button
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border"
            >
              Cancelar edição
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome do combo
            </label>

            <input
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
              placeholder="Ex.: White Horse"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Preço normal
            </label>

            <input
              value={salePrice}
              onChange={(e) =>
                setSalePrice(e.target.value)
              }
              placeholder="114,89"
              inputMode="decimal"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Preço madrugada
            </label>

            <input
              value={nightSalePrice}
              onChange={(e) =>
                setNightSalePrice(e.target.value)
              }
              placeholder="128,78"
              inputMode="decimal"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold">
                Produtos fixos
              </h3>

              <p className="text-sm text-gray-500">
                Produtos que sempre fazem parte do combo.
              </p>
            </div>

            <button
              onClick={addFixedComponent}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              + Produto fixo
            </button>
          </div>

          <div className="space-y-3">
            {fixedComponents.length === 0 && (
              <div className="border rounded-lg p-4 text-gray-500">
                Nenhum produto fixo adicionado.
              </div>
            )}

            {fixedComponents.map(
              (component, index) => {
                const search =
                  fixedSearches[index] || ""

                const filteredProducts =
                  getFilteredProducts(search)

                return (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border rounded-lg p-4"
                  >
                    <div className="md:col-span-6">
                      <label className="block text-sm mb-1">
                        Produto
                      </label>

                      <div className="relative">
                        <input
                          value={
                            component.productId
                              ? getProductName(
                                  component.productId
                                )
                              : search
                          }
                          onChange={(e) => {
                            updateFixedComponent(
                              index,
                              "productId",
                              ""
                            )

                            setFixedSearches(
                              (current) => ({
                                ...current,
                                [index]:
                                  e.target.value,
                              })
                            )
                          }}
                          placeholder="Pesquisar produto..."
                          className="w-full border rounded-lg px-3 py-2"
                        />

                        {!component.productId &&
                          search.trim() && (
                            <div className="absolute z-30 left-0 right-0 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                              {filteredProducts.length ===
                              0 ? (
                                <div className="px-3 py-2 text-gray-500">
                                  Nenhum produto encontrado.
                                </div>
                              ) : (
                                filteredProducts.map(
                                  (product) => (
                                    <button
                                      key={product.id}
                                      type="button"
                                      onClick={() => {
                                        updateFixedComponent(
                                          index,
                                          "productId",
                                          String(
                                            product.id
                                          )
                                        )

                                        setFixedSearches(
                                          (current) => ({
                                            ...current,
                                            [index]: "",
                                          })
                                        )
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                    >
                                      {getProductName(
                                        product.id
                                      )}
                                    </button>
                                  )
                                )
                              )}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm mb-1">
                        Quantidade
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={component.quantity}
                        onChange={(e) =>
                          updateFixedComponent(
                            index,
                            "quantity",
                            e.target.value
                          )
                        }
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <label className="block text-sm mb-1">
                        Unidade
                      </label>

                      <select
                        value={component.unitType}
                        onChange={(e) =>
                          updateFixedComponent(
                            index,
                            "unitType",
                            e.target.value
                          )
                        }
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="Unidade">
                          Unidade
                        </option>

                        <option value="Ml">
                          Ml
                        </option>

                        <option value="Dose">
                          Dose
                        </option>
                      </select>
                    </div>

                    <button
                      onClick={() =>
                        removeFixedComponent(index)
                      }
                      className="md:col-span-1 px-3 py-2 rounded-lg border border-red-300 text-red-600"
                    >
                      Remover
                    </button>
                  </div>
                )
              }
            )}
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold">
                Grupos de escolha
              </h3>

              <p className="text-sm text-gray-500">
                Use quando o cliente puder escolher entre vários produtos.
              </p>
            </div>

            <button
              onClick={addChoiceGroup}
              className="px-4 py-2 rounded-lg bg-black text-white"
            >
              + Grupo de escolha
            </button>
          </div>

          <div className="space-y-5">
            {groups.length === 0 && (
              <div className="border rounded-lg p-4 text-gray-500">
                Nenhum grupo de escolha adicionado.
              </div>
            )}

            {groups.map((group, groupIndex) => {
              const search =
                groupSearches[groupIndex] || ""

              const filteredProducts =
                getFilteredProducts(search)

              return (
                <div
                  key={groupIndex}
                  className="border rounded-xl p-5 space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-sm mb-1">
                        Nome do grupo
                      </label>

                      <input
                        value={group.name}
                        onChange={(e) =>
                          updateChoiceGroup(
                            groupIndex,
                            "name",
                            e.target.value
                          )
                        }
                        placeholder="Ex.: Gelo"
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Quantidade a escolher
                      </label>

                      <input
                        type="number"
                        min="1"
                        value={group.quantity}
                        onChange={(e) =>
                          updateChoiceGroup(
                            groupIndex,
                            "quantity",
                            e.target.value
                          )
                        }
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-1">
                        Unidade
                      </label>

                      <select
                        value={group.unitType}
                        onChange={(e) =>
                          updateChoiceGroup(
                            groupIndex,
                            "unitType",
                            e.target.value
                          )
                        }
                        className="w-full border rounded-lg px-3 py-2"
                      >
                        <option value="Unidade">
                          Unidade
                        </option>

                        <option value="Ml">
                          Ml
                        </option>

                        <option value="Dose">
                          Dose
                        </option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() =>
                          removeChoiceGroup(
                            groupIndex
                          )
                        }
                        className="w-full px-3 py-2 rounded-lg border border-red-300 text-red-600"
                      >
                        Remover grupo
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="font-medium">
                        Produtos disponíveis para escolha
                      </label>
                    </div>

                    <input
                      value={search}
                      onChange={(e) =>
                        setGroupSearches(
                          (current) => ({
                            ...current,
                            [groupIndex]:
                              e.target.value,
                          })
                        )
                      }
                      placeholder="Pesquisar produto..."
                      className="w-full border rounded-lg px-3 py-2 mb-3"
                    />

                    <div className="max-h-60 overflow-y-auto border rounded-lg">
                      {filteredProducts.length ===
                      0 ? (
                        <div className="px-3 py-3 text-gray-500">
                          Nenhum produto encontrado.
                        </div>
                      ) : (
                        filteredProducts.map(
                          (product) => {
                            const selected =
                              group.productIds.includes(
                                String(product.id)
                              )

                            return (
                              <label
                                key={product.id}
                                className="flex items-center gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    toggleGroupProduct(
                                      groupIndex,
                                      String(
                                        product.id
                                      )
                                    )
                                  }
                                />

                                <span>
                                  {getProductName(
                                    product.id
                                  )}
                                </span>
                              </label>
                            )
                          }
                        )
                      )}
                    </div>

                    <p className="text-sm text-gray-500 mt-2">
                      {group.productIds.length} produto(s)
                      selecionado(s).
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-bold mb-3">
            Resumo
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Custo estimado
              </p>

              <p className="text-xl font-bold">
                {formatMoney(comboCost)}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Lucro preço normal
              </p>

              <p className="text-xl font-bold">
                {formatMoney(normalProfit)}
              </p>
            </div>

            <div className="border rounded-lg p-4">
              <p className="text-sm text-gray-500">
                Lucro madrugada
              </p>

              <p className="text-xl font-bold">
                {formatMoney(nightProfit)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          {editingId && (
            <button
              onClick={resetForm}
              className="px-5 py-2 rounded-lg border"
            >
              Cancelar
            </button>
          )}

          <button
            onClick={saveCombo}
            disabled={loading}
            className="px-5 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          >
            {loading
              ? "Salvando..."
              : editingId
              ? "Salvar alterações"
              : "Cadastrar combo"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-bold mb-5">
          Combos cadastrados
        </h2>

        {combos.length === 0 ? (
          <p className="text-gray-500">
            Nenhum combo cadastrado.
          </p>
        ) : (
          <div className="space-y-4">
            {combos.map((combo) => {
              const comboComponents =
                components.filter(
                  (component) =>
                    component.combo_id === combo.id
                )

              const comboGroups =
                choiceGroups.filter(
                  (group) =>
                    group.combo_id === combo.id
                )

              const fixed =
                comboComponents.filter(
                  (component) =>
                    !component.choice_group_id
                )

              return (
                <div
                  key={combo.id}
                  className="border rounded-xl p-5"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold">
                        {combo.name}
                      </h3>

                      <div className="text-sm text-gray-600 mt-1">
                        Normal:{" "}
                        <strong>
                          {formatMoney(
                            combo.sale_price
                          )}
                        </strong>

                        {" • "}

                        Madrugada:{" "}
                        <strong>
                          {formatMoney(
                            combo.night_sale_price
                          )}
                        </strong>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          editCombo(combo)
                        }
                        className="px-4 py-2 rounded-lg border"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() =>
                          deleteCombo(combo)
                        }
                        className="px-4 py-2 rounded-lg border border-red-300 text-red-600"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    {fixed.length > 0 && (
                      <div>
                        <p className="font-medium">
                          Produtos fixos:
                        </p>

                        <ul className="list-disc ml-5 text-sm text-gray-600">
                          {fixed.map((component) => (
                            <li key={component.id}>
                              {component.quantity}x{" "}
                              {getProductName(
                                component.product_id
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {comboGroups.map((group) => {
                      const allowedProducts =
                        comboComponents.filter(
                          (component) =>
                            component.choice_group_id ===
                            group.id
                        )

                      return (
                        <div key={group.id}>
                          <p className="font-medium">
                            {group.name}:{" "}
                            {group.quantity}x
                          </p>

                          <p className="text-sm text-gray-600">
                            Pode escolher entre:{" "}
                            {allowedProducts
                              .map((component) =>
                                getProductName(
                                  component.product_id
                                )
                              )
                              .join(", ")}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Combos