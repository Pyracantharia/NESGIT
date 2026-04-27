import { useEffect, useState } from "react";
import AppNavbar from "../components/AppNavbar.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProfilePage() {
  const { userProfile, updateProfile } = useAuth();
  const [username, setUsername] = useState("");
  const [color, setColor] = useState("#64748b");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userProfile) return;
    setUsername(userProfile.username || "");
    setColor(userProfile.color || "#64748b");
  }, [userProfile]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateProfile({ username, color });
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AppNavbar />
      <main className="container pb-4">
        <div className="row justify-content-center">
          <div className="col-12 col-md-8 col-lg-6">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h1 className="h5 mb-3">Profile settings</h1>
                {error ? <div className="alert alert-danger py-2">{error}</div> : null}
                {success ? <div className="alert alert-success py-2">{success}</div> : null}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      className="form-control"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Color</label>
                    <input
                      type="color"
                      className="form-control form-control-color"
                      value={color}
                      onChange={(event) => setColor(event.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
