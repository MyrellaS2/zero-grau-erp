
import { useEffect, useState } from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom"

import { supabase } from "./lib/supabase"

import MainLayout from "./layouts/MainLayout"

import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import Produtos from "./pages/Produtos"
import Vendas from "./pages/Vendas"
import Caixa from "./pages/Caixa"
import Relatorios from "./pages/Relatorios"
import Configuracoes from "./pages/Configuracoes"
import Fiados from "./pages/Fiados"

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      setSession(session)
      setLoading(false)
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Carregando...
        </p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      {!session ? (
        <Routes>
          <Route
            path="*"
            element={<Login />}
          />
        </Routes>
      ) : (
        <MainLayout>
          <Routes>
            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/produtos"
              element={<Produtos />}
            />

            <Route
              path="/vendas"
              element={<Vendas />}
            />

            <Route
              path="/fiados"
              element={<Fiados />}
            />

            <Route
              path="/caixa"
              element={<Caixa />}
            />

            <Route
              path="/relatorios"
              element={<Relatorios />}
            />

            <Route
              path="/configuracoes"
              element={<Configuracoes />}
            />

            <Route
              path="*"
              element={
                <Navigate
                  to="/"
                  replace
                />
              }
            />
          </Routes>
        </MainLayout>
      )}
    </BrowserRouter>
  )
}

export default App

