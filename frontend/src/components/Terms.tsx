import React from 'react';

export function Terms() {
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Términos y Condiciones</h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>Última actualización: {new Date().toLocaleDateString()}</p>
        
        <div className="prose">
          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>1. Introducción</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Bienvenido a BillForge. Al acceder a nuestro sitio web y utilizar nuestros servicios, usted acepta cumplir con estos términos y condiciones.
              BillForge es una plataforma de facturación y gestión financiera diseñada para simplificar sus operaciones comerciales.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>2. Uso del Servicio</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Usted se compromete a utilizar nuestros servicios únicamente con fines legales y de acuerdo con estos Términos.
              No debe utilizar el servicio para transmitir ningún código de naturaleza destructiva o ilegal.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>3. Cuentas y Seguridad</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Para acceder a ciertas funciones, deberá registrarse. Es su responsabilidad mantener la confidencialidad de su cuenta y contraseña.
              Notifíquenos inmediatamente sobre cualquier uso no autorizado de su cuenta.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>4. Pagos y Suscripciones</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Algunos servicios se ofrecen bajo suscripción de pago. Al seleccionar una suscripción, acepta pagar las tarifas indicadas.
              Las suscripciones se renuevan automáticamente a menos que se cancelen antes del final del período actual.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>5. Modificaciones</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Nos reservamos el derecho de modificar o reemplazar estos Términos en cualquier momento.
              Es su responsabilidad revisar estos Términos periódicamente para detectar cambios.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
