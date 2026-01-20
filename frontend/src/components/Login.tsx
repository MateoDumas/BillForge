import { useState } from "react";

interface LoginProps {
  onLogin: (token: string) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Force localhost API - HARDCODED
  const hostname = window.location.hostname;
  const isLocal = true; // Force true
  const API_URL = "http://localhost:3000";

  console.log("Environment detection (FORCED):", { hostname, isLocal, API_URL });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log("Attempting login to:", `${API_URL}/api/auth/login`);
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Check content type before parsing JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Received non-JSON response:", text);
        // Display debug info to user
        throw new Error(`Error de conexión. URL: ${API_URL}. Respuesta: ${text.substring(0, 50)}...`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      onLogin(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="text-center mb-6">
            <img src="/BillForgelogo.png" alt="BillForge" className="w-24 mx-auto mb-4" style={{ height: '60px', width: 'auto' }} />
            <h1 className="text-2xl font-bold">Bienvenido a BillForge</h1>
            <p className="text-muted">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="text-sm font-medium mb-1 block">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@billforge.com"
              required
            />
          </div>
          
          <div className="input-group">
            <label className="text-sm font-medium mb-1 block">Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              required
            />
          </div>

          {error && <div className="text-error text-sm text-center">{error}</div>}

          <button type="submit" className="btn btn-primary w-full" disabled={isLoading}>
            {isLoading ? "Iniciando..." : "Iniciar Sesión"}
          </button>
        </form>
        
        <div className="mt-4 text-center text-xs text-muted">
           <p>Credenciales:</p>
           <p>admin@billforge.com / admin123</p>
        </div>
      </div>
    </div>
  );
}
