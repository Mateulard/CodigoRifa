import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from 'react-bootstrap';
import ConsignarCuotas from './ConsignarCuotas';
import Cuotas from './Cuotas';

export default function RaffleManagement() {
  const [key, setKey] = useState('consignarCuotas');

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Gestión de Rifas</h1>
      <Tabs
        id="raffle-management-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="consignarCuotas" title="Consignar Cuotas">
          <ConsignarCuotas />
        </Tab>
        <Tab eventKey="cuotas" title="Cuotas">
          <Cuotas />
        </Tab>
      </Tabs>
    </div>
  );
}

