import { Component, OnInit } from '@angular/core';
import { DigimonService } from './digimon.service';
import { filter, map, startWith, take } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';

interface DigimonGroup {
  group: string;
  names: string[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  digimonNames: DigimonGroup[] = [];

  digimonControl = new UntypedFormControl();
  filteredDigimonNames: Observable<DigimonGroup[]>;

  constructor(public digimonService: DigimonService, private router: Router) {}

  ngOnInit(): void {
    this.digimonService.init();

    this.digimonService.digimonData
      .pipe(
        filter(val => !!val),
        take(1)
      )
      .subscribe(digimons => {
        const groups = digimons.reduce(
          (acc, curr) =>
            acc.includes(curr.level) ? acc : [...acc, curr.level],
          []
        );
        groups.push('X-Antibody');

        this.digimonNames = groups.map(digiGroup => ({
          group: digiGroup,
          names: digimons
            .filter(
              digimon =>
                (digimon.level === digiGroup &&
                  !digimon.name.endsWith('X-Antibody')) ||
                (digimon.name.endsWith('X-Antibody') &&
                  digiGroup === 'X-Antibody')
            )
            .map(digimon => digimon.name)
            .sort()
        }));

        this.filteredDigimonNames = this.digimonControl.valueChanges.pipe(
          startWith(''),
          map(name => this._filter(name))
        );
      });
  }

  goToDigimon(key: string) {
    if (key !== 'Enter') {
      return;
    }

    if (
      this.digimonNames.find(digiGroup =>
        digiGroup.names.includes(this.digimonControl.value)
      )
    ) {
      this.router.navigate(['/digimon', this.digimonControl.value]);
    }
  }

  private _filter(value: string): DigimonGroup[] {
    const filterValue = value.toLowerCase();

    return this.digimonNames.map(digiGroup => ({
      group: digiGroup.group,
      names: digiGroup.names.filter(
        name => name.toLowerCase().indexOf(filterValue) === 0
      )
    }));
  }
}
