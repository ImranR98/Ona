import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ErrorService } from '../services/error.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss']
})
export class ConfigComponent implements OnInit {

  constructor(private authService: AuthService, private errorService: ErrorService, private apiService: ApiService) { }

  ignoredFiles = []
  invalidThumbnailFiles = []

  ngOnInit(): void {
    this.apiService.invalid().then(results => {
      this.ignoredFiles = results.filter(invalidFile => invalidFile.ignored)
      this.invalidThumbnailFiles = results.filter(invalidFile => !invalidFile.ignored)
      console.log(this.ignoredFiles)
    }).catch(err => {
      this.ignoredFiles = []
      this.invalidThumbnailFiles = []
      alert(this.errorService.stringifyError(err))
    })
  }

  passwordForm = new FormGroup({
    password: new FormControl('', Validators.required)
  })

  submit() {
    let password = this.passwordForm.controls['password'].value
    if (password.length > 15) {
      this.authService.newAuth(password).then(() => {
      }).catch(err => alert(this.errorService.stringifyError(err)))
    } else {
      alert('Password must be longer than 15 characters.')
    }
  }

  reset() {
    if (confirm('This is permanent - all app data will be deleted but your files will remain. The server will shut down and will need to be restarted manually. Continue?')) {
      this.authService.reset()
    }
  }

}
