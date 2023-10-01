import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { parse } from 'csv-parse/browser/esm/sync';
import { environment } from 'src/environments/environment';

export interface Digimon {
  name: string;
  evolutions: string[];
  devolutions: string[];
  attribute: string;
  combatSpeed: string;
  energyCapacity: string;
  energyUsage: string;
  favoriteFood: string;
  sleepingSchedule: string;
  specials: string[];
  trainingGains: string;
  evolutionListPos: string;
  level: string;
  stats: {
    name: string;
    value: string;
  }[];
  gains: {
    name: string;
    value: string;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class DigimonService {
  private data: Digimon[] = null;
  public ready = false;

  digimonData = new BehaviorSubject(this.data);

  informationHidden = false;
  showEvolutions = true;
  showDevolutions = false;

  currentTreeLevel = 1;

  constructor(private http: HttpClient) {}

  init() {
    const requests = [
      this.http.get(`/assets/${environment.fileNames.data}`, {
        responseType: 'text',
        observe: 'response'
      }),
      this.http.get(`/assets/${environment.fileNames.stats}`, {
        responseType: 'text',
        observe: 'response'
      }),
      this.http.get(`/assets/${environment.fileNames.evoItems}`, {
        responseType: 'text',
        observe: 'response'
      })
    ];

    forkJoin(requests).subscribe(responses => {
      const digimons: Record<string, string>[] = parse(responses[0].body, {
        columns: true,
        skip_empty_lines: true
      });

      const digimonsStats: Record<string, string>[] = parse(responses[1].body, {
        columns: true,
        skip_empty_lines: true
      });

      const evolutionItems: { 'Item Name': string; Evolution: string }[] =
        parse(responses[2].body, {
          columns: true,
          skip_empty_lines: true
        });

      const digimonsFiltered = digimons.filter(
        (entry, index, self) =>
          self.findIndex(
            t => t.Name === entry.Name && t.name === entry.name
          ) === index
      );

      this.data = digimonsFiltered
        .map((entry): Digimon => {
          const evolutions = [1, 2, 3, 4, 5, 6]
            .map(evolution => entry[`Evolve To ${evolution}`])
            .filter(value => !!value);
          const devolutions = [1, 2, 3, 4, 5]
            .map(evolution => entry[`Evolve From ${evolution}`])
            .filter(value => !!value);
          const specials = [1, 2, 3]
            .map(special => entry[`Special ${special}`])
            .filter(value => value !== 'None');

          const name = entry.Name;

          const stats = digimonsStats.find(statEntry => statEntry.ID === name);
          const digiStats = stats
            ? Object.entries<string>(stats)
                .map(([name, value]) => ({ name, value }))
                .filter(stat => stat.name !== 'Evolution Item')
                .map(stat => ({
                  name: stat.name === 'Care' ? 'Care Mistakes' : stat.name,
                  value: stat.value === '^0' ? 'Highest' : stat.value
                }))
            : [];
          digiStats.push({
            name: 'Evolution Item',
            value: evolutionItems.find(({ Evolution }) => Evolution == name)?.[
              'Item Name'
            ]
          });

          const gains = Object.entries(entry)
            .filter(([name, _]) => name.startsWith('Gain'))
            .map(([name, value]) => ({
              name,
              value
            }));

          return {
            name,
            evolutions,
            devolutions,
            attribute: entry['Attribute'],
            combatSpeed: entry['Combat Speed'],
            energyCapacity: entry['Energy Capacity'],
            energyUsage: entry['Energy Usage Mod'],
            favoriteFood: entry['Favorite Food'],
            sleepingSchedule: entry['Sleeping Schedule'],
            specials,
            trainingGains: (entry['Training Type']
              ? entry['Training Type']
              : ''
            )
              .replace(/ATK/g, 'Offence')
              .replace(/DEF/g, 'Defence')
              .replace(/BRN/g, 'Brain'),
            evolutionListPos: entry['EvolutionList Pos'],
            level: entry['Level'],
            stats: digiStats,
            gains
          };
        })
        .filter(digimon => digimon.name !== 'NO DATA');
      this.digimonData.next(this.data);
      this.ready = true;
    });
  }

  getEvolutionTree(name: string, levels = this.currentTreeLevel) {
    if (levels <= 0) {
      return [];
    }
    const digimon = this.getDigimon(name);
    if (!digimon) {
      return [];
    }
    return digimon.evolutions.map(evolution => ({
      name: evolution,
      evolutions: this.getEvolutionTree(evolution, levels - 1)
    }));
  }

  getDevolutionTree(name: string, levels = this.currentTreeLevel) {
    if (levels <= 0) {
      return [];
    }
    const digimon = this.getDigimon(name);
    if (!digimon) {
      return [];
    }
    return digimon.devolutions.map(evolution => ({
      name: evolution,
      devolutions: this.getDevolutionTree(evolution, levels - 1)
    }));
  }

  getDigimon(name: string) {
    return this.data.find(value => value.name === name);
  }
}
