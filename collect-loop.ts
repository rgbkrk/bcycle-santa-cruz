import { interval, Subject } from "npm:rxjs";
import { startWith, takeUntil } from "npm:rxjs";

import { collectMore } from "./mod.ts";

function main() {
  const INTERVAL_DURATION = 1000 * 60 * 5; // Every 5 minutes
  const stopInterval$ = new Subject<void>();

  interval(INTERVAL_DURATION)
    .pipe(
      // Start with 0 so that the first interval is immediate
      startWith(0),
      takeUntil(stopInterval$)
    )
    .subscribe(async () => {
      await collectMore();
      console.log("Data collected.");
    });

  addEventListener("SIGINT", () => {
    stopInterval$.next();
    stopInterval$.complete();
    console.log("Interval stopped.");
  });
}

main();
