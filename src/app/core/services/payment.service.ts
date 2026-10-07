import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, query, where, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { Payment } from '../models/payment.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private get userId(): string {
    const user = this.authService.currentUserValue;
    return user ? user.id : '';
  }

  // CREATE
  async addPayment(paymentData: Omit<Payment, 'id' | 'userId' | 'date'>): Promise<string> {
    const uid = this.userId;
    if (!uid) throw new Error('Usuario no autenticado');

    const newPayment: Omit<Payment, 'id'> = {
      ...paymentData,
      userId: uid,
      date: Date.now()
    };

    const paymentsRef = collection(this.firestore, 'payments');
    const docRef = await addDoc(paymentsRef, newPayment);
    await updateDoc(docRef, { id: docRef.id });
    
    return docRef.id;
  }

  // READ ALL (By Client)
  getPaymentsByClient(clientId: string): Observable<Payment[]> {
    return this.authService.currentUser$.pipe(
      filter(user => !!user),
      take(1),
      switchMap(async (user) => {
        const paymentsRef = collection(this.firestore, 'payments');
        const q = query(
          paymentsRef, 
          where('userId', '==', user.id),
          where('clientId', '==', clientId)
        );
        const snapshot = await getDocs(q);
        const payments = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
        // Ordenar por fecha (más reciente primero)
        payments.sort((a, b) => b.date - a.date);
        return payments;
      })
    );
  }

  // READ ALL (For Dashboard)
  getAllPayments(): Observable<Payment[]> {
    return this.authService.currentUser$.pipe(
      filter(user => !!user),
      take(1),
      switchMap(async (user) => {
        const paymentsRef = collection(this.firestore, 'payments');
        const q = query(paymentsRef, where('userId', '==', user.id));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Payment));
      })
    );
  }

  // DELETE
  async deletePayment(paymentId: string): Promise<void> {
    const docRef = doc(this.firestore, `payments/${paymentId}`);
    await deleteDoc(docRef);
  }
}
