import { Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Observable, filter, map, startWith, take } from 'rxjs';
import { DigimonService } from '../digimon.service';
import { Router } from '@angular/router';

interface DigimonGroup {
  group: string;
  names: string[];
}

@Component({
  selector: 'app-searchbox',
  templateUrl: './searchbox.component.html',
  styleUrls: ['./searchbox.component.scss']
})
export class SearchboxComponent implements OnInit {
  digimonControl = new UntypedFormControl();
  filteredDigimonNames: Observable<DigimonGroup[]>;

  digimonNames: DigimonGroup[] = [];

  constructor(private digimonService: DigimonService, private router: Router) {}

  ngOnInit() {
    this.filteredDigimonNames = this.digimonControl.valueChanges.pipe(
      startWith(''),
      map(name => this._filter(name))
    );

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
        // const groups = new Set(digimons.map(d => d.level));

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
      this.clearSearch();
    }
  }

  private _filter(value: string): DigimonGroup[] {
    const filterValue = value.toLowerCase();

    return this.digimonNames.map(digiGroup => ({
      group: digiGroup.group,
      names: digiGroup.names.filter(name =>
        name.toLowerCase().includes(filterValue)
      )
    }));
  }

  clearSearch() {
    this.digimonControl.setValue('');
  }
}
