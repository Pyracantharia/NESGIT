import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function AppNavbar() {
  const { userClaims, userProfile, logout } = useAuth();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
      <div className="container">
        <div className="d-flex align-items-center gap-3">
          <Link className="navbar-brand" to="/">
            NES Chat
          </Link>
          <Link className="nav-link text-light p-0 small" to="/">
            Chat
          </Link>
          <Link className="nav-link text-light p-0 small" to="/profile">
            Profile
          </Link>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span
            className="rounded-circle d-inline-block"
            style={{
              width: 10,
              height: 10,
              backgroundColor: userProfile?.color || "#64748b",
            }}
          />
          <span className="badge text-bg-secondary">
            {userProfile?.username || userClaims?.email || "User"}
          </span>
          <button type="button" className="btn btn-outline-light btn-sm" onClick={logout}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
