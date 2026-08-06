import { BrowserRouter, Routes, Route } from "react-router-dom"

import MainLayout from "./layouts/MainLayout"

import Dashboard from "./pages/Dashboard"
import Produtos from "./pages/Produtos"
import Vendas from "./pages/Vendas"
import Caixa from "./pages/Caixa"
import Relatorios from "./pages/Relatorios"
import Configuracoes from "./pages/Configuracoes"
import Fiados from "./pages/Fiados"


function App() {
  return (
    <BrowserRouter>

      <MainLayout>

        <Routes>

          <Route path="/" element={<Dashboard />} />

          <Route path="/produtos" element={<Produtos />} />
          <Route path="/vendas" element={<Vendas />} />

<Route path="/fiados" element={<Fiados />} />

<Route path="/caixa" element={<Caixa />} />

<Route path="/relatorios" element={<Relatorios />} />

<Route path="/configuracoes" element={<Configuracoes />} />

        </Routes>

      </MainLayout>

    </BrowserRouter>
  )
}

export default App