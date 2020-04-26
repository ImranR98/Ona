import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { environment } from 'src/environments/environment'
import { Observable } from 'rxjs'
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router'
import * as moment from 'moment'
import * as jwt_decode from 'jwt-decode'

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient, private router: Router) { }

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true //this is required so that Angular returns the Cookies received from the server. The server sends cookies in Set-Cookie header. Without this, Angular will ignore the Set-Cookie header
  }

  // Send a new password to /setup for first time setup (server rejects this if a password already exists)
  setup(password: string): Promise<any> {
    return this.http.post(environment.apiUrl + '/setup', { password }, this.httpOptions).toPromise()
  }

  // Attempt to change password (server rejects this if user is not logged in (JWT doesn't exist))
  newAuth(password: string): Promise<any> {
    return this.http.post(environment.apiUrl + '/newAuth', { password }, this.httpOptions).toPromise()
  }

  // Attempt to change password (server rejects this if user is not logged in (JWT doesn't exist))
  async isFirstTime(): Promise<boolean> {
    let result = await this.http.get(environment.apiUrl + '/isFirstTime', this.httpOptions).toPromise()
    return !!result
  }

  // Validate the password and get a JSON Web Token to authenticate future requests
  async auth(password: string): Promise<boolean> {
    let response: any = await this.http.post(environment.apiUrl + '/auth', { password }, this.httpOptions).toPromise()
    if (response.jwtToken) {
      localStorage.setItem('jwt_token', response.jwtToken)
      let tokenDecoded = jwt_decode(response.jwtToken)
      localStorage.setItem('jwt_token_decoded', JSON.stringify(tokenDecoded))
      return true
    } else {
      return false
    }
  }

  // Reset everything and shut down the server
  async reset(): Promise<any> {
    await this.http.post(environment.apiUrl + '/reset', {}, this.httpOptions).toPromise()
    this.logout(true)
  }

  // Used for HTTPInterceptor
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    return this.ifLoggedIn(true);
  }

  // Return true if a valid JWT exists and is not expired
  ifLoggedIn(redirect: boolean) {
    let valid: boolean = (moment().isBefore(this.getJWTExpiration()))
    if (!valid) {
      this.logout(redirect);
    }
    return valid;
  }

  // Clear the JWT and redirect to home page
  logout(redirect: boolean = true) {
    localStorage.removeItem('jwt_token');
    localStorage.removeItem("jwt_token_decoded");
    if (redirect) {
      this.router.navigate(['/auth']);
    }
  }

  // Get the time JWT expires
  getJWTExpiration() {
    if (JSON.parse(localStorage.getItem("jwt_token_decoded"))) {
      return moment.unix(JSON.parse(localStorage.getItem("jwt_token_decoded")).exp);
    } else {
      return null;
    }
  }
}
