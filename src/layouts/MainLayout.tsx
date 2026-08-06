import Sidebar from "../components/Sidebar"

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 p-8 ml-64">
        {children}
      </main>
    </div>
  )
}

export default MainLayout