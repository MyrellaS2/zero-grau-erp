import { useEffect, useState } from "react"

function Caixa() {

  const [sales, setSales] = useState<any[]>([])

  useEffect(() => {

    const saved = localStorage.getItem("sales")

    if (saved) {
      setSales(JSON.parse(saved))
    }

  }, [])
  const dinheiro = sales
  .filter((sale) => sale.payment === "Dinheiro")
  .reduce((total, sale) => total + sale.total, 0)

const pix = sales
  .filter((sale) => sale.payment === "Pix")
  .reduce((total, sale) => total + sale.total, 0)

const debito = sales
  .filter((sale) => sale.payment === "Débito")
  .reduce((total, sale) => total + sale.total, 0)

const credito = sales
  .filter((sale) => sale.payment === "Crédito")
  .reduce((total, sale) => total + sale.total, 0)

const fiado = sales
  .filter((sale) => sale.payment === "Fiado")
  .reduce((total, sale) => total + sale.total, 0)

const totalRecebido = dinheiro + pix + debito + credito

  return (
    <div>

      <h1 className="text-3xl font-bold">
        Caixa
      </h1>

      <p className="mt-2 text-gray-500">
        Controle financeiro da ZERO GRAU
      </p>
      <div className="grid grid-cols-3 gap-6 mt-8">

  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-gray-500">💵 Dinheiro</h2>
    <p className="text-2xl font-bold mt-2">
      R$ {dinheiro.toFixed(2)}
    </p>
  </div>

  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-gray-500">📱 Pix</h2>
    <p className="text-2xl font-bold mt-2">
      R$ {pix.toFixed(2)}
    </p>
  </div>

  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-gray-500">💳 Débito</h2>
    <p className="text-2xl font-bold mt-2">
      R$ {debito.toFixed(2)}
    </p>
  </div>

  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-gray-500">💳 Crédito</h2>
    <p className="text-2xl font-bold mt-2">
      R$ {credito.toFixed(2)}
    </p>
  </div>

  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-gray-500">📝 Fiado</h2>
    <p className="text-2xl font-bold mt-2">
      R$ {fiado.toFixed(2)}
    </p>
  </div>

  <div className="bg-white p-6 rounded-xl shadow">
    <h2 className="text-gray-500">💰 Total Recebido</h2>
    <p className="text-2xl font-bold mt-2">
      R$ {totalRecebido.toFixed(2)}
    </p>
  </div>

</div>

    </div>
  )
}

export default Caixa