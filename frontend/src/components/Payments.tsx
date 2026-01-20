import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaymentsResponse } from '../types';
import { formatDate, getStatusBadgeClass } from '../utils';
import { exportToCSV } from '../utils/csvExport';
import { SkeletonTable } from './Skeleton';

interface PaymentsProps {
  payments: PaymentsResponse['payments'];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRetryPayment: (id: string) => void;
}

export function Payments({ payments, currentPage, totalPages, onPageChange, onRetryPayment }: PaymentsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [sortConfig, setSortConfig] = useState<{ key: keyof PaymentsResponse['payments'][0] | 'amount', direction: 'asc' | 'desc' } | null>(null);

  const filteredPayments = useMemo(() => {
    let result = payments.filter(pay => {
      const formattedAmount = (pay.amountCents / 100).toFixed(2);
      const matchesSearch = 
        pay.invoiceId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedAmount.includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || pay.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        // Handle special case for amount sorting
        if (sortConfig.key === 'amount') {
          aValue = a.amountCents;
          bValue = b.amountCents;
        } else {
          // We know key is a valid key of Payment if it's not 'amount'
          aValue = a[sortConfig.key as keyof typeof a];
          bValue = b[sortConfig.key as keyof typeof b];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else {
         // Default sort by date desc
         result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [payments, searchTerm, statusFilter, sortConfig]);

  const requestSort = (key: keyof PaymentsResponse['payments'][0] | 'amount') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const handleExportCSV = () => {
    const data = payments.map(pay => ({
      ID: pay.id,
      FacturaID: pay.invoiceId,
      Estado: pay.status,
      Monto: (pay.amountCents / 100).toFixed(2),
      Moneda: pay.currency,
      Fecha: formatDate(pay.createdAt)
    }));
    exportToCSV(data, `pagos_${new Date().toISOString().split('T')[0]}.csv`);
  };

  function generatePaymentReceipt(payment: PaymentsResponse["payments"][0]) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Primary color
    doc.text("BillForge", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Recibo de Pago", 14, 28);

    // Payment Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Pago #${payment.id.substring(0, 8)}`, 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Fecha: ${formatDate(payment.createdAt)}`, 14, 48);
    doc.text(`Estado: ${payment.status.toUpperCase()}`, 14, 54);
    doc.text(`Factura ID: ${payment.invoiceId}`, 14, 60);

    // Table
    autoTable(doc, {
      startY: 70,
      head: [["Descripción", "Monto"]],
      body: [
        [
          "Pago de suscripción", 
          `${(payment.amountCents / 100).toFixed(2)} ${payment.currency}`
        ]
      ],
      foot: [
        ["Total Pagado:", `${(payment.amountCents / 100).toFixed(2)} ${payment.currency}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Gracias por su pago.", 14, finalY + 10);

    doc.save(`recibo_${payment.id.substring(0, 8)}.pdf`);
  }

  return (
    <section className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="card-title mb-0">Historial de Pagos</h2>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="btn btn-outline btn-sm">
            Exportar CSV
          </button>
          <button onClick={() => onPageChange(currentPage)} className="btn btn-primary btn-sm">
            Refrescar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="col-span-2">
          <input
            type="text"
            placeholder="Buscar por ID de factura o monto..."
            className="input w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <select
            className="input w-full"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="succeeded">Exitoso</option>
            <option value="pending">Pendiente</option>
            <option value="failed">Fallido</option>
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => requestSort('invoiceId')} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                ID Factura {getSortIndicator('invoiceId')}
              </th>
              <th onClick={() => requestSort('status')} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                Estado {getSortIndicator('status')}
              </th>
              <th onClick={() => requestSort('createdAt')} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                Fecha {getSortIndicator('createdAt')}
              </th>
              <th onClick={() => requestSort('amount')} className="text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                Monto {getSortIndicator('amount')}
              </th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted">
                  No se encontraron pagos
                </td>
              </tr>
            ) : (
              filteredPayments.map((pay) => (
                <tr key={pay.id}>
                  <td className="font-mono">{pay.invoiceId}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(pay.status)}`}>
                      {pay.status}
                    </span>
                  </td>
                  <td>{formatDate(pay.createdAt)}</td>
                  <td className="text-right font-mono">
                    {(pay.amountCents / 100).toFixed(2)} {pay.currency}
                  </td>
                  <td className="text-center">
                      <div className="flex justify-center gap-1">
                        <button 
                          className="btn btn-sm btn-ghost"
                          onClick={() => generatePaymentReceipt(pay)}
                          title="Descargar Recibo"
                          disabled={pay.status !== 'succeeded'}
                        >
                          <span style={{ fontSize: '1.2rem' }}>📄</span>
                        </button>
                        {pay.status === 'failed' && (
                          <button
                            className="btn btn-sm btn-ghost text-primary"
                            onClick={() => onRetryPayment(pay.id)}
                            title="Reintentar Pago"
                          >
                            <span style={{ fontSize: '1.2rem' }}>🔄</span>
                          </button>
                        )}
                      </div>
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-muted">
          Página {currentPage} de {totalPages}
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-outline btn-sm" 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
          >
            Anterior
          </button>
          <button 
            className="btn btn-outline btn-sm" 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}
