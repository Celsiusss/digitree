import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import {HttpClient} from '@angular/common/http';
import {BehaviorSubject, forkJoin} from 'rxjs';

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

  constructor(private http: HttpClient) { }

  init() {
    const requests = [
      this.http.get('/assets/data.ods', {responseType: 'arraybuffer', observe: 'response'}),
      this.http.get('/assets/data_req_stats.csv', {responseType: 'arraybuffer', observe: 'response'}),
      this.http.get('/assets/names_list.json', {responseType: 'arraybuffer', observe: 'response'})
    ];

    forkJoin(requests).subscribe(responses => {
      const workbook = XLSX.read(responses[0].body, {type: 'array'});
      const sheetNum1 = 0;
      const sheetNum2 = 3;
      const sheet1 = workbook.Sheets[workbook.SheetNames[sheetNum1]];
      const sheet2 = workbook.Sheets[workbook.SheetNames[sheetNum2]];

      const json1: any[] = XLSX.utils.sheet_to_json(sheet1);
      const json2: any[] = XLSX.utils.sheet_to_json(sheet2);

      const json = json1.map((obj) => ({...obj, ...json2.find(entry => entry.Name === obj.Name)}));

      const workbook2 = XLSX.read(responses[1].body, {type: 'array'});
      const jsonStats: any = XLSX.utils.sheet_to_json(workbook2.Sheets.Sheet1);

      const jsonUnique = json.filter((entry, index, self) => self.findIndex(t => t.Name === entry.Name && t.name === entry.name) === index);

      const decoder = new TextDecoder('utf8');
      const namesToUse = decoder.decode(responses[2].body);


      this.data = jsonUnique.map((entry: any, i) => {
        const evolutions = [1, 2, 3, 4, 5, 6].map(evolution => entry[`Evolve To ${evolution}`]).filter(value => !!value);
        const devolutions = [1, 2, 3, 4, 5].map(evolution => entry[`Evolve From ${evolution}`]).filter(value => !!value);
        const specials = [1, 2, 3].map(special => entry[`Special ${special}`]).filter(value => value !== 'None');

        const name = entry.Name;

        const stats = jsonStats.find((statEntry: any) => statEntry.ID === name);

        const digiStats = stats ? Object.entries<string>(stats).map(statEntry => ({name: statEntry[0], value: statEntry[1]}))
          .filter(stat => stat.name !== 'ID' && stat.name !== 'HP_DIV10' && stat.name !== 'MP_DIV10' && stat.name !== 'TRIGGER')
          .map(stat => ({
            name: stat.name === 'EVOITEM' ? 'evolution item' : stat.name === 'CARE' ? 'care mistakes' : stat.name,
            value: stat.value === '^0' ? 'Highest' : stat.value
          }))
          .map(stat => {
            if (stat.name === 'REINCARNATION') {
              switch (name) {
                case 'Z\'dGarurumon':
                  stat.value = 'MetalGarurumon';
                  break;
                case 'VictoryGreymon':
                  stat.value = 'Dukemon';
                  break;
              }
            }
            if (stat.name === 'DIGIMEMORY') {
              switch (name) {
                case 'Paildramon':
                  stat.value = 'Stingmon with XV-mon digimemory / XV-mon with Stingmon digimemory';
                  break;
                case 'Chaosmon':
                  stat.value = 'BanchoLeomon with Darkdramon digimemory / Darkdramon with BanchoLeomon digimemory';
                  break;
                case 'Omegamon':
                  stat.value = 'MetalGarurumon with WarGreymon digimemory / WarGreymon with MetalGarurumon digimemory';
                  break;
              }
            }
            return stat;
          }) : [];

        return ({
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
          trainingGains: (entry['Training Type'] ? entry['Training Type'] : '')
            .replace(/ATK/g, 'Offence').replace(/DEF/g, 'Defence').replace(/BRN/g, 'Brain'),
          evolutionListPos: entry['EvolutionList Pos'],
          level: entry['Level'],
          stats: digiStats
        });
      })
        .filter(digimon => digimon.name !== 'NO DATA')
        .filter(digimon => namesToUse.includes(digimon.name));
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
