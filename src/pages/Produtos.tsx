import { products } from "../data/products"

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


        <div className="mt-4 space-y-3">

          {products.map((product) => (
            <div 
              key={product.id}
              className="border rounded-lg p-4"
            >

              <h3 className="font-bold">
                {product.name}
              </h3>

              <p>
                Categoria: {product.category}
              </p>

              <p>
                Estoque: {product.stock}
              </p>

              <p>
                Venda: R$ {product.salePrice.toFixed(2)}
              </p>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}

export default Produtos