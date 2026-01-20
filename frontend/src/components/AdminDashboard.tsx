import React, { useEffect, useState } from 'react';
import { getWithAuth } from '../api';
import { AdminStatsResponse, FailedPayment, AdminTenant } from '../types';

interface AdminDashboardProps {
  token: string;
}

export function AdminDashboard({ token }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [failures, setFailures] = useState<FailedPayment[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const [statsRes, failuresRes, tenantsRes] = await Promise.all([
          getWithAuth<AdminStatsResponse>('/admin/stats', token),
          getWithAuth<FailedPayment[]>('/admin/failures', token),
          getWithAuth<AdminTenant[]>('/admin/tenants', token)
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (failuresRes.data) setFailures(failuresRes.data);
        if (tenantsRes.data) setTenants(tenantsRes.data);
      } catch (error) {
        console.error("Failed to load admin data", error);
      } finally {
        setLoading(false);
      }
    }

    loadAdminData();
  }, [token]);

  if (loading) {
    return <div className="spinner-container"><div className="spinner"></div></div>;
  }

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <h1 className="text-2xl font-bold mb-6">Panel de Super Admin</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <h3 className="text-muted text-sm uppercase">MRR Global</h3>
          <p className="text-3xl font-bold mt-2">
            {stats ? (stats.mrrCents / 100).toLocaleString('es-ES', { style: 'currency', currency: stats.currency }) : '-'}
          </p>
        </div>
        <div className="card">
          <h3 className="text-muted text-sm uppercase">Suscripciones Activas</h3>
          <p className="text-3xl font-bold mt-2">{stats?.activeSubscriptions || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-muted text-sm uppercase">Total Clientes</h3>
          <p className="text-3xl font-bold mt-2">{stats?.totalTenants || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-muted text-sm uppercase text-red-500">Pagos Fallidos (30d)</h3>
          <p className="text-3xl font-bold mt-2 text-red-500">{stats?.failedPaymentsCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Failed Payments */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Últimos Pagos Fallidos</h2>
          {failures.length === 0 ? (
            <p className="text-muted">No hay pagos fallidos recientes.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted border-b border-border">
                    <th className="pb-2">Cliente</th>
                    <th className="pb-2">Monto</th>
                    <th className="pb-2">Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {failures.map(f => (
                    <tr key={f.id} className="border-b border-border last:border-0">
                      <td className="py-3">
                        <div className="font-medium">{f.tenantName}</div>
                        <div className="text-xs text-muted">{f.billingEmail}</div>
                      </td>
                      <td className="py-3 font-mono">
                        {(f.amountCents / 100).toLocaleString('es-ES', { style: 'currency', currency: f.currency })}
                      </td>
                      <td className="py-3 text-sm text-muted">
                        {new Date(f.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tenants List */}
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Clientes Recientes</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted border-b border-border">
                  <th className="pb-2">Nombre</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2">Subs Activas</th>
                  <th className="pb-2">Unido</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(t => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="py-3">
                      <div className="font-medium">{t.name}</div>
                      <div className="text-xs text-muted">{t.email}</div>
                    </td>
                    <td className="py-3">
                      <span className={`status-badge ${t.status === 'active' ? 'status-active' : 'status-inactive'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 text-center">{t.activeSubs}</td>
                    <td className="py-3 text-sm text-muted">
                      {new Date(t.joinedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
