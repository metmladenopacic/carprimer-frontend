import { useEffect, useState } from 'react';
import type { Car } from '../types/Car';
import { getAllCars, deleteCar } from '../services/carService';

export const useCars = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCars = async () => {
    try {
      const data = await getAllCars();
      setCars(data);
    } catch {
      setError('Greška prilikom učitavanja podataka.');
    } finally {
      setLoading(false);
    }
  };

  const removeCar = async (id: number) => {
    try {
      await deleteCar(id);
      await loadCars();
    } catch {
      setError('Greška prilikom brisanja.');
    }
  };

  useEffect(() => {
    loadCars();
  }, []);

  return { cars, loading, error, loadCars, removeCar };
};
