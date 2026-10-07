import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, query, where, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { Delivery } from '../models/delivery.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class DeliveryService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private get userId(): string {
    const user = this.authService.currentUserValue;
    return user ? user.id : '';
  }

  // CREATE
  async addDelivery(deliveryData: Omit<Delivery, 'id' | 'userId' | 'date'>): Promise<string> {
    const uid = this.userId;
    if (!uid) throw new Error('Usuario no autenticado');

    const newDelivery: Omit<Delivery, 'id'> = {
      ...deliveryData,
      userId: uid,
      date: Date.now()
    };

    const deliveriesRef = collection(this.firestore, 'deliveries');
    const docRef = await addDoc(deliveriesRef, newDelivery);
    await updateDoc(docRef, { id: docRef.id });
    
    return docRef.id;
  }

  // READ ALL (By Client)
  getDeliveriesByClient(clientId: string): Observable<Delivery[]> {
    return this.authService.currentUser$.pipe(
      filter(user => !!user),
      take(1),
      switchMap(async (user) => {
        const deliveriesRef = collection(this.firestore, 'deliveries');
        const q = query(
          deliveriesRef, 
          where('userId', '==', user!.id),
          where('clientId', '==', clientId)
        );
        const snapshot = await getDocs(q);
        const deliveries = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Delivery));
        // Ordenar por fecha (más reciente primero)
        deliveries.sort((a, b) => b.date - a.date);
        return deliveries;
      })
    );
  }

  // READ ALL (For Dashboard)
  getAllDeliveries(): Observable<Delivery[]> {
    return this.authService.currentUser$.pipe(
      filter(user => !!user),
      take(1),
      switchMap(async (user) => {
        const deliveriesRef = collection(this.firestore, 'deliveries');
        const q = query(deliveriesRef, where('userId', '==', user.id));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Delivery));
      })
    );
  }

  // TOGGLE PAID STATUS
  async togglePaidStatus(deliveryId: string, isPaid: boolean): Promise<void> {
    const docRef = doc(this.firestore, `deliveries/${deliveryId}`);
    await updateDoc(docRef, { isPaid });
  }

  // DELETE
  async deleteDelivery(deliveryId: string): Promise<void> {
    const docRef = doc(this.firestore, `deliveries/${deliveryId}`);
    await deleteDoc(docRef);
  }
}
