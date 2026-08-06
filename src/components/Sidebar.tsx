import {
  Home,
  Package,
  ShoppingCart,
  Wallet,
  BarChart3,
  Settings,
  FileText
} from "lucide-react"
import { Link } from "react-router-dom"

function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 w-64 h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold text-blue-500 mb-8">
        ZERO GRAU
      </h1>

      <nav className="space-y-4">

        <Link to="/" className="flex items-center gap-3">
  <Home size={20}/>
  Dashboard
</Link>

        <Link to="/produtos" className="flex items-center gap-3">
  <Package size={20}/>
  Produtos
</Link>

        <Link to="/vendas" className="flex items-center gap-3">
  <ShoppingCart size={20}/>
  Vendas
</Link>
<Link to="/fiados" className="flex items-center gap-3">
  <FileText size={20}/>
  Fiados
</Link>

        <Link to="/caixa" className="flex items-center gap-3">
  <Wallet size={20}/>
  Caixa
</Link>

        <Link to="/relatorios" className="flex items-center gap-3">
  <BarChart3 size={20}/>
  Relatórios
</Link>

        <Link to="/configuracoes" className="flex items-center gap-3">
  <Settings size={20}/>
  Configurações
</Link>

      </nav>
    </aside>
  )
}

export default Sidebar