import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

export function Support() {
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    type: 'general'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    addToast('Mensaje enviado. Te contactaremos pronto.', 'success');
    setFormData({ subject: '', message: '', type: 'general' });
    setIsSubmitting(false);
  };

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card">
        <h1 className="card-title" style={{ fontSize: '2rem', textAlign: 'center' }}>Centro de Soporte</h1>
        <p className="text-muted text-center" style={{ marginBottom: '2rem' }}>
          ¿Necesitas ayuda? Completa el formulario y nuestro equipo te responderá en breve.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="input-group">
            <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-primary)' }}>Tipo de Consulta</label>
            <select 
              className="form-control"
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
            >
              <option value="general">Consulta General</option>
              <option value="technical">Problema Técnico</option>
              <option value="billing">Facturación</option>
              <option value="feature">Sugerencia</option>
            </select>
          </div>

          <div className="input-group">
            <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-primary)' }}>Asunto</label>
            <input
              type="text"
              className="form-control"
              placeholder="Resumen breve del problema"
              required
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
            />
          </div>

          <div className="input-group">
            <label className="text-sm font-medium mb-1 block" style={{ color: 'var(--text-primary)' }}>Mensaje</label>
            <textarea
              className="form-control"
              rows={5}
              placeholder="Describe tu problema en detalle..."
              required
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>Otros canales</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📧</div>
              <div className="text-sm font-medium">Email</div>
              <div className="text-xs text-muted">support@billforge.com</div>
            </div>
            <div style={{ padding: '1rem', backgroundColor: 'var(--hover-bg)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>💬</div>
              <div className="text-sm font-medium">Chat</div>
              <div className="text-xs text-muted">Lun-Vie 9am-6pm</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
