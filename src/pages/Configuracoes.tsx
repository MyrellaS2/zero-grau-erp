import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Configuracoes() {

  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [flavors, setFlavors] = useState<any[]>([])

  const [category, setCategory] = useState("")

  const [brand, setBrand] = useState("")
  const [brandCategory, setBrandCategory] = useState("")

  const [flavor, setFlavor] = useState("")
  const [flavorCategory, setFlavorCategory] = useState("")
  const [editingCategory, setEditingCategory] = useState<string | null>(null)

const [editingBrand, setEditingBrand] = useState<number | null>(null)

const [editingFlavor, setEditingFlavor] = useState<number | null>(null)


 useEffect(() => {

  async function loadData(){

    const { data: categoriesData, error } =
      await supabase
        .from("categories")
        .select("*")


    if(error){
      console.log(error)
      return
    }


    setCategories(
      categoriesData.map(
        (item) => item.name
      )
    )

  }


  loadData()

}, [])



  function saveCategories(updated:string[]){

    setCategories(updated)

    localStorage.setItem(
      "categories",
      JSON.stringify(updated)
    )

  }



  function addCategory(){

    if(!category.trim()) return


    saveCategories([
      ...categories,
      category
    ])


    setCategory("")

  }



  function addBrand(){

    if(!brand.trim() || !brandCategory){

      alert("Informe marca e categoria")
      return

    }


    const updated = [

      ...brands,

      {
        id: Date.now(),
        name: brand,
        category: brandCategory
      }

    ]


    setBrands(updated)


    localStorage.setItem(
      "brands",
      JSON.stringify(updated)
    )


    setBrand("")
    setBrandCategory("")

  }



  function addFlavor(){

    if(!flavor.trim() || !flavorCategory){

      alert("Informe sabor e categoria")
      return

    }


    const updated = [

  ...flavors,

  {
    id: Date.now(),
    name: flavor,
    category: flavorCategory
  }

]


    setFlavors(updated)


    localStorage.setItem(
      "flavors",
      JSON.stringify(updated)
    )


    setFlavor("")
    setFlavorCategory("")

  }
  
  function deleteBrand(id:number){

    const updated =
      brands.filter(
        (item)=>item.id !== id
      )


    setBrands(updated)


    localStorage.setItem(
      "brands",
      JSON.stringify(updated)
    )

  }



  function deleteFlavor(id:number){

    const updated =
      flavors.filter(
        (item)=>item.id !== id
      )


    setFlavors(updated)


    localStorage.setItem(
      "flavors",
      JSON.stringify(updated)
    )

  }



  function deleteCategory(item:string){

    const updated =
      categories.filter(
        (cat)=>cat !== item
      )


    saveCategories(updated)

  }
function editCategory(item:string){

  setCategory(item)

  setEditingCategory(item)

}


function saveEditCategory(){

  if(!category.trim())
    return


  const updated =
    categories.map(
      item =>
        item === editingCategory
        ? category
        : item
    )


  saveCategories(updated)

  setCategory("")
  setEditingCategory(null)

}



function editBrand(item:any){

  setBrand(item.name)

  setBrandCategory(item.category)

  setEditingBrand(item.id)

}



function saveEditBrand(){

  const updated =
    brands.map(
      item =>
        item.id === editingBrand
        ?
        {
          ...item,
          name: brand,
          category: brandCategory
        }
        :
        item
    )


  setBrands(updated)

  localStorage.setItem(
    "brands",
    JSON.stringify(updated)
  )


  setBrand("")
  setBrandCategory("")
  setEditingBrand(null)

}



function editFlavor(item:any){

  setFlavor(item.name)

  setFlavorCategory(item.category)

  setEditingFlavor(item.id)

}



function saveEditFlavor(){

  const updated =
    flavors.map(
      item =>
        item.id === editingFlavor
        ?
        {
          ...item,
          name: flavor,
          category: flavorCategory
        }
        :
        item
    )


  setFlavors(updated)

  localStorage.setItem(
    "flavors",
    JSON.stringify(updated)
  )


  setFlavor("")
  setFlavorCategory("")
  setEditingFlavor(null)

}


return (

<div>


<h1 className="text-3xl font-bold">
⚙️ Configurações
</h1>


<p className="mt-2 text-gray-500">
Cadastros auxiliares da ZERO GRAU
</p>



<div className="grid grid-cols-2 gap-6 mt-8">





<div className="bg-white p-6 rounded-xl shadow">


<h2 className="font-bold text-lg">
📦 Categorias
</h2>


<input

className="border p-2 rounded w-full mt-3"

placeholder="Ex: Cerveja"

value={category}

onChange={(e)=>setCategory(e.target.value)}

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




<div className="mt-4">


{categories.map((item)=>(

<div

key={item}

className="flex justify-between items-center border-b py-2"

>

<span>
{item}
</span>


<div className="flex gap-3">

<button

onClick={()=>editCategory(item)}

className="text-blue-600"

>

Editar

</button>


<button

onClick={()=>deleteCategory(item)}

className="text-red-600"

>

Excluir

</button>


</div>


</div>

))}





</div>


</div>







<div className="bg-white p-6 rounded-xl shadow">


<h2 className="font-bold text-lg">
🏷️ Marcas por categoria
</h2>




<input

className="border p-2 rounded w-full mt-3"

placeholder="Marca"

value={brand}

onChange={(e)=>setBrand(e.target.value)}

/>





<select

className="border p-2 rounded w-full mt-3"

value={brandCategory}

onChange={(e)=>setBrandCategory(e.target.value)}

>


<option value="">
Categoria
</option>



{categories.map((cat)=>(


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




<div className="mt-4">


{brands.map((item)=>(

<div

key={item.id}

className="flex justify-between items-center border-b py-2"

>

<span>
  {item.name}
</span>


<div className="flex gap-3">

  <button

    onClick={()=>editBrand(item)}

    className="text-blue-600"

  >

    Editar

  </button>



  <button

    onClick={()=>deleteBrand(item.id)}

    className="text-red-600"

  >

    Excluir

  </button>


</div>


</div>

))}


</div>


</div>




<div className="bg-white p-6 rounded-xl shadow">


<h2 className="font-bold text-lg">
🧊 Sabores
</h2>




<input

className="border p-2 rounded w-full mt-3"

placeholder="Ex: Limão"

value={flavor}

onChange={(e)=>setFlavor(e.target.value)}

/>





<select

className="border p-2 rounded w-full mt-3"

value={flavorCategory}

onChange={(e)=>setFlavorCategory(e.target.value)}

>


<option value="">
Categoria
</option>




{categories.map((cat)=>(


<option

key={cat}

value={cat}

>

{cat}

</option>


))}



</select>






<button

onClick={addFlavor}

className="mt-3 bg-blue-700 text-white px-4 py-2 rounded"

>

Adicionar sabor

</button>







<div className="mt-4">


{flavors.map((item)=>(

<div

key={item.id}

className="flex justify-between items-center border-b py-2"

>

<div>

<span>
{item.name}
</span>

<p className="text-sm text-gray-500">
{item.category}
</p>

</div>


<div className="flex gap-3">


<button

onClick={()=>editFlavor(item)}

className="text-blue-600"

>

Editar

</button>



<button

onClick={()=>deleteFlavor(item.id)}

className="text-red-600"

>

Excluir

</button>


</div>


</div>

))}


</div>


</div>






</div>

<Backup />
</div>

)

}


export default Configuracoes
import Backup from "../components/backup/Backup"