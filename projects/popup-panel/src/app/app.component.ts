import { Config, ConfigService } from '../service/config-service';
import { TabService } from '../service/tab-service';
import { Component, ElementRef, NgZone, ViewChild } from '@angular/core';
import { filter, map, mergeMap, Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent {
  @ViewChild('fileUpload') fileUpload: ElementRef<HTMLInputElement>;
  isEnable = true;

  showImportSuccess = false;
  showImportFail = false;

  constructor(private configService: ConfigService, private tabService: TabService, private zone: NgZone) {
    this.loadIsEnableFromCfg();
  }

  onChangeIsEnable(): void {
    this.configService
      .setIsEnable$(this.isEnable)
      .pipe(mergeMap(() => this.tabService.notifyChangeToAllTab$()))
      .subscribe();
  }

  onClickAddToExcludeBtn(): void {
    this.tabService
      .getActiveUrl$()
      .pipe(
        filter((url) => !!url),
        mergeMap((url) => {
          const host = new URL(url as string).host;
          return this.configService.addExcludeHost$(host);
        }),
        mergeMap(() => this.tabService.notifyChangeToCurrentTab$()),
      )
      .subscribe();
  }

  onClickRemoveFromExcludeBtn(): void {
    this.tabService
      .getActiveUrl$()
      .pipe(
        filter((url) => !!url),
        mergeMap((url) => {
          const host = new URL(url as string).host;
          return this.configService.removeExcludeHost$(host);
        }),
        mergeMap(() => this.tabService.notifyChangeToCurrentTab$()),
      )
      .subscribe();
  }

  onClickExportCfgBtn(): void {
    this.configService.loadAllConfig$().subscribe((ret) => {
      const blob = new Blob([JSON.stringify(ret)], { type: 'text/json' });
      const url = URL.createObjectURL(blob);
      chrome.downloads.download({ url, filename: 'dark.config.json' });
    });
  }

  onClickImportCfgBtn(): void {
    this.showImportSuccess = false;
    this.showImportFail = false;

    this.fileUpload.nativeElement.click();
  }

  onFileInputChange(event: Event): void {
    if (!event.target) {
      this.showImportFail = true;
      return;
    }
    const target = event.target as HTMLInputElement;
    if (!target.files) {
      this.showImportFail = true;
      return;
    }

    const file = target.files[0];

    this.loadCfgFromFile$(file)
      .pipe(
        switchMap((ret) => {
          if (ret) {
            const fileCfgKeys = Object.keys(ret).sort();
            const cfgKeys = this.configService.configKeys.sort();

            if (fileCfgKeys.length === cfgKeys.length && fileCfgKeys.every((v, i) => v === cfgKeys[i])) {
              return this.configService.save$(ret as Config).pipe(map(() => true));
            }
          }

          return of(false);
        }),
      )
      .subscribe((ret) => {
        if (ret) {
          this.showImportSuccess = true;
          this.loadIsEnableFromCfg();
        } else {
          this.showImportFail = true;
        }
      });
  }

  private loadCfgFromFile$(file: File): Observable<any> {
    return new Observable<any>((subscriber) => {
      let fileReader = new FileReader();
      fileReader.onload = (e) => {
        this.zone.run(() => {
          const ret = fileReader.result as string;
          if (ret) {
            try {
              return subscriber.next(JSON.parse(ret));
            } catch (e) {
              console.error(e);
            }
          }
          subscriber.next(null);
        });
      };
      fileReader.readAsText(file);
    });
  }

  private loadIsEnableFromCfg(): void {
    this.configService.loadAllConfig$().subscribe((ret) => {
      this.isEnable = ret['isEnable'] ?? true;
    });
  }
}
