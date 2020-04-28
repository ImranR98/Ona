import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ApiService } from '../services/api.service'
import { BehaviorSubject, Subscription } from 'rxjs'
import { ErrorService } from '../services/error.service'
import { FormGroup, FormControl } from '@angular/forms'

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit, OnDestroy {

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private apiService: ApiService, private errorService: ErrorService) { }

  sortForm = new FormGroup({
    sort: new FormControl(0)
  })

  collection

  maxPages = 0
  pageSize = 50
  sorts = ['Date (Desc.)', 'Date (Asc.)', 'Name (Desc.)', 'Name (Asc.)']

  subs: Subscription[] = []
  thumbnails = []

  listSource = new BehaviorSubject([])
  list = this.listSource.asObservable()

  pageSource = new BehaviorSubject(0)
  page = this.pageSource.asObservable()

  ngOnInit(): void {
    this.sortForm.controls['sort'].valueChanges.subscribe(selectedSort => {
      this.listSource.next(this.sortList(selectedSort, this.listSource.value))
    })

    this.subs.push(this.list.subscribe(list => {
      this.updateThumbnails()
    }))

    this.subs.push(this.page.subscribe(page => {
      this.updateThumbnails()
    }))

    this.subs.push(this.activatedRoute.paramMap.subscribe(params => {
      this.collection = params.get('collection')
      if (!this.collection) {
        alert('Folder name not provided.')
        this.router.navigate(['/choice'])
      } else {
        this.apiService.list(this.collection).then(data => {
          this.listSource.next(this.sortList(this.sortForm.controls['sort'].value, data))
        }).catch(err => {
          alert(this.errorService.stringifyError(err))
          this.router.navigate(['/choice'])
        })
      }
    }))
  }

  sortList(selectedSort: number, list) {
    if (list) {
      if (selectedSort == 0) return list.sort((a, b) => (b.DateTimeOriginal.rawValue).localeCompare(a.DateTimeOriginal.rawValue))
      if (selectedSort == 1) return list.sort((a, b) => (a.DateTimeOriginal.rawValue).localeCompare(b.DateTimeOriginal.rawValue))
      if (selectedSort == 2) return list.sort((a, b) => (b._id).localeCompare(a._id))
      if (selectedSort == 3) return list.sort((a, b) => (a._id).localeCompare(b._id))
    }
    return list
  }

  next() {
    if (this.pageSource.value < this.maxPages) this.pageSource.next(this.pageSource.value + 1)
  }

  prev() {
    if (this.pageSource.value > 0) this.pageSource.next(this.pageSource.value - 1)
  }

  toPage(num: number) {
    if (num <= this.maxPages && num >= 0) this.pageSource.next(num)
  }

  updateThumbnails() {
    this.maxPages = Math.ceil(this.listSource.value.length / this.pageSize)
    let startIndex = this.pageSource.value * this.pageSize
    let endIndex = startIndex + this.pageSize - 1
    let listMaxIndex = this.listSource.value.length - 1
    if (startIndex <= listMaxIndex) {
      if (endIndex > listMaxIndex) endIndex = listMaxIndex
      this.apiService.many(this.collection, this.listSource.value.map(el => el._id).slice(startIndex, endIndex + 1)).then(res => {
        this.thumbnails = res
      }).catch(err => alert(this.errorService.stringifyError(err)))
    }
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe())
  }
}
