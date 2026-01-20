import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { InvoicesResponse } from '../types';

interface SpendingChartProps {
  invoices: InvoicesResponse['invoices'];
}

export function SpendingChart({ invoices }: SpendingChartProps) {
  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    // Sort invoices by date
    const sortedInvoices = [...invoices].sort((a, b) => new Date(a.issueDate).getTime() - new Date(b.issueDate).getTime());
    
    sortedInvoices.forEach(inv => {
      if (inv.status !== 'void' && inv.status !== 'uncollectible') {
        const date = new Date(inv.issueDate);
        const month = date.toLocaleString('es-ES', { month: 'short' }); // e.g., "ene"
        // Capitalize first letter
        const formattedMonth = month.charAt(0).toUpperCase() + month.slice(1);
        data[formattedMonth] = (data[formattedMonth] || 0) + inv.totalCents / 100;
      }
    });
    
    return Object.entries(data).map(([name, amount]) => ({ name, amount }));
  }, [invoices]);

  if (chartData.length === 0) {
    return (
        <div className="card col-span-full flex items-center justify-center p-8 text-muted">
            No hay datos suficientes para mostrar el historial de gastos.
        </div>
    );
  }

  return (
    <div className="card col-span-full">
      <h3 className="card-title mb-4">Historial de Gastos</h3>
      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis 
                dataKey="name" 
                stroke="var(--text-secondary)" 
                tick={{fill: 'var(--text-secondary)'}} 
                tickLine={false}
            />
            <YAxis 
                stroke="var(--text-secondary)" 
                tick={{fill: 'var(--text-secondary)'}} 
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Gasto'] as [string, string]}
              labelStyle={{ color: '#333' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              cursor={{ fill: 'var(--hover-bg)' }}
            />
            <Bar 
                dataKey="amount" 
                name="Gasto" 
                fill="var(--primary-color)" 
                radius={[4, 4, 0, 0]} 
                barSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
