import { useEffect, useState } from "react";
import { getWithAuth, postWithAuth } from "../api";
import { UserProfileResponse } from "../types";
import { useToast } from "../context/ToastContext";
import { Copy, RefreshCw, User, Building, CreditCard, Key } from "lucide-react";

interface UserProfileProps {
  token: string;
}

export function UserProfile({ token }: UserProfileProps) {
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [keyLoading, setKeyLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [token]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getWithAuth<UserProfileResponse>("/profile/me", token);
      if (res.error) {
        showToast(res.error, "error");
      } else if (res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      showToast("Error cargando perfil", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!confirm("¿Estás seguro? Esto invalidará la clave anterior inmediatamente.")) return;

    try {
      setKeyLoading(true);
      const res = await postWithAuth<{ apiKey: string }>("/profile/api-key", {}, token);
      if (res.error) {
        showToast(res.error, "error");
      } else if (res.data && profile) {
        setProfile({
          ...profile,
          tenant: {
            ...profile.tenant,
            apiKey: res.data.apiKey
          }
        });
        showToast("Nueva API Key generada", "success");
      }
    } catch (err) {
      showToast("Error generando API Key", "error");
    } finally {
      setKeyLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copiado al portapapeles", "success");
  };

  if (loading) {
    return <div className="p-8 text-center text-muted">Cargando perfil...</div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-error">No se pudo cargar el perfil.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-muted">Gestiona tu cuenta y configuración de organización</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 text-primary">
            <User size={20} />
            <h2 className="text-xl font-bold">Usuario</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase text-muted font-semibold">Email</label>
              <p className="font-mono text-lg">{profile.user.email}</p>
            </div>
            <div>
              <label className="text-xs uppercase text-muted font-semibold">Rol</label>
              <div className="badge badge-outline mt-1 capitalize">{profile.user.role}</div>
            </div>
            <div>
              <label className="text-xs uppercase text-muted font-semibold">Miembro desde</label>
              <p className="text-sm">{new Date(profile.user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Tenant Info */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4 text-secondary">
            <Building size={20} />
            <h2 className="text-xl font-bold">Organización</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase text-muted font-semibold">Nombre</label>
              <p className="text-lg font-medium">{profile.tenant.name}</p>
            </div>
            <div>
              <label className="text-xs uppercase text-muted font-semibold">Tenant ID</label>
              <div className="flex items-center gap-2 bg-base-200 p-2 rounded mt-1">
                <code className="text-xs flex-1 truncate">{profile.tenant.id}</code>
                <button onClick={() => copyToClipboard(profile.tenant.id)} className="btn btn-ghost btn-xs btn-square">
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Summary */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4 text-accent">
          <CreditCard size={20} />
          <h2 className="text-xl font-bold">Suscripción Actual</h2>
        </div>
        {profile.subscription ? (
          <div className="flex justify-between items-center bg-base-200 p-4 rounded-lg">
            <div>
              <p className="text-lg font-bold">{profile.subscription.planName}</p>
              <div className={`badge ${profile.subscription.status === 'active' ? 'badge-success' : 'badge-warning'} gap-2 mt-1`}>
                {profile.subscription.status}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Renueva el</p>
              <p className="font-mono">{new Date(profile.subscription.currentPeriodEnd).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 bg-base-200 rounded-lg text-muted">
            No hay suscripción activa.
          </div>
        )}
      </div>

      {/* API Keys Section - Critical for SaaS Infra */}
      <div className="card border-l-4 border-primary">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-primary">
            <Key size={20} />
            <div>
              <h2 className="text-xl font-bold">API Keys</h2>
              <p className="text-xs text-muted">Usa esta llave para integrar BillForge en tu backend.</p>
            </div>
          </div>
          <button 
            onClick={generateApiKey} 
            disabled={keyLoading}
            className="btn btn-sm btn-outline gap-2"
          >
            <RefreshCw size={14} className={keyLoading ? "animate-spin" : ""} />
            Rotar Llave
          </button>
        </div>

        <div className="bg-base-300 p-4 rounded-lg relative group">
          <label className="text-xs uppercase text-muted font-semibold mb-2 block">Secret Key</label>
          <div className="flex items-center gap-2">
            <code className="flex-1 font-mono text-sm break-all">
              {profile.tenant.apiKey || "No generada aún"}
            </code>
            {profile.tenant.apiKey && (
              <button onClick={() => copyToClipboard(profile.tenant.apiKey!)} className="btn btn-ghost btn-sm btn-square">
                <Copy size={16} />
              </button>
            )}
          </div>
          <p className="text-xs text-warning mt-2 flex items-center gap-1">
            ⚠️ No compartas esta llave. Da acceso total a tu facturación.
          </p>
        </div>
      </div>
    </div>
  );
}
