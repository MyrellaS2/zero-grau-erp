function Produtos() {
  return (
    <div>

      <h1 className="text-3xl font-bold">
        Produtos
      </h1>

      <p className="mt-2 text-gray-500">
        Controle dos produtos da ZERO GRAU
      </p>


      <div className="mt-8">
        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">
          + Novo produto
        </button>
      </div>


      <div className="mt-8 bg-white rounded-xl shadow p-6">

        <h2 className="font-bold text-lg">
          Lista de produtos
        </h2>

        <p className="mt-4 text-gray-500">
          Nenhum produto cadastrado.
        </p>

      </div>

    </div>
  )
}

export default Produtos