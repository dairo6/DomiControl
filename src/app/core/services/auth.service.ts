import { Injectable, inject } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, of } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { User } from '../models/user.model';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // Track auth state from Firebase
  public authState$ = authState(this.auth);

  constructor() {
    this.authState$.pipe(
      switchMap(async (firebaseUser) => {
        if (firebaseUser) {
          // If logged in, fetch user data from Firestore
          let user = null;
          try {
            user = await this.getUserData(firebaseUser.uid);
          } catch (err) {
            console.warn('No se pudo leer el usuario de Firestore (posible error de permisos). Usando fallback.', err);
          }
          if (user) return user;
          
          // Fallback if user created manually in Firebase Auth
          return {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            email: firebaseUser.email || '',
            active: true,
            defaultDeliveryValue: 5000,
            createdAt: Date.now()
          };
        } else {
          return null;
        }
      })
    ).subscribe((user) => {
      this.currentUserSubject.next(user);
    });
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // LOGIN
  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  // REGISTER
  async register(email: string, password: string, name: string): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
    const firebaseUser = userCredential.user;

    // Update profile with name
    await updateProfile(firebaseUser, { displayName: name });

    // Save to Firestore
    const newUser: User = {
      id: firebaseUser.uid,
      name,
      email,
      active: true,
      defaultDeliveryValue: 5000,
      createdAt: Date.now()
    };

    const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    await setDoc(userDocRef, newUser);
  }

  // LOGOUT
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }

  // FORGOT PASSWORD
  async forgotPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  // HELPER to fetch user from Firestore
  private async getUserData(uid: string): Promise<User | null> {
    const userDocRef = doc(this.firestore, `users/${uid}`);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data() as User;
    }
    return null;
  }
}
