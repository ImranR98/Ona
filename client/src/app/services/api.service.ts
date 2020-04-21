import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(private http: HttpClient) { }

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true //this is required so that Angular returns the Cookies received from the server. The server sends cookies in Set-Cookie header. Without this, Angular will ignore the Set-Cookie header
  }

  async add(collection: string, dir: string): Promise<any> {
    return this.http.post(environment.apiUrl + '/add', { collection, dir }, this.httpOptions).toPromise()
  }

  async remove(collection: string): Promise<any> {
    return this.http.post(environment.apiUrl + '/remove', { collection }, this.httpOptions).toPromise()
  }
}
