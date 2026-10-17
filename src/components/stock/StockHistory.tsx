import { useState } from "react"
import type { StockMovement } from "../../types/product"

interface StockHistoryProps {
  movements: StockMovement[]
}

function StockHistory({
  movements,
}: StockHistoryProps) {
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  function formatDate(dateValue: string) {
    if (!dateValue) {
      return "-"
    }

    const date = new Date(dateValue)

    if (isNaN(date.getTime())) {
      return "-"
    }

    return new Intl.DateTimeFormat(
      "pt-BR",
      {
        timeZone: "America/Sao_Paulo",
        dateStyle: "short",
        timeStyle: "medium"
      }
    ).format(date)
  }

  function getLocalDateKey(dateValue: string) {
    const date = new Date(dateValue)
    if (isNaN(date.getTime())) return ""

    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date)
    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value])
    )

    return `${values.year}-${values.month}-${values.day}`
  }

  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR")
  const filteredMovements = movements
    .filter((item) => {
      const searchableText = [
        item.productName,
        item.type,
        item.observation || "",
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
      const dateKey = getLocalDateKey(item.date)

      return (
        (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
        (!dateFrom || dateKey >= dateFrom) &&
        (!dateTo || dateKey <= dateTo)
      )
    })
    .sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    )

  function clearFilters() {
    setSearch("")
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="bg-white rounded-xl shadow p-6 mt-8">

      <h2 className="text-xl font-bold mb-4">
        Histórico de estoque
      </h2>

      <div className="grid min-w-0 grid-cols-1 gap-3 mb-5 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_auto] xl:items-end">
        <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
          Pesquisar
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Produto, operação ou motivo..." aria-label="Pesquisar movimentações de estoque" className="w-full min-w-0 border rounded-lg px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
          Data inicial
          <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => setDateFrom(event.target.value)} className="w-full min-w-0 border rounded-lg px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-sm text-gray-600">
          Data final
          <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => setDateTo(event.target.value)} className="w-full min-w-0 border rounded-lg px-3 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600" />
        </label>
        <button type="button" onClick={clearFilters} className="w-full whitespace-nowrap rounded-lg border px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-600 xl:w-auto">
          Limpar filtros
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Exibindo {filteredMovements.length} de {movements.length} movimentações
      </p>

      {filteredMovements.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
          {movements.length === 0
            ? "Nenhuma movimentação registrada."
            : "Nenhuma movimentação corresponde aos filtros."}
        </p>
      ) : (
        <div className="max-w-full overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[900px] table-fixed border-collapse text-left text-sm">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[22%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
              <col className="w-[30%]" />
            </colgroup>
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="border-b border-gray-200 px-4 py-3 font-semibold">Data e hora</th>
                <th className="border-b border-gray-200 px-4 py-3 font-semibold">Produto</th>
                <th className="border-b border-gray-200 px-4 py-3 font-semibold">Operação</th>
                <th className="border-b border-gray-200 px-4 py-3 text-right font-semibold">Quantidade</th>
                <th className="border-b border-gray-200 px-4 py-3 font-semibold">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredMovements.map((item) => (
                <tr key={item.id} className="align-top hover:bg-gray-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-600">{formatDate(item.date)}</td>
                  <td className="break-words px-4 py-3 font-medium text-gray-900">{item.productName}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.type === "Entrada" ? "bg-green-100 text-green-800" : item.type === "Ajuste" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${item.type === "Entrada" ? "text-green-700" : item.type === "Ajuste" ? "text-amber-700" : "text-red-600"}`}>
                    {item.type === "Entrada" ? "+" : item.type === "Ajuste" ? "" : "−"}{item.quantity}
                  </td>
                  <td className="whitespace-normal break-words px-4 py-3 text-gray-600">
                    {item.observation || <span className="text-gray-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}

export default StockHistory
