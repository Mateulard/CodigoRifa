import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // Puedes agregarle un estilo personalizado si lo necesitas

const Home = () => {
  return (
    <div className="container text-center mt-5">
      <h1 className="mb-4">Administración de Rifa</h1>
      <div className="row">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Personas</h5>
              <p className="card-text">Gestiona las personas e Instituciones.</p>
              <Link to="/Personas" className="btn btn-primary">Ir a Personas</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Comisiones</h5>
              <p className="card-text">Administra las Comisiones.</p>
              <Link to="/Comisiones" className="btn btn-primary">Ir a Comisiones</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Rifas</h5>
              <p className="card-text">Gestión y control de las rifas.</p>
              <Link to="/rifas" className="btn btn-primary">Ir a Rifas</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Premios</h5>
              <p className="card-text">Administra los Premios asignados.</p>
              <Link to="/Premios" className="btn btn-primary">Ir a Premios</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Cuotas</h5>
              <p className="card-text">Control de Cuotas.</p>
              <Link to="/cuotas" className="btn btn-primary">Ver las cuotas</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
