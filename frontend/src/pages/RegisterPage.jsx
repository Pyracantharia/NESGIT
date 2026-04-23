import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { registerUser } = useAuth();
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    color: "#0d6efd",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await registerUser(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-12 col-md-7 col-lg-5">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <h1 className="h4 mb-3">Register</h1>
                {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      className="form-control"
                      value={form.username}
                      onChange={(event) => updateField("username", event.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Color</label>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={form.color}
                      onChange={(event) => updateField("color", event.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary w-100" type="submit" disabled={submitting}>
                    {submitting ? "Creating account..." : "Register"}
                  </button>
                </form>
                <p className="text-muted mt-3 mb-0">
                  Already registered? <Link to="/login">Login</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
