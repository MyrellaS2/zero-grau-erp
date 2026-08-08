import { useRef } from "react"
import { supabase } from "../../lib/supabase"

function Backup() {
  const fileRef = useRef<HTMLInputElement | null>(null)

  async function exportBackup() {
    try {
      const [
        categoriesResult,
        brandsResult,
        flavorsResult,
        productsResult,
        salesResult,
        stockMovementsResult,
      ] = await Promise.all([
        supabase.from("categories").select("*"),
        supabase.from("brands").select("*"),
        supabase.from("flavors").select("*"),
        supabase.from("products").select("*"),
        supabase.from("sales").select("*"),
        supabase
          .from("stock_movements")
          .select("*"),
      ])

      if (categoriesResult.error)
        throw categoriesResult.error

      if (brandsResult.error)
        throw brandsResult.error

      if (flavorsResult.error)
        throw flavorsResult.error

      if (productsResult.error)
        throw productsResult.error

      if (salesResult.error)
        throw salesResult.error

      if (stockMovementsResult.error)
        throw stockMovementsResult.error

      const backup = {
        version: 1,
        created_at: new Date().toISOString(),

        categories:
          categoriesResult.data || [],

        brands:
          brandsResult.data || [],

        flavors:
          flavorsResult.data || [],

        products:
          productsResult.data || [],

        sales:
          salesResult.data || [],

        stock_movements:
          stockMovementsResult.data || [],
      }

      const json = JSON.stringify(
        backup,
        null,
        2
      )

      const blob = new Blob(
        [json],
        {
          type: "application/json",
        }
      )

      const url =
        URL.createObjectURL(blob)

      const link =
        document.createElement("a")

      link.href = url

      link.download =
        `backup-zero-grau-${new Date()
          .toISOString()
          .slice(0, 10)}.json`

      document.body.appendChild(link)

      link.click()

      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      alert(
        "Backup realizado com sucesso!"
      )
    } catch (error) {
      console.error(
        "ERRO AO EXPORTAR BACKUP:",
        error
      )

      alert(
        "Não foi possível realizar o backup."
      )
    }
  }

  async function importBackup(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const text =
        await file.text()

      const backup =
        JSON.parse(text)

      if (
        !backup ||
        backup.version !== 1 ||
        !Array.isArray(
          backup.categories
        ) ||
        !Array.isArray(
          backup.brands
        ) ||
        !Array.isArray(
          backup.flavors
        ) ||
        !Array.isArray(
          backup.products
        ) ||
        !Array.isArray(
          backup.sales
        ) ||
        !Array.isArray(
          backup.stock_movements
        )
      ) {
        alert(
          "Esse arquivo não é um backup válido do Zero Grau."
        )

        return
      }

      const confirmRestore =
        window.confirm(
          "ATENÇÃO!\n\n" +
          "A restauração irá substituir os dados atuais do sistema pelos dados deste backup.\n\n" +
          "Essa ação não poderá ser desfeita.\n\n" +
          "Deseja continuar?"
        )

      if (!confirmRestore) {
        return
      }

      /*
       * A ordem é importante:
       *
       * 1. stock_movements
       * 2. sales
       * 3. products
       * 4. flavors
       * 5. brands
       * 6. categories
       *
       * Primeiro removemos os registros
       * que dependem dos outros.
       */

      const deleteStockMovements =
        await supabase
          .from("stock_movements")
          .delete()
          .neq("id", 0)

      if (deleteStockMovements.error) {
        throw deleteStockMovements.error
      }

      const deleteSales =
        await supabase
          .from("sales")
          .delete()
          .neq("id", 0)

      if (deleteSales.error) {
        throw deleteSales.error
      }

      const deleteProducts =
        await supabase
          .from("products")
          .delete()
          .neq("id", 0)

      if (deleteProducts.error) {
        throw deleteProducts.error
      }

      const deleteFlavors =
        await supabase
          .from("flavors")
          .delete()
          .neq("id", 0)

      if (deleteFlavors.error) {
        throw deleteFlavors.error
      }

      const deleteBrands =
        await supabase
          .from("brands")
          .delete()
          .neq("id", 0)

      if (deleteBrands.error) {
        throw deleteBrands.error
      }

      const deleteCategories =
        await supabase
          .from("categories")
          .delete()
          .neq("id", 0)

      if (deleteCategories.error) {
        throw deleteCategories.error
      }

      /*
       * Agora restauramos na ordem inversa.
       */

      if (backup.categories.length > 0) {
        const result =
          await supabase
            .from("categories")
            .insert(
              backup.categories
            )

        if (result.error) {
          throw result.error
        }
      }

      if (backup.brands.length > 0) {
        const result =
          await supabase
            .from("brands")
            .insert(
              backup.brands
            )

        if (result.error) {
          throw result.error
        }
      }

      if (backup.flavors.length > 0) {
        const result =
          await supabase
            .from("flavors")
            .insert(
              backup.flavors
            )

        if (result.error) {
          throw result.error
        }
      }

      if (backup.products.length > 0) {
        const result =
          await supabase
            .from("products")
            .insert(
              backup.products
            )

        if (result.error) {
          throw result.error
        }
      }

      if (backup.sales.length > 0) {
        const result =
          await supabase
            .from("sales")
            .insert(
              backup.sales
            )

        if (result.error) {
          throw result.error
        }
      }

      if (
        backup.stock_movements.length >
        0
      ) {
        const result =
          await supabase
            .from("stock_movements")
            .insert(
              backup.stock_movements
            )

        if (result.error) {
          throw result.error
        }
      }

      alert(
        "Backup restaurado com sucesso!\n\nRecarregue a página para atualizar os dados."
      )

      event.target.value = ""
    } catch (error) {
      console.error(
        "ERRO AO RESTAURAR BACKUP:",
        error
      )

      alert(
        "Não foi possível restaurar o backup.\n\nVerifique o console para mais detalhes."
      )

      event.target.value = ""
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="font-bold text-lg">
        💾 Backup e restauração
      </h2>

      <p className="text-gray-500 text-sm mt-2">
        Faça uma cópia de segurança dos
        dados do sistema.
      </p>

      <div className="flex gap-3 mt-4">
        <button
          onClick={exportBackup}
          className="bg-blue-800 text-white px-5 py-2 rounded-lg"
        >
          💾 Exportar backup
        </button>

        <button
          onClick={() =>
            fileRef.current?.click()
          }
          className="bg-green-700 text-white px-5 py-2 rounded-lg"
        >
          ♻️ Restaurar backup
        </button>

        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={importBackup}
        />
      </div>
    </div>
  )
}

export default Backup