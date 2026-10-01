import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function ResetPassword() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()

    if (!password || !confirmPassword) {
      alert("Preencha os dois campos.")
      return
    }

    if (password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    if (password !== confirmPassword) {
      alert("As senhas não são iguais.")
      return
    }

    setLoading(true)

    const { error } =
      await supabase.auth.updateUser({
        password,
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

    alert("Senha alterada com sucesso!")

    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">

        <h1 className="text-3xl font-bold text-center">
          ZERO GRAU
        </h1>

        <p className="text-center text-gray-500 mt-2">
          Defina sua nova senha
        </p>

        <form
          onSubmit={handleReset}
          className="mt-8 space-y-4"
        >
          <input
            type="password"
            placeholder="Nova senha"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
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

      </div>
    </div>
  )
}

export default ResetPassword