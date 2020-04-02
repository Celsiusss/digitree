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
  stats: {[key: string]: string};
}

@Injectable({
  providedIn: 'root'
})
export class DigimonService {

  private data: Digimon[] = null;
  public ready = false;

  digimonData = new BehaviorSubject(this.data);

  informationHidden = false;

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

        const stats = jsonStats.find((statEntry: any) => statEntry.ID === entry.Name);

        return ({
          name: entry.Name,
          evolutions,
          devolutions,
          attribute: entry['Attribute'],
          combatSpeed: entry['Combat Speed'],
          energyCapacity: entry['Energy Capacity'],
          energyUsage: entry['Energy Usage Mod'],
          favoriteFood: entry['Favorite Food'],
          sleepingSchedule: entry['Sleeping Schedule'],
          specials,
          trainingGains: entry['Training Type'],
          evolutionListPos: entry['EvolutionList Pos'],
          level: entry['Level'],
          stats
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
