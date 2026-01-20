interface FooterProps {
  onNavigate: (page: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="app-footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} BillForge. Todos los derechos reservados.</p>
        <div className="footer-links">
          <button onClick={() => onNavigate('terms')} className="footer-link">Términos</button>
          <button onClick={() => onNavigate('privacy')} className="footer-link">Privacidad</button>
          <button onClick={() => onNavigate('support')} className="footer-link">Soporte</button>
        </div>
      </div>
    </footer>
  );
}
