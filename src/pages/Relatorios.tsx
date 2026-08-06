import { useEffect, useState } from "react"

function Relatorios() {

  const [sales, setSales] = useState<any[]>([])


  useEffect(() => {

    const saved = localStorage.getItem("sales")

    if(saved){
      setSales(JSON.parse(saved))
    }

  }, [])



  const faturamento = sales.reduce(
    (total, sale)=>
      total + sale.total,
    0
  )



  const lucro = sales.reduce(
    (total, sale)=>
      total + sale.profit,
    0
  )



  const quantidadeVendida = sales.reduce(
    (total, sale)=>
      total + sale.quantity,
    0
  )



  const pagamentos = {

    Pix: sales
      .filter((sale)=>sale.payment==="Pix")
      .reduce((t,s)=>t+s.total,0),

    Dinheiro: sales
      .filter((sale)=>sale.payment==="Dinheiro")
      .reduce((t,s)=>t+s.total,0),

    Debito: sales
      .filter((sale)=>sale.payment==="Débito")
      .reduce((t,s)=>t+s.total,0),

    Credito: sales
      .filter((sale)=>sale.payment==="Crédito")
      .reduce((t,s)=>t+s.total,0)

  }



  const fiadoPendente = sales
    .filter(
      (sale)=>
        sale.payment==="Fiado" &&
        sale.status==="Pendente"
    )
    .reduce(
      (t,s)=>t+s.total,
      0
    )



  const produtos:any = {}


  sales.forEach((sale)=>{

    if(sale.products){

      sale.products.forEach((item:any)=>{

        if(produtos[item.name]){
          produtos[item.name] += item.quantity
        }else{
          produtos[item.name] = item.quantity
        }

      })

    }

  })



  const maisVendido =
    Object.keys(produtos).sort(
      (a,b)=>produtos[b]-produtos[a]
    )[0]



  return (

    <div>


      <h1 className="text-3xl font-bold">
        Relatórios
      </h1>


      <p className="mt-2 text-gray-500">
        Análises da ZERO GRAU
      </p>



      <div className="grid grid-cols-3 gap-6 mt-8">


        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            💰 Faturamento
          </p>

          <h2 className="text-2xl font-bold">
            R$ {faturamento.toFixed(2)}
          </h2>

        </div>



        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            📈 Lucro
          </p>

          <h2 className="text-2xl font-bold text-green-600">
            R$ {lucro.toFixed(2)}
          </h2>

        </div>



        <div className="bg-white p-6 rounded-xl shadow">

          <p className="text-gray-500">
            🛒 Produtos vendidos
          </p>

          <h2 className="text-2xl font-bold">
            {quantidadeVendida}
          </h2>

        </div>


      </div>




      <div className="mt-8 grid grid-cols-2 gap-6">


        <div className="bg-white p-6 rounded-xl shadow">


          <h2 className="font-bold text-lg">
            💳 Formas de pagamento
          </h2>


          <p className="mt-3">
            Pix: R$ {pagamentos.Pix.toFixed(2)}
          </p>


          <p>
            Dinheiro: R$ {pagamentos.Dinheiro.toFixed(2)}
          </p>


          <p>
            Débito: R$ {pagamentos.Debito.toFixed(2)}
          </p>


          <p>
            Crédito: R$ {pagamentos.Credito.toFixed(2)}
          </p>


        </div>




        <div className="bg-white p-6 rounded-xl shadow">


          <h2 className="font-bold text-lg">
            📦 Destaques
          </h2>


          <p className="mt-3">
            Mais vendido:
          </p>


          <p className="font-bold">
            {maisVendido || "Nenhum ainda"}
          </p>



          <p className="mt-4 text-red-600">
            Fiado pendente:
            <br/>
            R$ {fiadoPendente.toFixed(2)}
          </p>


        </div>


      </div>



    </div>

  )

}


export default Relatorios