import { TabService } from './tab-service';
import { Injectable, NgZone } from '@angular/core';
import { mergeMap, Observable, switchMap } from 'rxjs';

export type Config = { [key: string]: any };

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  configKeys = ['isEnable', 'excludeHosts'];

  constructor(private zone: NgZone, private tabService: TabService) {}

  save$(config: Config): Observable<void> {
    return new Observable<void>((subscriber) => {
      chrome.storage.sync.set(config, () => {
        this.zone.run(() => {
          subscriber.next();
          subscriber.complete();
        });
      });
    });
  }

  load$(keys: string[]): Observable<Config> {
    return new Observable<Config>((subscriber) => {
      chrome.storage.sync.get(keys, (items) => {
        this.zone.run(() => {
          subscriber.next(items as Config);
          subscriber.complete();
        });
      });
    });
  }

  loadAllConfig$(): Observable<Config> {
    return this.load$(this.configKeys);
  }

  setIsEnable$(isEnable: boolean): Observable<void> {
    return this.save$({ isEnable });
  }

  addExcludeHost$(host: string): Observable<void> {
    return this.load$(['excludeHosts']).pipe(
      switchMap((config) => {
        const excludeHosts = config['excludeHosts'] ?? [];
        if (!excludeHosts.includes(host)) {
          excludeHosts.push(host);
        }
        return this.save$({ excludeHosts });
      }),
    );
  }

  removeExcludeHost$(host: string): Observable<void> {
    return this.load$(['excludeHosts']).pipe(
      switchMap((config) => {
        const excludeHosts = config['excludeHosts'] ?? [];
        const index = excludeHosts.indexOf(host);
        if (index > -1) {
          excludeHosts.splice(index, 1);
        }
        return this.save$({ excludeHosts });
      }),
    );
  }
}
