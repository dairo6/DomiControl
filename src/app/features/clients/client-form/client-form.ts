import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ClientService } from '../../../core/services/client.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  templateUrl: './client-form.html',
  styleUrl: './client-form.scss'
})
export class ClientForm implements OnInit {
  private fb = inject(FormBuilder);
  private clientService = inject(ClientService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  clientForm: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: [''],
    address: [''],
    notes: ['']
  });

  clientId: string | null = null;
  loading = false;
  isEditing = false;
  errorMessage = '';

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    if (this.clientId) {
      this.isEditing = true;
      this.loadClient(this.clientId);
    }
  }

  async loadClient(id: string) {
    this.clientService.getClient(id).subscribe((client) => {
      if (client) {
        this.clientForm.patchValue({
          name: client.name,
          phone: client.phone,
          address: client.address,
          notes: client.notes
        });
      }
    });
  }

  async onSubmit() {
    this.errorMessage = '';
    
    if (this.clientForm.invalid) {
      this.errorMessage = 'Por favor, llena los campos correctamente (El nombre debe tener al menos 3 letras).';
      return;
    }
    
    this.loading = true;
    try {
      const clientData = this.clientForm.value;
      if (this.isEditing && this.clientId) {
        await this.clientService.updateClient(this.clientId, clientData);
      } else {
        await this.clientService.createClient(clientData);
      }
      this.router.navigate(['/clients']);
    } catch (error: any) {
      console.error('Error guardando cliente', error);
      this.errorMessage = 'Error de Firebase: ' + (error.message || 'No se pudo guardar.');
    } finally {
      this.loading = false;
    }
  }
}
