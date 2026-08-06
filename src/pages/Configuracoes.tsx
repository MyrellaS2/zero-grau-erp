import { useEffect, useState } from "react"

function Configuracoes() {

  const [categories, setCategories] = useState<string[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [flavors, setFlavors] = useState<any[]>([])

  const [category, setCategory] = useState("")

  const [brand, setBrand] = useState("")
  const [brandCategory, setBrandCategory] = useState("")

  const [flavor, setFlavor] = useState("")
  const [flavorCategory, setFlavorCategory] = useState("")


  useEffect(() => {

    const savedCategories =
      localStorage.getItem("categories")

    const savedBrands =
      localStorage.getItem("brands")

    const savedFlavors =
      localStorage.getItem("flavors")


    if(savedCategories){
      setCategories(JSON.parse(savedCategories))
    }


    if(savedBrands){

      setBrands(JSON.parse(savedBrands))

    }


    if(savedFlavors){

      setFlavors(JSON.parse(savedFlavors))

    }


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

onClick={addCategory}

className="mt-3 bg-blue-700 text-white px-4 py-2 rounded"

>

Adicionar

</button>




<div className="mt-4">


{categories.map((item)=>(


<div

key={item}

className="flex justify-between border-b py-2"

>


{item}



<button

onClick={()=>deleteCategory(item)}

className="text-red-600"

>

Excluir

</button>



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

onClick={addBrand}

className="mt-3 bg-blue-700 text-white px-4 py-2 rounded"

>

Adicionar marca

</button>




<div className="mt-4">


{brands.map((item)=>(


<div

key={item.id}

className="border-b py-2 flex justify-between"

>


<span>

{item.name}

<br/>

<small className="text-gray-500">
{item.category}
</small>

</span>



<button

onClick={()=>deleteBrand(item.id)}

className="text-red-600"

>

Excluir

</button>



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

className="border-b py-2 flex justify-between"

>


<span>

{item.name}

<br/>

<small className="text-gray-500">

{item.category}

</small>

</span>





<button

onClick={()=>deleteFlavor(item.id)}

className="text-red-600"

>

Excluir

</button>



</div>


))}


</div>


</div>






</div>


</div>

)

}


export default Configuracoes