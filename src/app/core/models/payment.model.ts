export interface Payment {
  id: string;
  userId: string;
  clientId: string;
  amount: number;
  date: number; // Timestamp
  notes?: string;
}
