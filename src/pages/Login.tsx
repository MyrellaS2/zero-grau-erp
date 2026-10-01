import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [loading, setLoading] = useState(false)
  const [resetMode, setResetMode] = useState(false)

  useEffect(() => {
    const hash = window.location.hash

    if (
      hash.includes("access_token") &&
      hash.includes("type=recovery")
    ) {
      setResetMode(true)
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setResetMode(true)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

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

  async function handleResetPassword(
    e: React.FormEvent
  ) {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      alert("Preencha os dois campos.")
      return
    }

    if (newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      alert("As senhas não são iguais.")
      return
    }

    setLoading(true)

    const { error } =
      await supabase.auth.updateUser({
        password: newPassword,
      })

    setLoading(false)

    if (error) {
      console.error(
        "ERRO AO ALTERAR SENHA:",
        error
      )

      alert(
        "Não foi possível alterar a senha. O link pode ter expirado."
      )

      return
    }

    await supabase.auth.signOut()

    setNewPassword("")
    setConfirmPassword("")
    setResetMode(false)

    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    )

    alert("Senha alterada com sucesso!")

    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        <h1 className="text-3xl font-bold text-center">
          ZERO GRAU
        </h1>

        <p className="text-center text-gray-500 mt-2">
          {resetMode
            ? "Defina sua nova senha"
            : "Acesso ao sistema"}
        </p>

        {resetMode ? (
          <form
            onSubmit={handleResetPassword}
            className="mt-8 space-y-4"
          >
            <input
              type="password"
              placeholder="Nova senha"
              value={newPassword}
              onChange={(e) =>
                setNewPassword(e.target.value)
              }
              className="border p-3 rounded-lg w-full"
            />

            <input
              type="password"
              placeholder="Confirmar nova senha"
              value={confirmPassword}
              onChange={(e) =>
                setConfirmPassword(e.target.value)
              }
              className="border p-3 rounded-lg w-full"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-800 text-white py-3 rounded-lg font-bold"
            >
              {loading
                ? "Alterando..."
                : "Alterar senha"}
            </button>
          </form>
        ) : (
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
        )}

      </div>
    </div>
  )
}

export default Login