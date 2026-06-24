import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CapturaRecord } from '../models/auth.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CapturaService {

  private readonly API_URL = `${environment.apiUrl}/api/captura`;
  private http = inject(HttpClient);

  getAll(): Observable<CapturaRecord[]> {
    return this.http.get<CapturaRecord[]>(this.API_URL);
  }

  getById(id: number): Observable<CapturaRecord> {
    return this.http.get<CapturaRecord>(`${this.API_URL}/${id}`);
  }

  add(record: CapturaRecord): Observable<CapturaRecord> {
    return this.http.post<CapturaRecord>(this.API_URL, record);
  }

  update(record: CapturaRecord): Observable<CapturaRecord> {
    return this.http.put<CapturaRecord>(`${this.API_URL}/${record.id}`, record);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}