import { StatsResponse, SubscriptionResponse, InvoicesResponse } from '../types';
import { formatDate } from '../utils';
import { SpendingChart } from './SpendingChart';

interface DashboardProps {
  stats: StatsResponse | null;
  subscription: SubscriptionResponse['subscription'] | null;
  invoices: InvoicesResponse['invoices'];
  isLoading: boolean;
}

export function Dashboard({ stats, subscription, invoices, isLoading }: DashboardProps) {
  if (isLoading && !stats) {
    return null; // Spinner is handled by parent or we can add local skeleton
  }

  if (!stats) {
    return (
      <div className="text-center col-span-3 text-muted">
        No hay estadísticas disponibles.
      </div>
    );
  }

  // Calculate billing cycle progress
  let progress = 0;
  let daysLeft = 0;
  if (subscription) {
    const start = new Date(subscription.currentPeriodStart).getTime();
    const end = new Date(subscription.currentPeriodEnd).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
    daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="dashboard-grid">
      <div className="card dashboard-card">
        <h3 className="text-muted text-sm">Gasto Total</h3>
        <div className="stat-value">
          {(stats.totalSpentCents / 100).toFixed(2)} <span className="text-sm">{stats.currency}</span>
        </div>
      </div>
      
      <div className="card dashboard-card">
        <h3 className="text-muted text-sm">Facturas Pendientes</h3>
        <div className="stat-value text-warning">
          {stats.pendingInvoicesCount}
        </div>
        <div className="text-sm text-muted">
          Total: {(stats.pendingInvoicesAmountCents / 100).toFixed(2)} {stats.currency}
        </div>
      </div>

      <div className="card dashboard-card">
        <h3 className="text-muted text-sm">Próximo Cobro</h3>
        {stats.nextBillingDate ? (
          <>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>
              {formatDate(stats.nextBillingDate)}
            </div>
            <div className="text-sm text-muted">
              Estimado: {(stats.nextBillingAmountCents! / 100).toFixed(2)} {stats.currency}
            </div>
          </>
        ) : (
          <div className="text-muted mt-2">No hay cobros programados</div>
        )}
      </div>

      {/* Chart Section */}
      <SpendingChart invoices={invoices} />

      {/* Subscription Cycle Progress */}
      {subscription && (
        <div className="card col-span-full">
          <div className="flex justify-between items-center mb-2">
            <h3 className="card-title mb-0">Ciclo de Facturación Actual</h3>
            <span className="text-sm text-muted">{daysLeft} días restantes</span>
          </div>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${progress}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted mt-1">
            <span>{formatDate(subscription.currentPeriodStart)}</span>
            <span>{formatDate(subscription.currentPeriodEnd)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
