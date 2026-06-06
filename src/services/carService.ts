import type { Car } from '../types/Car';
import api from './api'; 

export const getAllCars = async (): Promise<Car[]> => {
  const response = await api.get('/cars'); 
  return response.data;
};

export const addCar = async (car: Car): Promise<Car> => {
  const response = await api.post('/cars', car);
  return response.data;
};

export const deleteCar = async (id: number): Promise<void> => {
  await api.delete(`/cars/${id}`);
};
