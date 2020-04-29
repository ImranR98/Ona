import { Component, OnInit } from '@angular/core'
import { AuthService } from '../services/auth.service'
import { Router } from '@angular/router'
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { ErrorService } from '../services/error.service'

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  constructor(private authService: AuthService, private router: Router, private errorService: ErrorService) { }

  passwordForm = new FormGroup({
    password: new FormControl('', Validators.required)
  })

  isFirstTime: boolean = true

  ngOnInit(): void {
    if (this.authService.ifLoggedIn(false)) this.router.navigate(['/choice'])
    this.authService.isFirstTime().then(res => {
      this.isFirstTime = res
    }).catch(err => alert(this.errorService.stringifyError(err)))
  }

  submit() {
    let password = this.passwordForm.controls['password'].value
    if (this.isFirstTime) {
      if (password.length > 15) {
        this.authService.setup(password).then(() => {
          this.isFirstTime = false
          this.passwordForm.reset()
        }).catch(err => alert(this.errorService.stringifyError(err)))
      } else {
        alert('Password must be longer than 15 characters.')
      }
    } else {
      this.authService.auth(password).then(() => {
        this.isFirstTime = false
        this.router.navigate(['/choice'])
      }).catch(err => {
        alert(this.errorService.stringifyError(err))
      })
    }
  }
}
