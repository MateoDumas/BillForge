import React from 'react';

export function Privacy() {
  return (
    <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="card">
        <h1 className="card-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>Política de Privacidad</h1>
        <p className="text-muted" style={{ marginBottom: '2rem' }}>Última actualización: {new Date().toLocaleDateString()}</p>
        
        <div className="prose">
          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Recopilación de Información</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Recopilamos información que usted nos proporciona directamente, como cuando crea una cuenta, actualiza su perfil,
              o utiliza nuestras funciones de facturación. Esto incluye nombre, correo electrónico y datos de facturación.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Uso de la Información</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Utilizamos la información recopilada para proporcionar, mantener y mejorar nuestros servicios,
              procesar transacciones, enviar confirmaciones y comunicarnos con usted sobre productos y servicios.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Protección de Datos</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Implementamos medidas de seguridad diseñadas para proteger su información contra el acceso no autorizado,
              la divulgación, alteración o destrucción. Sus datos se almacenan en servidores seguros.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Cookies</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Utilizamos cookies y tecnologías similares para analizar tendencias, administrar el sitio web y
              rastrear los movimientos de los usuarios alrededor del sitio para mejorar su experiencia.
            </p>
          </section>

          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Contacto</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Si tiene preguntas sobre esta Política de Privacidad, contáctenos a través de nuestro formulario de soporte
              o enviando un correo a privacy@billforge.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
