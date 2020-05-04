import { Component, OnInit, OnDestroy, SecurityContext, Inject } from '@angular/core'
import { Router } from '@angular/router'
import { ApiService } from '../services/api.service'
import { BehaviorSubject, Subscription } from 'rxjs'
import { ErrorService } from '../services/error.service'
import { DomSanitizer } from '@angular/platform-browser'
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog'

@Component({
  selector: 'app-single-item',
  templateUrl: './single-item.component.html',
  styleUrls: ['./single-item.component.scss']
})
export class SingleItemComponent implements OnInit, OnDestroy {

  constructor(private router: Router, private apiService: ApiService, private errorService: ErrorService, private sanitizer: DomSanitizer, private dialogRef: MatDialogRef<SingleItemComponent>, @Inject(MAT_DIALOG_DATA) public data: { collection: string, _id: string, FileName: string } | null, private dialog: MatDialog) { }

  subs: Subscription[] = []
  dateString = ''
  imageSrc: any = '//:0'

  itemSource = new BehaviorSubject(null)
  item = this.itemSource.asObservable()

  ngOnInit(): void {
    if (this.data) {
      if (!this.data.collection) {
        alert('Folder name not provided.')
        this.router.navigate(['/choice'])
      }
      if (!this.data._id) {
        alert('Item name not provided.')
        this.router.navigate([`/gallery/${this.data.collection}`])
      }
      this.apiService.single(this.data.collection, this.data._id).then(data => {
        this.itemSource.next(data)
      }).catch(err => {
        alert(this.errorService.stringifyError(err))
      })
    } else {
      alert('Data not provided.')
      this.router.navigate([`/choice`])
    }

    this.item.subscribe(item => {
      if (item) {
        let rawDate = item.DateTimeOriginal.rawValue
        let date = new Date(rawDate.replace(':', '-').replace(':', '-'))
        this.dateString = `${date.toDateString()} ${rawDate.split(' ')[1]}`
        this.apiService.content(this.data.collection, this.data._id).then((blob: any) => {
          this.imageSrc = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob))
        })
      }
    })
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe())
  }

  close() {
    this.dialogRef.close();
  }

}
