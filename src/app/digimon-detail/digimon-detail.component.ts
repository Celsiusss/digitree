import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Digimon, DigimonService } from '../digimon.service';
import { filter, map, take } from 'rxjs/operators';

@Component({
  selector: 'app-digimon-detail',
  templateUrl: './digimon-detail.component.html',
  styleUrls: ['./digimon-detail.component.scss']
})
export class DigimonDetailComponent implements OnInit {
  digimon: Digimon;
  evolutionTree;
  devolutionTree;

  statsNames = [
    'HP',
    'MP',
    'OFFENSE',
    'DEFENSE',
    'SPEED',
    'BRAINS',
    'WEIGHT',
    'HAPPINESS',
    'DISCIPLINE',
    'BATTLES',
    'TECHS',
    'DECODE',
    'care mistakes',
    'DIGIMEMORY',
    'DIGIMON',
    'evolution item',
    'REINCARNATION',
    'QUOTA'
  ];

  constructor(
    private route: ActivatedRoute,
    public digimonService: DigimonService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.digimonService.digimonData
        .pipe(
          filter(value => !!value),
          take(1),
          map((list: Digimon[]) =>
            list.find(entry => entry.name === params.name)
          )
        )
        .subscribe(digimon => {
          this.digimon = digimon;
          this.evolutionTree = this.digimonService.getEvolutionTree(
            digimon.name
          );
          this.devolutionTree = this.digimonService.getDevolutionTree(
            digimon.name
          );
        });
    });
  }

  changeLevels(num: number) {
    this.digimonService.currentTreeLevel = num;
    this.evolutionTree = this.digimonService.getEvolutionTree(
      this.digimon.name
    );
    this.devolutionTree = this.digimonService.getDevolutionTree(
      this.digimon.name
    );
  }

  toggleInformation() {
    this.digimonService.informationHidden = !this.digimonService
      .informationHidden;
  }

  toggleEvolutions() {
    this.digimonService.showEvolutions = !this.digimonService.showEvolutions;
  }

  toggleDevolutions() {
    this.digimonService.showDevolutions = !this.digimonService.showDevolutions;
  }

  getStat(name: string) {
    const stat = this.digimon.stats.find(stat => stat.name === name);
    return stat ? stat.value : '';
  }
}
