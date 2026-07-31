import './App.css'
import PublicationNetworkGraph from './PublicationNetworkGraph'

function App() {
  return (
    <main className="app-shell">
      <section className="page-title">
        <h1>Scientific Publication Network</h1>
        <p>Khám phá mối liên kết giữa các bài báo với biểu đồ dạng force-directed.</p>
      </section>

      <PublicationNetworkGraph publicationId={1} threshold={0.3} />
    </main>
  )
}

export default App
