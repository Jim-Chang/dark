import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';

export type Config = { [key: string]: any };

@Injectable({
  providedIn: 'root',
})
export class TabService {
  constructor(private zone: NgZone) {}

  getActiveUrl$(): Observable<string | null> {
    return new Observable<string | null>((subscriber) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        this.zone.run(() => {
          if (tabs.length > 0) {
            subscriber.next(tabs[0].url);
          } else {
            subscriber.next(null);
          }
          subscriber.complete();
        });
      });
    });
  }

  notifyChangeToAllTab$(): Observable<void> {
    return new Observable<void>((subscriber) => {
      chrome.tabs.query({}, async (tabs) => {
        await Promise.all(
          tabs.filter((t) => t !== undefined).map((t) => chrome.tabs.sendMessage(t.id!, { configUpdate: true })),
        );
        this.zone.run(() => {
          subscriber.next();
          subscriber.complete();
        });
      });
    });
  }

  notifyChangeToCurrentTab$(): Observable<void> {
    return new Observable<void>((subscriber) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
        await Promise.all(
          tabs.filter((t) => t !== undefined).map((t) => chrome.tabs.sendMessage(t.id!, { configUpdate: true })),
        );
        this.zone.run(() => {
          subscriber.next();
          subscriber.complete();
        });
      });
    });
  }
}
