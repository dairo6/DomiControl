import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { Client } from '../models/client.model';
import { User } from '../models/user.model';
import { AuthService } from './auth.service';
import { Firestore, collection, doc, addDoc, updateDoc, query, where, getDocs, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private get userId(): string {
    const user = this.authService.currentUserValue;
    return user ? user.id : '';
  }

  // CREATE
  async createClient(clientData: Partial<Client>): Promise<string> {
    const uid = this.userId;
    if (!uid) throw new Error('Usuario no autenticado');

    const newClient: Omit<Client, 'id'> = {
      userId: uid,
      name: clientData.name!,
      phone: clientData.phone || '',
      address: clientData.address || '',
      notes: clientData.notes || '',
      active: true,
      createdAt: Date.now()
    };

    const clientsRef = collection(this.firestore, 'clients');
    const docRef = await addDoc(clientsRef, newClient);
    
    await updateDoc(docRef, { id: docRef.id });
    
    return docRef.id;
  }

  // READ ALL
  getClients(): Observable<Client[]> {
    return this.authService.currentUser$.pipe(
      filter((user): user is User => !!user),
      take(1),
      switchMap(async (user: User) => {
        const clientsRef = collection(this.firestore, 'clients');
        const q = query(clientsRef, where('userId', '==', user.id));
        const snapshot = await getDocs(q);
        const clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Client));
        clients.sort((a, b) => b.createdAt - a.createdAt);
        return clients;
      })
    );
  }

  // READ ONE
  getClient(id: string): Observable<Client> {
    return from(this.getSingleClient(id));
  }

  private async getSingleClient(id: string): Promise<Client> {
    const docRef = doc(this.firestore, `clients/${id}`);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return { id: snapshot.id, ...snapshot.data() } as Client;
    }
    throw new Error('Cliente no encontrado');
  }

  // UPDATE
  async updateClient(id: string, clientData: Partial<Client>): Promise<void> {
    const docRef = doc(this.firestore, `clients/${id}`);
    await updateDoc(docRef, {
      ...clientData,
      updatedAt: Date.now()
    });
  }

  // TOGGLE STATUS (Soft delete)
  async toggleClientActive(id: string, active: boolean): Promise<void> {
    const docRef = doc(this.firestore, `clients/${id}`);
    await updateDoc(docRef, { active });
  }
}
