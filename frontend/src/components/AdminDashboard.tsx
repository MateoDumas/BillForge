import React, { useEffect, useState } from 'react';
import { getWithAuth, postWithAuth } from '../api';
import { AdminStatsResponse, FailedPayment, AdminTenant, AuditLog } from '../types';

interface AdminDashboardProps {
  token: string;
}

export function AdminDashboard({ token }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [failures, setFailures] = useState<FailedPayment[]>([]);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const triggerJob = async (jobName: string) => {
    if (!confirm(`¿Estás seguro de ejecutar el job: ${jobName}?`)) return;
    try {
      const res = await postWithAuth(`/admin/jobs/${jobName}`, {}, token);
      if (res.error) {
        alert(`Error: ${res.error}`);
      } else {
        alert(`${jobName} iniciado correctamente.`);
      }
    } catch (error) {
      console.error(error);
      alert('Error de red');
    }
  };

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);
      try {
        const [statsRes, failuresRes, tenantsRes, logsRes] = await Promise.all([
          getWithAuth<AdminStatsResponse>('/admin/stats', token),
          getWithAuth<FailedPayment[]>('/admin/failures', token),
          getWithAuth<AdminTenant[]>('/admin/tenants', token),
          getWithAuth<AuditLog[]>('/admin/logs', token)
        ]);

        if (statsRes.data) setStats(statsRes.data);
        if (failuresRes.data) setFailures(failuresRes.data);
        if (tenantsRes.data) setTenants(tenantsRes.data);
        if (logsRes.data) setLogs(logsRes.data);
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
          <p className="text-xs text-muted mt-1">ARR: {stats ? (stats.arrCents / 100).toLocaleString('es-ES', { style: 'currency', currency: stats.currency }) : '-'}</p>
        </div>
        <div className="card">
          <h3 className="text-muted text-sm uppercase">Suscripciones Activas</h3>
          <p className="text-3xl font-bold mt-2">{stats?.activeSubscriptions || 0}</p>
          <p className="text-xs text-muted mt-1">(Activas + Past Due + Grace)</p>
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

      {/* Revenue Breakdown */}
      {stats && stats.revenueByPlan && stats.revenueByPlan.length > 0 && (
        <div className="card mb-8">
           <h2 className="text-xl font-bold mb-4">Ingresos por Plan</h2>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             {stats.revenueByPlan.map(plan => (
               <div key={plan.name} className="bg-base-200 p-4 rounded-lg">
                 <h4 className="font-bold text-lg">{plan.name}</h4>
                 <p className="text-2xl font-mono mt-1">
                   {(plan.revenueCents / 100).toLocaleString('es-ES', { style: 'currency', currency: stats.currency })}
                 </p>
                 <p className="text-sm text-muted">{plan.count} suscripciones</p>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* Operations */}
      <div className="card mb-8">
        <h2 className="text-xl font-bold mb-4">Operaciones de Sistema</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => triggerJob('billing')}
            className="btn btn-primary"
          >
            Ejecutar Billing Job
          </button>
          <button 
            onClick={() => triggerJob('dunning')}
            className="btn btn-secondary"
          >
            Ejecutar Dunning Job
          </button>
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
      {/* Audit Logs */}
      <div className="card mt-8">
        <h2 className="text-xl font-bold mb-4">Logs de Auditoría</h2>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted border-b border-border sticky top-0 bg-base-100 z-10">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Severidad</th>
                <th className="pb-2">Evento</th>
                <th className="pb-2">Mensaje</th>
                <th className="pb-2">Cliente/Usuario</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-base-200">
                  <td className="py-2 text-xs text-muted whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs font-bold
                      ${log.severity === 'info' ? 'bg-blue-100 text-blue-800' : 
                        log.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        log.severity === 'error' ? 'bg-red-100 text-red-800' :
                        'bg-red-900 text-white'}`}>
                      {log.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2 text-sm font-mono">{log.event_type}</td>
                  <td className="py-2 text-sm">{log.message}</td>
                  <td className="py-2 text-xs text-muted">
                    {log.tenant_name || log.user_email || 'System'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-muted">No hay logs registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
