import { Component, OnInit } from '@angular/core';
import { DigimonService } from './digimon.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(public digimonService: DigimonService) {}

  ngOnInit(): void {
    this.digimonService.init();
  }
}
