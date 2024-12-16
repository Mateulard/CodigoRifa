import React from 'react';
import { Link } from 'react-router-dom';
import './RifaAdmin.css'; 

const Home = () => {
  return (
    <div className="container">
      <h1 className="text-center mb-5">Administración de Rifa</h1>
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Personas</h5>
              <p className="card-text flex-grow-1">Gestiona las personas e Instituciones.</p>
              <Link to="/Personas" className="btn btn-primary mt-auto">Ir a Personas</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Comisiones</h5>
              <p className="card-text flex-grow-1">Administra las Comisiones.</p>
              <Link to="/Comisiones" className="btn btn-primary mt-auto">Ir a Comisiones</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Rifas</h5>
              <p className="card-text flex-grow-1">Gestión y control de las rifas.</p>
              <Link to="/rifas" className="btn btn-primary mt-auto">Ir a Rifas</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Premios</h5>
              <p className="card-text flex-grow-1">Administra los Premios asignados.</p>
              <Link to="/Premios" className="btn btn-primary mt-auto">Ir a Premios</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body d-flex flex-column">
              <h5 className="card-title">Cuotas</h5>
              <p className="card-text flex-grow-1">Control de Cuotas.</p>
              <Link to="/cuotas" className="btn btn-primary mt-auto">Ver las cuotas</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;