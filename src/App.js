import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from 'react-router-dom';
import Comisiones from './components/Comisiones/Comisiones';
import Cuotas from './components/Coutas/Cuotas';
import Rifas from './components/Rifas/Rifas';
import Personas from './components/Personas/Personas';
import Premios from './components/Premios/Premios';
import Home from './components/Home/Home';
import Login from './components/Login/Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (loginSuccess) => {
    setIsAuthenticated(loginSuccess);
  };

  return (
    <Router>
      <div>
        {isAuthenticated && (
          <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
              <Link className="navbar-brand" to="/">Admin Rifa</Link>
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span className="navbar-toggler-icon"></span>
              </button>
              <div className="collapse navbar-collapse" id="navbarNav">
                <ul className="navbar-nav ms-auto">
                  <li className="nav-item">
                    <Link className="nav-link" to="/comisiones">Comisiones</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/cuotas">Cuotas</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/rifas">Rifas</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/premios">Premios</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/personas">Personas</Link>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-link nav-link" onClick={() => setIsAuthenticated(false)}>Cerrar sesión</button>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        )}

        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/" element={
            isAuthenticated ? <Home /> : <Navigate to="/login" />
          } />
          <Route path="/comisiones" element={
            isAuthenticated ? <Comisiones /> : <Navigate to="/login" />
          } />
          <Route path="/personas" element={
            isAuthenticated ? <Personas /> : <Navigate to="/login" />
          } />
          <Route path="/rifas" element={
            isAuthenticated ? <Rifas /> : <Navigate to="/login" />
          } />
          <Route path="/premios" element={
            isAuthenticated ? <Premios /> : <Navigate to="/login" />
          } />
          <Route path="/cuotas" element={
            isAuthenticated ? <Cuotas /> : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;