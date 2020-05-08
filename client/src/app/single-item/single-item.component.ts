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
export class SingleItemComponent implements OnInit {

  constructor(private router: Router, private apiService: ApiService, private errorService: ErrorService, private sanitizer: DomSanitizer, private dialogRef: MatDialogRef<SingleItemComponent>, @Inject(MAT_DIALOG_DATA) public data: { item: any, collection: string } | null, private dialog: MatDialog) { }

  subs: Subscription[] = []
  dateString = ''
  imageSrc: any = '//:0'
  item: any = null
  loading: boolean = false

  ngOnInit(): void {
    if (this.data) {
      if (!this.data.collection) {
        alert('Folder name not provided.')
        this.router.navigate(['/choice'])
      } else if (!this.data.item) {
        alert('Item not provided.')
        this.router.navigate([`/gallery/${this.data.collection}`])
      } else {
        this.item = this.data.item
        let rawDate = this.data.item.DateTimeOriginal.rawValue
        let date = new Date(rawDate.replace(':', '-').replace(':', '-'))
        this.dateString = `${date.toDateString()} ${rawDate.split(' ')[1]}`
        this.loading = true
        this.apiService.content(this.data.collection, this.data.item._id).then((blob: any) => {
          this.loading = false
          this.imageSrc = this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob))
        }).catch(err => {
          this.loading = false
          alert(this.errorService.stringifyError(err))
        })
      }
    } else {
      alert('Data not provided.')
      this.router.navigate([`/choice`])
    }
  }

  close() {
    this.dialogRef.close();
  }

}
