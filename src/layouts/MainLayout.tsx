import Sidebar from "../components/Sidebar"

function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />

      <main>
        {children}
      </main>
    </div>
  )
}

export default MainLayout