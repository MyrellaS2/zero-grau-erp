import Sidebar from "../components/Sidebar"

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell flex">
      <Sidebar />

      <main className="app-main flex-1 p-8 ml-64">
        {children}
      </main>
    </div>
  )
}

export default MainLayout
