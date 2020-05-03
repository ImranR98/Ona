import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from 'src/environments/environment'

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

  async list(collection: string): Promise<any> {
    return this.http.get(environment.apiUrl + `/list/${collection}`, this.httpOptions).toPromise()
  }

  async single(collection: string, id: string): Promise<any> {
    return this.http.get(environment.apiUrl + `/single/${collection}/${id}`, this.httpOptions).toPromise()
  }

  async many(collection: string, ids: string[]): Promise<any> {
    return this.http.post(environment.apiUrl + `/many/${collection}`, { ids }, this.httpOptions).toPromise()
  }

  async content(collection: string, id: string): Promise<ArrayBuffer> {
    let opts: any = JSON.parse(JSON.stringify(this.httpOptions))
    delete opts.headers
    opts.responseType = 'blob'
    return await this.http.get(environment.apiUrl + `/content/${collection}/${id}`, opts).toPromise()
  }

  async dirs(): Promise<any> {
    return this.http.get(environment.apiUrl + `/dirs`, this.httpOptions).toPromise()
  }
}
