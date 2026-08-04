function Dashboard() {
  return (
    <div>

      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <p className="mt-2 text-gray-500">
        Sistema de gestão da ZERO GRAU
      </p>


      <div className="grid grid-cols-2 gap-6 mt-8">

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            💰 Vendas hoje
          </h2>
          <p className="text-3xl font-bold mt-2">
            R$ 0,00
          </p>
        </div>


        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            📦 Produtos
          </h2>
          <p className="text-3xl font-bold mt-2">
            0
          </p>
        </div>


        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            📈 Faturamento
          </h2>
          <p className="text-3xl font-bold mt-2">
            R$ 0,00
          </p>
        </div>


        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-gray-500">
            ⚠ Estoque baixo
          </h2>
          <p className="text-3xl font-bold mt-2">
            0
          </p>
        </div>

      </div>

    </div>
  )
}

export default Dashboard