export interface Delivery {
  id: string;
  userId: string;
  clientId: string;
  clientName?: string; // Para no tener que buscar el cliente al mostrar la lista general
  date: number; // Timestamp (Date.now())
  value: number; // Valor del domicilio (Ej. 5000)
  isPaid: boolean; // ¿Lo pagó de inmediato o quedó debiendo?
  notes?: string;
}
