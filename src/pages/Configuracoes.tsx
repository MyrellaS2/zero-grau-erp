  import { useEffect, useState } from "react"
  import { supabase } from "../lib/supabase"
  import Backup from "../components/backup/Backup"

  interface Brand {
  id: number
  name: string
  category: string
  }

  interface Flavor {
  id: number
  name: string
  category: string
  }

  function Configuracoes() {
  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [flavors, setFlavors] = useState<Flavor[]>([])
  const [deliveryFee, setDeliveryFee] = useState("")
  const [deliveryFeeNight, setDeliveryFeeNight] = useState("")
const [savingDeliveryFeeNight, setSavingDeliveryFeeNight] = useState(false)
const [savingDeliveryFee, setSavingDeliveryFee] = useState(false)

  const [category, setCategory] = useState("")
  const [brand, setBrand] = useState("")
  const [brandCategory, setBrandCategory] = useState("")
  const [flavor, setFlavor] = useState("")
  const [flavorCategory, setFlavorCategory] = useState("")

  const [editingCategory, setEditingCategory] =
  useState<string | null>(null)

  const [editingBrand, setEditingBrand] =
  useState<number | null>(null)

  const [editingFlavor, setEditingFlavor] =
  useState<number | null>(null)

  useEffect(() => {
  async function loadData() {
    const { data: settingsData, error: settingsError } =
  await supabase
    .from("settings")
    .select("*")
    .limit(1)

if (settingsError) {
  console.error(
    "ERRO AO CARREGAR CONFIGURAÇÕES:",
    settingsError
  )
} else if (settingsData && settingsData.length > 0) {
  setDeliveryFee(
    String(settingsData[0].delivery_fee ?? 5)
  )
  setDeliveryFeeNight(
  String(settingsData[0].delivery_fee_night ?? 7)
)
}
  const [
  categoriesResult,
  brandsResult,
  flavorsResult,
  ] = await Promise.all([
  supabase
  .from("categories")
  .select("*")
  .order("name"),


      supabase
        .from("brands")
        .select("*")
        .order("name"),

      supabase
        .from("flavors")
        .select("*")
        .order("name"),
    ])

    if (categoriesResult.error) {
      console.error(
        "ERRO AO CARREGAR CATEGORIAS:",
        categoriesResult.error
      )
    } else {
      setCategories(
        (categoriesResult.data || []).map(
          (item: any) => item.name
        )
      )
    }

    if (brandsResult.error) {
      console.error(
        "ERRO AO CARREGAR MARCAS:",
        brandsResult.error
      )
    } else {
      setBrands(
        (brandsResult.data || []).map(
          (item: any) => ({
            id: Number(item.id),
            name: item.name,
            category: item.category,
          })
        )
      )
    }

    if (flavorsResult.error) {
      console.error(
        "ERRO AO CARREGAR SABORES:",
        flavorsResult.error
      )
    } else {
      setFlavors(
        (flavorsResult.data || []).map(
          (item: any) => ({
            id: Number(item.id),
            name: item.name,
            category: item.category,
          })
        )
      )
    }
  }

  loadData()


  }, [])

  async function addCategory() {
  const name = category.trim()


  if (!name) {
    alert("Informe o nome da categoria.")
    return
  }

  const exists = categories.some(
    (item) =>
      item.toLowerCase() === name.toLowerCase()
  )

  if (exists) {
    alert("Essa categoria já existe.")
    return
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
    })
    .select()

  if (error) {
    console.error(
      "ERRO AO ADICIONAR CATEGORIA:",
      error
    )
    alert("Erro ao adicionar categoria.")
    return
  }

  if (data && data.length > 0) {
    setCategories([
      ...categories,
      data[0].name,
    ])
  }

  setCategory("")


  }

  function editCategory(item: string) {
  setCategory(item)
  setEditingCategory(item)
  }

  async function saveEditCategory() {
  if (!category.trim()) {
  alert("Informe o nome da categoria.")
  return
  }


  if (editingCategory === null) {
    return
  }

  const oldName = editingCategory
  const newName = category.trim()

  if (oldName === newName) {
    setCategory("")
    setEditingCategory(null)
    return
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: newName,
    })
    .eq("name", oldName)

  if (error) {
    console.error(
      "ERRO AO EDITAR CATEGORIA:",
      error
    )
    alert("Erro ao editar categoria.")
    return
  }

  setCategories(
    categories.map((item) =>
      item === oldName
        ? newName
        : item
    )
  )

  setCategory("")
  setEditingCategory(null)


  }

  async function deleteCategory(item: string) {
  const confirmDelete =
  window.confirm(
  `Excluir a categoria "${item}"?`
  )


  if (!confirmDelete) {
    return
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("name", item)

  if (error) {
    console.error(
      "ERRO AO EXCLUIR CATEGORIA:",
      error
    )
    alert("Erro ao excluir categoria.")
    return
  }

  setCategories(
    categories.filter(
      (cat) => cat !== item
    )
  )

  if (editingCategory === item) {
    setEditingCategory(null)
    setCategory("")
  }


  }

  async function addBrand() {
  const name = brand.trim()


  if (!name || !brandCategory) {
    alert(
      "Informe a marca e a categoria."
    )
    return
  }

  const exists = brands.some(
    (item) =>
      item.name.toLowerCase() ===
        name.toLowerCase() &&
      item.category === brandCategory
  )

  if (exists) {
    alert("Essa marca já existe nessa categoria.")
    return
  }

  const { data, error } = await supabase
    .from("brands")
    .insert({
      name,
      category: brandCategory,
    })
    .select()

  if (error) {
    console.error(
      "ERRO AO ADICIONAR MARCA:",
      error
    )
    alert("Erro ao adicionar marca.")
    return
  }

  if (data && data.length > 0) {
    setBrands([
      ...brands,
      {
        id: Number(data[0].id),
        name: data[0].name,
        category: data[0].category,
      },
    ])
  }

  setBrand("")
  setBrandCategory("")


  }

  function editBrand(item: Brand) {
  setBrand(item.name)
  setBrandCategory(item.category)
  setEditingBrand(item.id)
  }

  async function saveEditBrand() {
  if (
  editingBrand === null ||
  !brand.trim() ||
  !brandCategory
  ) {
  alert(
  "Informe a marca e a categoria."
  )
  return
  }


  const { error } = await supabase
    .from("brands")
    .update({
      name: brand.trim(),
      category: brandCategory,
    })
    .eq("id", editingBrand)

  if (error) {
    console.error(
      "ERRO AO EDITAR MARCA:",
      error
    )
    alert("Erro ao editar marca.")
    return
  }

  setBrands(
    brands.map((item) =>
      item.id === editingBrand
        ? {
            ...item,
            name: brand.trim(),
            category: brandCategory,
          }
        : item
    )
  )

  setBrand("")
  setBrandCategory("")
  setEditingBrand(null)


  }

  async function deleteBrand(id: number) {
  const confirmDelete =
  window.confirm(
  "Excluir essa marca?"
  )


  if (!confirmDelete) {
    return
  }

  const { error } = await supabase
    .from("brands")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(
      "ERRO AO EXCLUIR MARCA:",
      error
    )
    alert("Erro ao excluir marca.")
    return
  }

  setBrands(
    brands.filter(
      (item) => item.id !== id
    )
  )

  if (editingBrand === id) {
    setEditingBrand(null)
    setBrand("")
    setBrandCategory("")
  }


  }

  async function addFlavor() {
  const name = flavor.trim()


  if (!name || !flavorCategory) {
    alert(
      "Informe o sabor e a categoria."
    )
    return
  }

  const exists = flavors.some(
    (item) =>
      item.name.toLowerCase() ===
        name.toLowerCase() &&
      item.category === flavorCategory
  )

  if (exists) {
    alert(
      "Esse sabor já existe nessa categoria."
    )
    return
  }

  const { data, error } = await supabase
    .from("flavors")
    .insert({
      name,
      category: flavorCategory,
    })
    .select()

  if (error) {
    console.error(
      "ERRO AO ADICIONAR SABOR:",
      error
    )
    alert("Erro ao adicionar sabor.")
    return
  }

  if (data && data.length > 0) {
    setFlavors([
      ...flavors,
      {
        id: Number(data[0].id),
        name: data[0].name,
        category: data[0].category,
      },
    ])
  }

  setFlavor("")
  setFlavorCategory("")


  }

  function editFlavor(item: Flavor) {
  setFlavor(item.name)
  setFlavorCategory(item.category)
  setEditingFlavor(item.id)
  }

  async function saveEditFlavor() {
  if (
  editingFlavor === null ||
  !flavor.trim() ||
  !flavorCategory
  ) {
  alert(
  "Informe o sabor e a categoria."
  )
  return
  }

  const { error } = await supabase
    .from("flavors")
    .update({
      name: flavor.trim(),
      category: flavorCategory,
    })
    .eq("id", editingFlavor)

  if (error) {
    console.error(
      "ERRO AO EDITAR SABOR:",
      error
    )
    alert("Erro ao editar sabor.")
    return
  }

  setFlavors(
    flavors.map((item) =>
      item.id === editingFlavor
        ? {
            ...item,
            name: flavor.trim(),
            category: flavorCategory,
          }
        : item
    )
  )

  setFlavor("")
  setFlavorCategory("")
  setEditingFlavor(null)


  }

  async function deleteFlavor(id: number) {
  const confirmDelete =
  window.confirm(
  "Excluir esse sabor?"
  )


  if (!confirmDelete) {
    return
  }

  const { error } = await supabase
    .from("flavors")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(
      "ERRO AO EXCLUIR SABOR:",
      error
    )
    alert("Erro ao excluir sabor.")
    return
  }

  setFlavors(
    flavors.filter(
      (item) => item.id !== id
    )
  )

  if (editingFlavor === id) {
    setEditingFlavor(null)
    setFlavor("")
    setFlavorCategory("")
  }


  }
