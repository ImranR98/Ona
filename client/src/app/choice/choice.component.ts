import { Component, OnInit } from '@angular/core'
import { ApiService } from '../services/api.service'
import { FormGroup, FormControl, Validators } from '@angular/forms'

@Component({
  selector: 'app-choice',
  templateUrl: './choice.component.html',
  styleUrls: ['./choice.component.scss']
})
export class ChoiceComponent implements OnInit {

  constructor(private apiService: ApiService) { }

  addForm = new FormGroup({
    collection: new FormControl('', Validators.required),
    dir: new FormControl('', Validators.required)
  })

  dirs = []

  ngOnInit(): void {
    this.apiService.dirs().then(newDirs => this.dirs = newDirs).catch(err => alert(JSON.stringify(err)))
  }

  add() {
    this.apiService.add(this.addForm.controls['collection'].value, this.addForm.controls['dir'].value).then(() => {
      this.dirs.push({ collection: this.addForm.controls['collection'].value, dir: this.addForm.controls['dir'].value })
    }).catch(err => alert(err))
  }

  remove(collection: string) {
    if (confirm(`Remove ${collection}? The files will not be deleted.`))
    this.apiService.remove(collection).then(() => {
      this.dirs = this.dirs.filter(dir => dir.collection != collection)
    }).catch(err => console.log(JSON.stringify(err)))
  }

}
