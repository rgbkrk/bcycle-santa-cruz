import { interval, Subject } from "npm:rxjs";
import { takeUntil, startWith } from "npm:rxjs";

console.log("Collecting data...");

async function collectMore() {
  let station_status = await fetch(
    "https://gbfs.bcycle.com/bcycle_santacruz/station_status.json"
  ).then((x) => x.json());

  let station_information = await fetch(
    "https://gbfs.bcycle.com/bcycle_santacruz/station_information.json"
  ).then((x) => x.json());

  let stations = station_information.data.stations.map((station) => {
    return {
      ...station,
      ...station_status.data.stations.find(
        (x) => x.station_id == station.station_id
      ),
    };
  });

  await Deno.mkdir("data", { recursive: true });

  await Deno.writeTextFile(
    `data/stations-${station_status.last_updated}.json`,
    JSON.stringify(stations, null, 2)
  );
}

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