async function saveDeliveryFee() {
  const value = Number(
    deliveryFee.replace(",", ".")
  )

  if (isNaN(value) || value < 0) {
    alert("Informe um valor de frete válido.")
    return
  }

  setSavingDeliveryFee(true)

  const { data: settingsData } =
    await supabase
      .from("settings")
      .select("id")
      .limit(1)

  if (!settingsData || settingsData.length === 0) {
    alert("Configuração de frete não encontrada.")
    setSavingDeliveryFee(false)
    return
  }

  const { error } = await supabase
    .from("settings")
    .update({
      delivery_fee: value
    })
    .eq("id", settingsData[0].id)

  if (error) {
    console.error(
      "ERRO AO SALVAR FRETE:",
      error
    )

    alert("Erro ao salvar o valor do frete.")
    setSavingDeliveryFee(false)
    return
  }

  setDeliveryFee(value.toFixed(2))

  alert("Valor do frete salvo!")

  setSavingDeliveryFee(false)
}
async function saveDeliveryFeeNight() {
  const value = Number(
    deliveryFeeNight.replace(",", ".")
  )

  if (isNaN(value) || value < 0) {
    alert("Informe um valor de frete válido.")
    return
  }

  setSavingDeliveryFeeNight(true)

  const { data: settingsData } =
    await supabase
      .from("settings")
      .select("id")
      .limit(1)

  if (!settingsData || settingsData.length === 0) {
    alert("Configuração de frete não encontrada.")
    setSavingDeliveryFeeNight(false)
    return
  }

  const { error } = await supabase
    .from("settings")
    .update({
      delivery_fee_night: value
    })
    .eq("id", settingsData[0].id)

  if (error) {
    console.error(
      "ERRO AO SALVAR FRETE DA MADRUGADA:",
      error
    )

    alert("Erro ao salvar o valor do frete da madrugada.")
    setSavingDeliveryFeeNight(false)
    return
  }

  setDeliveryFeeNight(value.toFixed(2))

  alert("Frete da madrugada salvo!")

  setSavingDeliveryFeeNight(false)
}
  return (
    <div> <h1 className="text-3xl font-bold">
  Configurações </h1>


    <p className="mt-2 text-gray-500">
      Gerencie categorias, marcas e sabores da ZERO GRAU
    </p>

    <div className="grid grid-cols-3 gap-6 mt-8">
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          📦 Categorias
        </h2>

        <input
          className="border p-2 rounded w-full mt-4"
          placeholder="Ex: Cerveja"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
        />

        <button
          onClick={
            editingCategory
              ? saveEditCategory
              : addCategory
          }
          className="mt-3 bg-blue-700 text-white px-4 py-2 rounded"
        >
          {editingCategory
            ? "Salvar edição"
            : "Adicionar"}
        </button>

        {editingCategory && (
          <button
            onClick={() => {
              setCategory("")
              setEditingCategory(null)
            }}
            className="mt-3 ml-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        )}

        <div className="mt-5 space-y-2">
          {categories.map((item) => (
            <div
              key={item}
              className="flex justify-between items-center border-b py-2"
            >
              <span>{item}</span>

              <div>
                <button
                  onClick={() =>
                    editCategory(item)
                  }
                  className="text-blue-600 mr-3"
                >
                  Editar
                </button>

                <button
                  onClick={() =>
                    deleteCategory(item)
                  }
                  className="text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <p className="text-gray-500">
              Nenhuma categoria cadastrada.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          🏷️ Marcas
        </h2>

        <input
          className="border p-2 rounded w-full mt-4"
          placeholder="Marca"
          value={brand}
          onChange={(e) =>
            setBrand(e.target.value)
          }
        />

        <select
          className="border p-2 rounded w-full mt-3"
          value={brandCategory}
          onChange={(e) =>
            setBrandCategory(
              e.target.value
            )
          }
        >
          <option value="">
            Selecione a categoria
          </option>

          {categories.map((cat) => (
            <option
              key={cat}
              value={cat}
            >
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={
            editingBrand
              ? saveEditBrand
              : addBrand
          }
          className="mt-3 bg-blue-700 text-white px-4 py-2 rounded"
        >
          {editingBrand
            ? "Salvar edição"
            : "Adicionar marca"}
        </button>

        {editingBrand && (
          <button
            onClick={() => {
              setBrand("")
              setBrandCategory("")
              setEditingBrand(null)
            }}
            className="mt-3 ml-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        )}

        <div className="mt-5 space-y-2">
          {brands.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b py-2"
            >
              <div>
                <p className="font-medium">
                  {item.name}
                </p>

                <p className="text-sm text-gray-500">
                  {item.category}
                </p>
              </div>

              <div>
                <button
                  onClick={() =>
                    editBrand(item)
                  }
                  className="text-blue-600 mr-3"
                >
                  Editar
                </button>

                <button
                  onClick={() =>
                    deleteBrand(item.id)
                  }
                  className="text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {brands.length === 0 && (
            <p className="text-gray-500">
              Nenhuma marca cadastrada.
            </p>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="font-bold text-lg">
          🍹 Sabores
        </h2>

        <input
          className="border p-2 rounded w-full mt-4"
          placeholder="Ex: Limão"
          value={flavor}
          onChange={(e) =>
            setFlavor(e.target.value)
          }
        />

        <select
          className="border p-2 rounded w-full mt-3"
          value={flavorCategory}
          onChange={(e) =>
            setFlavorCategory(
              e.target.value
            )
          }
        >
          <option value="">
            Selecione a categoria
          </option>

          {categories.map((cat) => (
            <option
              key={cat}
              value={cat}
            >
              {cat}
            </option>
          ))}
        </select>

        <button
          onClick={
            editingFlavor
              ? saveEditFlavor
              : addFlavor
          }
          className="mt-3 bg-blue-700 text-white px-4 py-2 rounded"
        >
          {editingFlavor
            ? "Salvar edição"
            : "Adicionar sabor"}
        </button>

        {editingFlavor && (
          <button
            onClick={() => {
              setFlavor("")
              setFlavorCategory("")
              setEditingFlavor(null)
            }}
            className="mt-3 ml-2 bg-gray-500 text-white px-4 py-2 rounded"
          >
            Cancelar
          </button>
        )}

        <div className="mt-5 space-y-2">
          {flavors.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center border-b py-2"
            >
              <div>
                <p className="font-medium">
                  {item.name}
                </p>

                <p className="text-sm text-gray-500">
                  {item.category}
                </p>
              </div>

              <div>
                <button
                  onClick={() =>
                    editFlavor(item)
                  }
                  className="text-blue-600 mr-3"
                >
                  Editar
                </button>

                <button
                  onClick={() =>
                    deleteFlavor(item.id)
                  }
                  className="text-red-600"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}

          {flavors.length === 0 && (
            <p className="text-gray-500">
              Nenhum sabor cadastrado.
            </p>
          )}
             </div>
    </div>

  </div>

  <div className="mt-8 bg-white p-6 rounded-xl shadow">
  <h2 className="font-bold text-lg">
    🚚 Frete
  </h2>

  <p className="text-gray-500 mt-1">
    Defina os valores cobrados por entrega.
  </p>

  <div className="mt-4">
    <p className="font-medium mb-2">
      Frete normal
    </p>

    <div className="flex gap-3">
      <input
        type="number"
        step="0.01"
        min="0"
        className="border p-2 rounded w-full max-w-xs"
        placeholder="Valor do frete"
        value={deliveryFee}
        onChange={(e) =>
          setDeliveryFee(e.target.value)
        }
      />

      <button
        onClick={saveDeliveryFee}
        disabled={savingDeliveryFee}
        className="bg-blue-700 text-white px-4 py-2 rounded"
      >
        {savingDeliveryFee
          ? "Salvando..."
          : "Salvar frete"}
      </button>
    </div>
  </div>

  <div className="mt-6">
    <p className="font-medium mb-2">
      Frete da madrugada
    </p>

    <div className="flex gap-3">
      <input
        type="number"
        step="0.01"
        min="0"
        className="border p-2 rounded w-full max-w-xs"
        placeholder="Valor do frete da madrugada"
        value={deliveryFeeNight}
        onChange={(e) =>
          setDeliveryFeeNight(e.target.value)
        }
      />

      <button
        onClick={saveDeliveryFeeNight}
        disabled={savingDeliveryFeeNight}
        className="bg-blue-700 text-white px-4 py-2 rounded"
      >
        {savingDeliveryFeeNight
          ? "Salvando..."
          : "Salvar frete da madrugada"}
      </button>
    </div>
  </div>
</div>
       <Backup />
  </div>
  )
}

export default Configuracoes