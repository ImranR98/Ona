import { Component, OnInit, OnDestroy, SecurityContext } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { ApiService } from '../services/api.service'
import { BehaviorSubject, Subscription } from 'rxjs'
import { ErrorService } from '../services/error.service'
import { environment } from 'src/environments/environment'
import { DomSanitizer } from '@angular/platform-browser'

@Component({
  selector: 'app-single-item',
  templateUrl: './single-item.component.html',
  styleUrls: ['./single-item.component.scss']
})
export class SingleItemComponent implements OnInit, OnDestroy {

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private apiService: ApiService, private errorService: ErrorService, private sanitizer: DomSanitizer) { }

  subs: Subscription[] = []
  collection
  itemID
  dateString = ''
  imageSrc: any = '//:0'

  itemSource = new BehaviorSubject(null)
  item = this.itemSource.asObservable()

  ngOnInit(): void {
    this.subs.push(this.activatedRoute.paramMap.subscribe(params => {
      this.collection = params.get('collection')
      this.itemID = params.get('item')
      if (!this.collection) {
        alert('Folder name not provided.')
        this.router.navigate(['/choice'])
      }
      if (!this.itemID) {
        alert('Item name not provided.')
        this.router.navigate([`/gallery/${this.collection}`])
      }
      this.apiService.single(this.collection, this.itemID).then(data => {
        this.itemSource.next(data)
      }).catch(err => {
        alert(this.errorService.stringifyError(err))
      })
    }))

    this.item.subscribe(item => {
      if (item) {
        let rawDate = item.DateTimeOriginal.rawValue
        let date = new Date(rawDate.replace(':', '-').replace(':', '-'))
        this.dateString = `${date.toDateString()} ${rawDate.split(' ')[1]}`
        this.apiService.content(this.collection, this.itemID).then((blob: any) => {
          var reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            this.imageSrc = this.sanitizer.bypassSecurityTrustUrl(`${reader.result}`)
          }
        })
      }
      console.log(item)
    })
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe())
  }

}
