import { Component, OnInit, AfterViewInit } from '@angular/core'
import { ApiService } from '../services/api.service'
import { FormGroup, FormControl, Validators } from '@angular/forms'
import { ErrorService } from '../services/error.service'
import { BehaviorSubject } from 'rxjs'
import { HttpClient } from '@angular/common/http'

@Component({
  selector: 'app-choice',
  templateUrl: './choice.component.html',
  styleUrls: ['./choice.component.scss']
})
export class ChoiceComponent implements OnInit {

  constructor(private apiService: ApiService, private errorService: ErrorService) { }

  addForm = new FormGroup({
    collection: new FormControl('', Validators.required),
    dir: new FormControl('', Validators.required)
  })

  dirs = []

  getDirs() {
    this.apiService.dirs().then(newDirs => this.dirs = newDirs).catch(err => alert(this.errorService.stringifyError(err)))
  }

  ngOnInit(): void {
    this.getDirs()
    setInterval(() => {
      this.getDirs()
    }, 5000)
  }

  add() {
    this.apiService.add(this.addForm.controls['collection'].value, this.addForm.controls['dir'].value).then(() => {
      this.getDirs()
      this.addForm.reset()
    }).catch(err => alert(this.errorService.stringifyError(err)))
  }

  remove(collection: string) {
    if (confirm(`Remove ${collection}? The files will not be deleted.`))
      this.apiService.remove(collection).then(() => {
        this.getDirs()
      }).catch(err => alert(this.errorService.stringifyError(err)))
  }

}
