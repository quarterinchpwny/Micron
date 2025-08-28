import React, { useEffect, useState } from 'react';
import { Plus, Power, Trash } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

interface Service {
  name: string;
  path?: string;
  infra?: boolean;
  image?: string;
  ports?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
}

interface ServiceList {
  detected: Service[];
  managed: {
    managed: Service[];
    infra: Service[];
  };
}

export default function App() {
  const [services, setServices] = useState<ServiceList>({ detected: [], managed: { managed: [], infra: [] } });
  const [serviceData, setServiceData] = useState({ name: '', path: '', infra: false });

  // Fetches the initial list of services when the component mounts
  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = () => {
    fetch(`${API_BASE_URL}/list`)
      .then(r => r.json())
      .then(data => setServices(data))
      .catch(error => console.error('Failed to fetch services:', error));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setServiceData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addService = () => {
    fetch(`${API_BASE_URL}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serviceData),
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to add service');
        }
        setServiceData({ name: '', path: '', infra: false }); // Clear form
        fetchServices(); // Refresh the service list
      })
      .catch(error => console.error('Error adding service:', error));
  };

  const deleteService = (name: string) => {
    fetch(`${API_BASE_URL}/services/${name}`, { method: 'DELETE' })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete service');
        }
        fetchServices(); // Refresh the service list
      })
      .catch(error => console.error('Error deleting service:', error));
  };

  const handleDockerAction = (action: 'up' | 'down' | 'generate') => {
    fetch(`${API_BASE_URL}/${action}`, { method: 'POST' })
      .then(response => response.json())
      .then(data => console.log(`Docker action '${action}' result:`, data))
      .catch(error => console.error(`Failed to perform docker action '${action}':`, error));
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">Dynamic Compose Manager</h1>
      <div className="space-x-2">
        <input
          placeholder="Name"
          name="name"
          value={serviceData.name}
          onChange={handleInputChange}
        />
        {!serviceData.infra && (
          <input
            placeholder="Path"
            name="path"
            value={serviceData.path}
            onChange={handleInputChange}
          />
        )}
        <label>
          <input
            type="checkbox"
            name="infra"
            checked={serviceData.infra}
            onChange={handleInputChange}
          />{' '}
          Infra
        </label>
        <button onClick={addService}>
          <Plus className="inline" /> Add
        </button>
      </div>
      <div>
        <h2 className="font-semibold">Detected</h2>
        <ul>
          {services.detected.map(s => (
            <li key={s.name}>{s.name} ({s.path})</li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="font-semibold">Managed</h2>
        <ul>
          {services.managed.managed.map(s => (
            <li key={s.name}>
              {s.name} <button onClick={() => deleteService(s.name)}><Trash size={16} /></button>
            </li>
          ))}
          {services.managed.infra.map(s => (
            <li key={s.name}>
              {s.name} (infra) <button onClick={() => deleteService(s.name)}><Trash size={16} /></button>
            </li>
          ))}
        </ul>
      </div>
      <div className="space-x-2">
        <button onClick={() => handleDockerAction('generate')}>Generate</button>
        <button onClick={() => handleDockerAction('up')}>
          <Power className="inline" /> Up
        </button>
        <button onClick={() => handleDockerAction('down')}>
          <Power className="inline text-red-500" /> Down
        </button>
      </div>
    </div>
  );
}