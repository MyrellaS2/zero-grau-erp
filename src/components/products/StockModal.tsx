import { useState } from "react"
import type { Product } from "../../types/product"
import Card from "../ui/Card"
import Button from "../ui/Button"
import Input from "../ui/Input"

export type StockAction =
  | "Entrada"
  | "Saída"
  | "Abrir recipiente"
  | "Retirar ml"

interface StockModalProps {
  product: Product
  onClose: () => void
  onSave: (
    id: number,
    quantity: number,
    type: StockAction,
    observation?: string
  ) => Promise<void>
}

function StockModal({ product, onClose, onSave }: StockModalProps) {
  const [type, setType] = useState<StockAction>("Entrada")
  const [quantity, setQuantity] = useState("")
  const [observation, setObservation] = useState("")
  const [saving, setSaving] = useState(false)

  const volumeText = String(product.volume || "")
  const match = volumeText.match(/([\d.,]+)\s*(ml|l)\b/i)

  const capacityMl = match
    ? Number(match[1].replace(",", ".")) *
      (match[2].toLowerCase() === "l" ? 1000 : 1)
    : 0

  const openMl = Number(product.open_container_ml || 0)
  const closedUnits = Number(product.stock || 0)
  const observationPlaceholder =
    type === "Entrada"
      ? "Ex.: reposição de fornecedor, conferência de estoque..."
      : type === "Saída"
        ? "Ex.: avaria, vencimento, uso interno..."
        : type === "Abrir recipiente"
          ? "Ex.: início do atendimento, reposição do recipiente..."
          : "Ex.: consumo interno, sem gás, perda..."

  async function handleSave() {
    const value = Number(quantity)

    if (type === "Abrir recipiente") {
      if (closedUnits < 1) {
        alert("Não há unidades fechadas para abrir.")
        return
      }

      if (openMl > 0) {
        alert("Já existe um recipiente aberto deste produto.")
        return
      }

      if (capacityMl <= 0) {
        alert("Confira o volume cadastrado, por exemplo 350ml ou 2L.")
        return
      }
    } else if (value <= 0) {
      alert("Digite uma quantidade válida.")
      return
    }

    if (type === "Retirar ml" && value > openMl) {
      alert(`Só restam ${openMl} ml no recipiente aberto.`)
      return
    }

    if (type === "Saída" && value > closedUnits) {
      alert("Estoque insuficiente.")
      return
    }

    if (type === "Retirar ml" && !observation.trim()) {
      alert("Informe o motivo da retirada.")
      return
    }

    setSaving(true)

    try {
      await onSave(
        product.id,
        type === "Abrir recipiente" ? capacityMl : value,
        type,
        observation.trim()
      )
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-xl font-bold">Controle de estoque</h2>

        <p className="text-gray-500 mt-2">{product.name}</p>

        <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
          <p>Unidades fechadas: <strong>{closedUnits}</strong></p>
          <p>Recipiente aberto: <strong>{openMl} ml</strong></p>
        </div>

        <label className="block text-sm font-medium mt-5 mb-1">
          Operação
        </label>

        <select
          className="border rounded-lg p-2 w-full"
          value={type}
          onChange={(e) => {
            setType(e.target.value as StockAction)
            setQuantity("")
            setObservation("")
          }}
        >
          <option value="Entrada">Entrada de unidades</option>
          <option value="Saída">Saída de unidades</option>
          <option value="Abrir recipiente">Abrir recipiente</option>
          <option value="Retirar ml">Retirar ml</option>
        </select>

        {type === "Abrir recipiente" ? (
          <p className="text-sm text-gray-600 mt-4">
            {capacityMl > 0
              ? `Será aberta uma unidade de ${capacityMl} ml.`
              : "Confira o volume cadastrado no produto."}
          </p>
        ) : (
          <Input
            className="mt-4"
            type="number"
            placeholder={
              type === "Retirar ml"
                ? "Quantidade em ml"
                : "Quantidade de unidades"
            }
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        )}

        <label className="block text-sm font-medium mt-4 mb-1">
          Motivo / observação
        </label>
        <textarea
          className="border rounded-lg p-2 w-full"
          placeholder={observationPlaceholder}
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          rows={3}
        />

        <div className="flex gap-3 mt-5">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>

          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default StockModal
