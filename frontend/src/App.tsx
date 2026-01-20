import { useEffect, useState } from "react";
import { deleteWithAuth, getWithAuth, postWithAuth } from "./api";
import "./App.css";
import { Dashboard } from "./components/Dashboard";
import { Footer } from "./components/Footer";
import { Invoices } from "./components/Invoices";
import { Payments } from "./components/Payments";
import { Subscription } from "./components/Subscription";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { ThemeToggle } from "./components/ThemeToggle";
import { Notifications } from "./components/Notifications";
import { Login } from "./components/Login";
import { Terms } from "./components/Terms";
import { Privacy } from "./components/Privacy";
import { Support } from "./components/Support";
import {
  CreateSubscriptionResponse,
  InvoicesResponse,
  PaymentsResponse,
  PlansResponse,
  StatsResponse,
  SubscriptionResponse,
  TenantMeResponse
} from "./types";

type Tab = "dashboard" | "subscription" | "invoices" | "payments" | "terms" | "privacy" | "support";

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const { addToast } = useToast();
  const [token, setToken] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [tenantInfo, setTenantInfo] = useState<TenantMeResponse | null>(null);
  const [subscription, setSubscription] =
    useState<SubscriptionResponse["subscription"]>(null);
  const [invoices, setInvoices] = useState<InvoicesResponse["invoices"]>([]);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(1);

  const [payments, setPayments] = useState<PaymentsResponse["payments"]>([]);
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [paymentsTotalPages, setPaymentsTotalPages] = useState(1);

  const [plans, setPlans] = useState<PlansResponse>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem("billforge_token");
    if (stored) {
      setToken(stored);
    }
  }, []);

  useEffect(() => {
    if (token) {
      window.localStorage.setItem("billforge_token", token);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      return;
    }
    void loadAllData();
  }, [token]);

  async function loadAllData() {
    setIsLoading(true);
    try {
      await Promise.all([
        loadTenant(),
        loadStats(),
        loadPlans(),
        loadSubscription(),
        loadInvoices(),
        loadPayments()
      ]);
    } catch (e) {
      console.error("Error loading data", e);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTenant() {
    const result = await getWithAuth<TenantMeResponse>("/tenants/me", token);
    if (result.error) {
      setError(result.error);
      addToast(result.error, "error");
    } else {
      setTenantInfo(result.data);
    }
  }
  
  async function handleRetryPayment(paymentId: string) {
    setIsLoading(true);
    const result = await postWithAuth<any>(`/payments/${paymentId}/retry`, {}, token);
    setIsLoading(false);
    
    if (result.error) {
      addToast(result.error, "error");
    } else {
      addToast("Pago reintentado con éxito", "success");
      // Reload data to reflect changes
      loadPayments(paymentsPage);
      loadInvoices(invoicesPage);
      loadStats();
    }
  }

  function logout() {
    setToken("");
    window.localStorage.removeItem("billforge_token");
    setTenantInfo(null);
    setSubscription(null);
    setInvoices([]);
    setPayments([]);
    setPlans([]);
    setStats(null);
    setError(null);
    addToast("Sesión cerrada", "info");
  }

  async function loadStats() {
    const result = await getWithAuth<StatsResponse>("/tenants/stats", token);
    if (result.error) {
      console.error("Failed to load stats", result.error);
      // Optional: addToast("Error al cargar estadísticas", "error");
    } else {
      setStats(result.data);
    }
  }

  async function loadPlans() {
    const result = await getWithAuth<PlansResponse>("/plans", token);
    if (result.error) {
      setError(result.error);
      addToast(result.error, "error");
    } else {
      setPlans(result.data || []);
    }
  }

  async function loadSubscription() {
    const result = await getWithAuth<SubscriptionResponse>(
      "/subscriptions",
      token
    );
    if (result.error) {
      setError(result.error);
      addToast(result.error, "error");
    } else if (result.data) {
      setSubscription(result.data.subscription);
    }
  }

  async function loadInvoices(page = 1) {
    setIsLoading(true);
    const result = await getWithAuth<InvoicesResponse>(`/invoices?page=${page}&limit=10`, token);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      addToast(result.error, "error");
    } else if (result.data) {
      setInvoices(result.data.invoices);
      setInvoicesPage(result.data.page);
      setInvoicesTotalPages(result.data.totalPages);
    }
  }

  async function loadPayments(page = 1) {
    setIsLoading(true);
    const result = await getWithAuth<PaymentsResponse>(`/payments?page=${page}&limit=10`, token);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
      addToast(result.error, "error");
    } else if (result.data) {
      setPayments(result.data.payments);
      setPaymentsPage(result.data.page);
      setPaymentsTotalPages(result.data.totalPages);
    }
  }

  async function createSubscription() {
    if (!selectedPlanId) return;
    setIsLoading(true);
    const result = await postWithAuth<CreateSubscriptionResponse>(
      "/subscriptions",
      { planId: selectedPlanId },
      token
    );
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      addToast(result.error, "error");
    } else if (result.data) {
      setSubscription(result.data.subscription);
      addToast("Suscripción creada exitosamente", "success");
      void loadInvoices();
    }
  }

  async function cancelSubscription(subscriptionId: string) {
    if (!confirm("¿Estás seguro de cancelar la suscripción?")) return;

    setIsLoading(true);
    const result = await deleteWithAuth<SubscriptionResponse>(
      `/subscriptions/${subscriptionId}`,
      token
    );
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      addToast(result.error, "error");
    } else if (result.data) {
      setSubscription(result.data.subscription);
      addToast("Suscripción cancelada exitosamente", "success");
    }
  }

  if (!token) {
    return <Login onLogin={setToken} />;
  }

  return (
    <div className="container">
      <header className="app-header">
        <img
          src="/BillForgelogo.png"
          alt="BillForge"
          className="logo"
        />
        <div className="flex-1">
          <div className="brand-name">BillForge Panel</div>
          <div className="brand-slogan">
            Facturación sólida. Infraestructura real.
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          <Notifications token={token} />
          <button 
            onClick={logout} 
            className="btn btn-ghost btn-circle" 
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <span style={{ fontSize: '1.5rem' }}>🚪</span>
          </button>
        </div>
      </header>

      <nav className="tabs" role="tablist" aria-label="Navegación principal">
        <button
          className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
          role="tab"
          aria-selected={activeTab === "dashboard"}
          aria-controls="dashboard-panel"
          id="dashboard-tab"
        >
          Inicio
        </button>
        <button
          className={`tab-btn ${activeTab === "subscription" ? "active" : ""}`}
          onClick={() => setActiveTab("subscription")}
          role="tab"
          aria-selected={activeTab === "subscription"}
          aria-controls="subscription-panel"
          id="subscription-tab"
        >
          Suscripción
        </button>
        <button
          className={`tab-btn ${activeTab === "invoices" ? "active" : ""}`}
          onClick={() => setActiveTab("invoices")}
          role="tab"
          aria-selected={activeTab === "invoices"}
          aria-controls="invoices-panel"
          id="invoices-tab"
        >
          Facturas
        </button>
        <button
          className={`tab-btn ${activeTab === "payments" ? "active" : ""}`}
          onClick={() => setActiveTab("payments")}
          role="tab"
          aria-selected={activeTab === "payments"}
          aria-controls="payments-panel"
          id="payments-tab"
        >
          Pagos
        </button>
      </nav>

      <main style={{ minHeight: '60vh' }} role="tabpanel" id={`${activeTab}-panel`} aria-labelledby={`${activeTab}-tab`}>
        {isLoading && !subscription && !stats && invoices.length === 0 ? (
          <div className="spinner-container">
            <div className="spinner"></div>
            <div>Cargando datos...</div>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <Dashboard 
                stats={stats} 
                subscription={subscription} 
                invoices={invoices}
                isLoading={isLoading} 
              />
            )}

            {activeTab === "subscription" && (
              <Subscription
                subscription={subscription}
                plans={plans}
                isLoading={isLoading}
                selectedPlanId={selectedPlanId}
                setSelectedPlanId={setSelectedPlanId}
                createSubscription={createSubscription}
                cancelSubscription={cancelSubscription}
              />
            )}

            {activeTab === "invoices" && (
              <Invoices
                invoices={invoices}
                currentPage={invoicesPage}
                totalPages={invoicesTotalPages}
                onPageChange={loadInvoices}
              />
            )}

            {activeTab === "payments" && (
              <Payments
                payments={payments}
                currentPage={paymentsPage}
                totalPages={paymentsTotalPages}
                onPageChange={loadPayments}
                onRetryPayment={handleRetryPayment}
              />
            )}

            {activeTab === "terms" && <Terms />}
            {activeTab === "privacy" && <Privacy />}
            {activeTab === "support" && <Support />}
            {activeTab === "admin" && <AdminDashboard token={token} />}
          </>
        )}
      </main>

      <Footer onNavigate={(tab) => setActiveTab(tab as Tab)} />
    </div>
  );
}
