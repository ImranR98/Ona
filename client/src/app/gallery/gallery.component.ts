import { Component, OnInit, OnDestroy } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ApiService } from '../services/api.service'
import { BehaviorSubject, Subscription } from 'rxjs'
import { ErrorService } from '../services/error.service'
import { FormGroup, FormControl } from '@angular/forms'
import { MatSliderChange } from '@angular/material/slider'
import { MatDialog } from '@angular/material/dialog'
import { SingleItemComponent } from '../single-item/single-item.component'

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit, OnDestroy {

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private apiService: ApiService, private errorService: ErrorService, private dialog: MatDialog) { }

  loading = false

  collection
  loadAtATime = 100

  pageNo = 1
  maxPages = 1

  subs: Subscription[] = []
  thumbnails = []
  sorts = ['Date (Desc.)', 'Date (Asc.)', 'Name (Desc.)', 'Name (Asc.)']

  sortForm = new FormGroup({
    sort: new FormControl('0')
  })

  listSource = new BehaviorSubject([])
  list = this.listSource.asObservable()

  ignoredListSource = new BehaviorSubject([])
  ignoredList = this.ignoredListSource.asObservable()

  grabFromIndexSource = new BehaviorSubject(0)
  grabFromIndex = this.grabFromIndexSource.asObservable()

  ngOnInit(): void {
    this.subs.push(this.list.subscribe(list => {
      this.maxPages = Math.ceil(list.length / this.loadAtATime)
      this.thumbnails = []
      this.toPage(1)
    }))

    this.sortForm.controls['sort'].valueChanges.subscribe(selectedSort => {
      this.listSource.next(this.sortList(selectedSort, this.listSource.value))
    })

    this.subs.push(this.grabFromIndex.subscribe(index => {
      this.grabThumbnails()
    }))

    this.subs.push(this.activatedRoute.paramMap.subscribe(params => {
      this.collection = params.get('collection')
      if (!this.collection) {
        alert('Folder name not provided.')
        this.router.navigate(['/choice'])
      } else {
        this.loading = true
        this.apiService.list(this.collection).then(data => {
          this.loading = false
          this.listSource.next(this.sortList(this.sortForm.controls['sort'].value, data.filter(item => !item.ignored)))
          this.ignoredListSource.next(data.filter(item => item.ignored))
        }).catch(err => {
          alert(this.errorService.stringifyError(err))
          this.router.navigate(['/choice'])
        })
      }
    }))
  }

  sliderChanged(e: MatSliderChange) {
    this.toPage(e.value)
  }

  nextPage() {
    this.toPage(++this.pageNo)
  }

  prevPage() {
    this.toPage(--this.pageNo)
  }

  toPage(num: number) {
    if (((num - 1) * this.loadAtATime <= this.listSource.value.length - 1) && ((num - 1) * this.loadAtATime >= 0)) {
      this.grabFromIndexSource.next((num - 1) * this.loadAtATime)
    }
  }

  sortList(selectedSort: number, list) {
    list = list.filter(item => {
      if (!item.DateTimeOriginal) {
        return false
      }
      return true
    })
    if (list) {
      if (selectedSort == 0) list = list.sort((a, b) => (b.DateTimeOriginal.rawValue).localeCompare(a.DateTimeOriginal.rawValue))
      if (selectedSort == 1) list = list.sort((a, b) => (a.DateTimeOriginal.rawValue).localeCompare(b.DateTimeOriginal.rawValue))
      if (selectedSort == 2) list = list.sort((a, b) => (b.FileName).localeCompare(a.FileName))
      if (selectedSort == 3) list = list.sort((a, b) => (a.FileName).localeCompare(b.FileName))
    }
    return list
  }

  async grabThumbnails() {
    if (this.collection) {
      let endOfList = (this.listSource.value.length - 1 > 0 ? this.listSource.value.length - 1 : 0)
      let endIndex = this.grabFromIndexSource.value + this.loadAtATime - 1 < endOfList ? this.grabFromIndexSource.value + this.loadAtATime - 1 : endOfList
      this.loading = true
      try {
        this.thumbnails = this.sortList(this.sortForm.controls['sort'].value, await this.apiService.many(this.collection, this.listSource.value.filter((item, index) => index >= this.grabFromIndexSource.value && index <= endIndex).map(item => item._id)))
      } catch (err) {
        alert(this.errorService.stringifyError(err))
      }
      this.loading = false
    }
  }

  openItem(id, FileName) {
    if (!this.loading) {
      this.dialog.open(SingleItemComponent, {
        data: {
          collection: this.collection,
          _id: id,
          FileName: FileName
        },
        maxHeight: '100vh',
        maxWidth: '100%'
      });
    }
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe())
  }
}