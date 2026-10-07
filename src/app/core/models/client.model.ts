export interface Client {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  active: boolean;
  createdAt: number;
  updatedAt?: number;
}
