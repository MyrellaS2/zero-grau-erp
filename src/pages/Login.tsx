
import { useState } from "react"
import { supabase } from "../lib/supabase"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    if (!username || !password) {
      alert("Informe o usuário e a senha.")
      return
    }

    if (username.toLowerCase() !== "zerograu") {
      alert("Usuário ou senha incorretos.")
      return
    }

    setLoading(true)

    const { error } =
      await supabase.auth.signInWithPassword({
        email: "myrellajacinto@gmail.com",
        password,
      })

    setLoading(false)

    if (error) {
      console.error("ERRO AO FAZER LOGIN:", error)
      alert("Usuário ou senha incorretos.")
      return
    }

    window.location.href = "/"
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold text-center">
          ZERO GRAU
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Acesso ao sistema
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-4"
        >
          <input
            type="text"
            placeholder="Usuário"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="border p-3 rounded-lg w-full"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="border p-3 rounded-lg w-full"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-800 text-white py-3 rounded-lg font-bold"
          >
            {loading
              ? "Entrando..."
              : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
