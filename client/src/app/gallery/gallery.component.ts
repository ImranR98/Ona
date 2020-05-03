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

  loading = false

  collection
  loadAtATime = 50

  subs: Subscription[] = []
  thumbnails = []

  listSource = new BehaviorSubject([])
  list = this.listSource.asObservable()

  ngOnInit(): void {
    this.subs.push(this.list.subscribe(list => {
      this.thumbnails = []
      this.updateThumbnails(100)
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
          this.listSource.next(this.sortList(0, data))
        }).catch(err => {
          alert(this.errorService.stringifyError(err))
          this.router.navigate(['/choice'])
        })
      }
    }))
  }

  onScroll() {
    this.updateThumbnails()
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
      if (selectedSort == 2) list = list.sort((a, b) => (b._id).localeCompare(a._id))
      if (selectedSort == 3) list = list.sort((a, b) => (a._id).localeCompare(b._id))
    }
    return list
  }

  updateThumbnails(num: number = this.loadAtATime) {
    let startIndex = this.thumbnails.length == 0 ? 0 : this.thumbnails.length - 1
    let endIndex = this.listSource.value.length - 1 > startIndex + num - 1 ? startIndex + num - 1 : this.listSource.value.length
    if (startIndex != endIndex && !this.loading) {
      for (let i = startIndex; i <= endIndex; i++) {
        this.apiService.single(this.collection, this.listSource.value[i]._id).then(res => this.thumbnails[i] = res).catch(err => console.log(err))
      }
    }
  }

  ngOnDestroy() {
    this.subs.forEach(sub => sub.unsubscribe())
  }
}

/*
TODO:
- Try making single item viewing part of the same component, so that thumbnails don't need to be reloaded after viewing every single item.
*/