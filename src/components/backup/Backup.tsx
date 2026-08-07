import { useRef } from "react"

function Backup(){

const fileRef = useRef<HTMLInputElement>(null)


function exportBackup(){

const data = {

products:
localStorage.getItem("products"),

sales:
localStorage.getItem("sales"),

categories:
localStorage.getItem("categories"),

brands:
localStorage.getItem("brands"),

flavors:
localStorage.getItem("flavors")

}


const blob = new Blob(
[
JSON.stringify(data,null,2)
],
{
type:"application/json"
}
)


const url =
URL.createObjectURL(blob)


const link =
document.createElement("a")

link.href = url

link.download =
"backup-zero-grau.json"


link.click()


URL.revokeObjectURL(url)

}



function importBackup(
event: React.ChangeEvent<HTMLInputElement>
){

const file =
event.target.files?.[0]


if(!file)
return


const reader =
new FileReader()


reader.onload = ()=>{


const data =
JSON.parse(
reader.result as string
)



Object.keys(data).forEach(
(key)=>{

if(data[key]){

localStorage.setItem(
key,
data[key]
)

}

}

)


alert(
"Backup restaurado! Recarregue a página."
)


}



reader.readAsText(file)

}



return(

<div className="bg-white p-6 rounded-xl shadow mt-6">

<h2 className="font-bold text-lg">
💾 Backup do sistema
</h2>


<p className="text-gray-500 mt-2">
Salve seus produtos, vendas e configurações.
</p>



<div className="flex gap-4 mt-5">


<button

onClick={exportBackup}

className="bg-blue-800 text-white px-5 py-2 rounded-lg"

>

Exportar backup

</button>



<button

onClick={()=>
fileRef.current?.click()
}

className="bg-green-700 text-white px-5 py-2 rounded-lg"

>

Restaurar backup

</button>


<input

ref={fileRef}

type="file"

accept=".json"

className="hidden"

onChange={importBackup}

/>


</div>


</div>

)

}

export default Backup