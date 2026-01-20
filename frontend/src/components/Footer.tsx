export function Footer() {
  return (
    <footer className="app-footer">
      <div className="container">
        <p>&copy; {new Date().getFullYear()} BillForge. Todos los derechos reservados.</p>
        <div className="footer-links">
          <a href="#" className="footer-link">Términos</a>
          <a href="#" className="footer-link">Privacidad</a>
          <a href="#" className="footer-link">Soporte</a>
        </div>
      </div>
    </footer>
  );
}
