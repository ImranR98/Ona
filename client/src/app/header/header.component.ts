import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {

  constructor(private authService: AuthService) { }

  isLoggedIn: boolean = false
  subs: Subscription[] = []

  logOut(): void {
    this.authService.logout(true)
  }

  ngOnInit(): void {
    this.subs.push(this.authService.isLoggedIn.subscribe(isLoggedIn => this.isLoggedIn = isLoggedIn))
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe())
  }
}
