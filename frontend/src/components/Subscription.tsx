import { SubscriptionResponse, PlansResponse } from '../types';
import { formatDate, getStatusBadgeClass } from '../utils';

interface SubscriptionProps {
  subscription: SubscriptionResponse['subscription'] | null;
  plans: PlansResponse;
  isLoading: boolean;
  selectedPlanId: string;
  setSelectedPlanId: (id: string) => void;
  createSubscription: () => void;
  cancelSubscription: (id: string) => void;
}

export function Subscription({
  subscription,
  plans,
  isLoading,
  selectedPlanId,
  setSelectedPlanId,
  createSubscription,
  cancelSubscription
}: SubscriptionProps) {
  return (
    <section className="card">
      <h2 className="card-title">Gestión de Suscripción</h2>
      
      {subscription ? (
        <div className="mb-4">
          <div className="grid-auto-fit mb-4">
            <div>
              <div className="text-sm text-muted">Estado</div>
              <span className={getStatusBadgeClass(subscription.status)}>
                {subscription.status}
              </span>
            </div>
            <div>
              <div className="text-sm text-muted">Plan ID</div>
              <div style={{ wordBreak: 'break-all' }}>{subscription.planId}</div>
            </div>
            <div>
              <div className="text-sm text-muted">Periodo Actual</div>
              <div>{formatDate(subscription.currentPeriodStart)} &rarr; {formatDate(subscription.currentPeriodEnd)}</div>
            </div>
          </div>

          <button
            onClick={() => cancelSubscription(subscription.id)}
            className="btn btn-danger"
            disabled={isLoading}
          >
            {isLoading ? 'Procesando...' : 'Cancelar suscripción'}
          </button>
        </div>
      ) : (
        <div className="mb-4 text-muted">
          No tienes ninguna suscripción activa actualmente.
        </div>
      )}

      <hr className="divider" />

      <h3 className="card-title text-base">Cambiar Plan</h3>
      <div className="flex gap-2 items-center flex-wrap">
        <select
          className="form-control max-w-xs"
          value={selectedPlanId}
          onChange={e => setSelectedPlanId(e.target.value)}
          disabled={isLoading}
        >
          <option value="">Seleccionar un plan...</option>
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.name} ({plan.billingPeriod}) - {(plan.basePriceCents / 100).toFixed(2)} {plan.currency}
            </option>
          ))}
        </select>
        <button
          onClick={createSubscription}
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Procesando...' : (subscription ? 'Cambiar Plan' : 'Suscribirse')}
        </button>
      </div>
    </section>
  );
}
