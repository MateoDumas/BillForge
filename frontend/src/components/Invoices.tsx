import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InvoicesResponse } from '../types';
import { formatDate, getStatusBadgeClass } from '../utils';
import { exportToCSV } from '../utils/csvExport';
import { SkeletonTable } from './Skeleton';

interface InvoicesProps {
  invoices: InvoicesResponse['invoices'];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Invoices({ invoices, currentPage, totalPages, onPageChange }: InvoicesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [sortConfig, setSortConfig] = useState<{ key: keyof InvoicesResponse['invoices'][0] | 'amount', direction: 'asc' | 'desc' } | null>(null);

  const filteredInvoices = useMemo(() => {
    let result = invoices.filter(inv => {
      const formattedAmount = (inv.totalCents / 100).toFixed(2);
      const matchesSearch = 
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formattedAmount.includes(searchTerm);
      
      const matchesStatus = statusFilter === "all" || inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof typeof a];
        let bValue: any = b[sortConfig.key as keyof typeof b];

        // Handle special case for amount sorting
        if (sortConfig.key === 'amount') {
          aValue = a.totalCents;
          bValue = b.totalCents;
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
        result.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
    }

    return result;
  }, [invoices, searchTerm, statusFilter, sortConfig]);

  const requestSort = (key: keyof InvoicesResponse['invoices'][0] | 'amount') => {
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
  
  function handleExportCSV() {
    const data = invoices.map(inv => ({
      ID: inv.id,
      Numero: inv.number,
      Estado: inv.status,
      FechaEmision: formatDate(inv.issueDate),
      Vencimiento: formatDate(inv.dueDate),
      Total: (inv.totalCents / 100).toFixed(2),
      Moneda: inv.currency
    }));
    exportToCSV(data, `facturas_${new Date().toISOString().split('T')[0]}.csv`);
  }

  function generateInvoicePDF(invoice: InvoicesResponse["invoices"][0]) {
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235); // Primary color
    doc.text("BillForge", 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Facturación sólida. Infraestructura real.", 14, 28);

    // Invoice Info
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Factura #${invoice.number}`, 14, 40);
    
    doc.setFontSize(10);
    doc.text(`Fecha de emisión: ${formatDate(invoice.issueDate)}`, 14, 48);
    doc.text(`Estado: ${invoice.status.toUpperCase()}`, 14, 54);

    // Table
    autoTable(doc, {
      startY: 65,
      head: [["Descripción", "Cantidad", "Precio Unitario", "Total"]],
      body: [
        [
          "Servicios de Suscripción BillForge", 
          "1", 
          `${(invoice.totalCents / 100).toFixed(2)} ${invoice.currency}`,
          `${(invoice.totalCents / 100).toFixed(2)} ${invoice.currency}`
        ]
      ],
      foot: [
        ["", "", "Total:", `${(invoice.totalCents / 100).toFixed(2)} ${invoice.currency}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] },
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Gracias por su confianza.", 14, finalY + 10);

    doc.save(`factura_${invoice.number}.pdf`);
  }

  return (
    <section className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="card-title mb-0">Historial de Facturas</h2>
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
            placeholder="Buscar por número o monto..."
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
            <option value="paid">Pagada</option>
            <option value="open">Pendiente</option>
            <option value="void">Anulada</option>
            <option value="uncollectible">Incobrable</option>
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th onClick={() => requestSort('number')} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                Número {getSortIndicator('number')}
              </th>
              <th onClick={() => requestSort('status')} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                Estado {getSortIndicator('status')}
              </th>
              <th onClick={() => requestSort('issueDate')} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                Fecha Emisión {getSortIndicator('issueDate')}
              </th>
              <th onClick={() => requestSort('amount')} style={{ textAlign: "right" }} className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                Importe {getSortIndicator('amount')}
              </th>
              <th style={{ textAlign: "center" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted">
                  No se encontraron facturas
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono">{inv.number}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(inv.status)}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td>{formatDate(inv.issueDate)}</td>
                  <td style={{ textAlign: "right" }} className="font-mono">
                    {(inv.totalCents / 100).toFixed(2)} {inv.currency}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button 
                      className="btn btn-sm btn-ghost"
                      onClick={() => generateInvoicePDF(inv)}
                      title="Descargar PDF"
                    >
                      <span style={{ fontSize: '1.2rem' }}>📄</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
