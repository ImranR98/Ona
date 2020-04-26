import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss']
})
export class GalleryComponent implements OnInit, OnDestroy {

  constructor(private activatedRoute: ActivatedRoute, private router: Router, private apiService: ApiService) { }

  sub
  collection
  list = []

  ngOnInit(): void {
    this.sub = this.activatedRoute.paramMap.subscribe(params => {
      this.collection = params.get('collection');
      if (!this.collection) {
        alert('Folder name not provided.')
        this.router.navigate(['/choice'])
      } else {
        this.apiService.list(this.collection).then(data => {
          this.list = data
          console.log(this.list)
          console.log(this.list.length)
        }).catch(err => {
          alert(err.toString())
        })
      }
    });
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
