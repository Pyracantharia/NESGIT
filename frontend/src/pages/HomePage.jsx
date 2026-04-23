import AppNavbar from "../components/AppNavbar.jsx";

export default function HomePage() {
  return (
    <>
      <AppNavbar />
      <main className="container">
        <div className="card shadow-sm border-0">
          <div className="card-body p-4">
            <h1 className="h4 mb-3">Chat dashboard</h1>
            <p className="text-muted mb-0">
              Welcome back. Select a room to start chatting.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
