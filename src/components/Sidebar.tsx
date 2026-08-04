import {
  Home,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings
} from "lucide-react"

function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold text-blue-500 mb-8">
        ZERO GRAU
      </h1>

      <nav className="space-y-4">

        <a className="flex items-center gap-3">
          <Home size={20}/>
          Dashboard
        </a>

        <a className="flex items-center gap-3">
          <Package size={20}/>
          Produtos
        </a>

        <a className="flex items-center gap-3">
          <ShoppingCart size={20}/>
          Vendas
        </a>

        <a className="flex items-center gap-3">
          <Wallet size={20}/>
          Caixa
        </a>

        <a className="flex items-center gap-3">
          <BarChart3 size={20}/>
          Relatórios
        </a>

        <a className="flex items-center gap-3">
          <Settings size={20}/>
          Configurações
        </a>

      </nav>
    </aside>
  )
}

export default Sidebar