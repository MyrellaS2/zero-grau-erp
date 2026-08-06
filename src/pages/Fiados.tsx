import { useEffect, useState } from "react"

function Fiados() {

  const [sales, setSales] = useState<any[]>([])


  useEffect(() => {
    

    const saved = localStorage.getItem("sales")

    if (saved) {
      setSales(JSON.parse(saved))
    }

  }, [])



  const pendingFiados = sales.filter(
    (sale) => sale.payment === "Fiado" && sale.status === "Pendente"
  )
  function markAsPaid(id: number) {

  const updatedSales = sales.map((sale) =>

    sale.id === id
      ? {
          ...sale,
          status: "Pago"
        }
      : sale

  )

  setSales(updatedSales)

  localStorage.setItem(
    "sales",
    JSON.stringify(updatedSales)
  )

}
function deleteFiado(id:number){

  const confirmDelete = window.confirm(
    "Excluir esse fiado?"
  )

  if(!confirmDelete) return


  const updatedSales = sales.filter(
    (sale)=> sale.id !== id
  )


  setSales(updatedSales)


  localStorage.setItem(
    "sales",
    JSON.stringify(updatedSales)
  )

}


  return (
    <div>

      <h1 className="text-3xl font-bold">
        Fiados
      </h1>
      <p>Total de vendas: {sales.length}</p>
<p>Fiados pendentes: {pendingFiados.length}</p>

      <p className="mt-2 text-gray-500">
        Controle de clientes pendentes
      </p>



      <div className="mt-8 bg-white p-6 rounded-xl shadow">

        <h2 className="font-bold text-lg">
          📝 Fiados pendentes
        </h2>


        <div className="mt-4 space-y-3">

          {pendingFiados.map((sale) => (

            <div
              key={sale.id}
              className="border rounded-lg p-4 flex justify-between"
            >

              <div>

                <p className="font-bold">
                  {sale.customer || "Cliente não informado"}
                </p>

                <p className="text-gray-500">
                  {sale.product} - {sale.quantity} un
                </p>

                <p className="text-gray-500">
                  📅 {sale.date}
                </p>

              </div>


              <div className="text-right">

                <p className="font-bold">
                  R$ {sale.total.toFixed(2)}
                </p>

                <p className="text-red-600">
                  Pendente
                </p>
                <button
  onClick={() => markAsPaid(sale.id)}
  className="mt-2 bg-green-600 text-white px-3 py-1 rounded"
>
  Marcar como pago
</button>
<button
  onClick={() => deleteFiado(sale.id)}
  className="mt-2 ml-2 bg-red-600 text-white px-3 py-1 rounded"
>
  🗑 Excluir
</button>

              </div>


            </div>

          ))}


        </div>

      </div>


    </div>
  )
}


export default Fiados