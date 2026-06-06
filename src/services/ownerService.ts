import api from './api';
import type { Owner } from '../types/Owner';

export const getAllOwners = async (): Promise<Owner[]> => {
  const response = await api.get('/owners');
  return response.data;
};
