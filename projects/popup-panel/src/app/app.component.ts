import { ConfigService } from '../service/config-service';
import { TabService } from '../service/tab-service';
import { Component } from '@angular/core';
import { filter, mergeMap } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass'],
})
export class AppComponent {
  isEnable = true;

  constructor(private configService: ConfigService, private tabService: TabService) {
    this.configService.loadAllConfig$().subscribe((ret) => {
      this.isEnable = ret['isEnable'] ?? true;
    });
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
}
