import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';

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
  });

  dirs = []

  ngOnInit(): void {
    this.apiService.dirs().then(newDirs => this.dirs = newDirs).catch(err => alert(err.toString()))
  }

  add() {
    this.apiService.add(this.addForm.controls['collection'].value, this.addForm.controls['dir'].value).then(() => {
      this.dirs.push({ collection: this.addForm.controls['collection'].value, dir: this.addForm.controls['dir'].value })
    }).catch(err => alert(err))
  }

}
