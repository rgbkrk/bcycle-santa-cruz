import { interval, Subject } from "npm:rxjs";
import { startWith, takeUntil } from "npm:rxjs";

console.log("Collecting data...");

type StationStatus = {
  station_id: string;
  num_bikes_available: number;
  num_docks_available: number;
  is_installed: number;
  is_renting: number;
  is_returning: number;
  last_reported: number;
};

type StationInfo = {
  station_id: string;
  lat: number;
  lon: number;
};

type StationPayload = {
  data: {
    stations: StationStatus[] | StationInfo[];
  };
  last_updated: number;
};

function isStationPayload(x: unknown): x is StationPayload {
  return (
    x != null && typeof x == "object" && "data" in x && "last_updated" in x
  );
}

// function isStationStatus(x: unknown): x is StationStatus {
//   return (
//     typeof x == "object" &&
//     "station_id" in x &&
//     "num_bikes_available" in x &&
//     "num_docks_available" in x &&
//     "is_installed" in x &&
//     "is_renting" in x &&
//     "is_returning" in x &&
//     "last_reported" in x
//   );
// }

// function isStationInfo(x: unknown): x is StationInfo {
//   return typeof x == "object" && "station_id" in x && "lat" in x && "lon" in x;
// }

async function collectMore() {
  const station_status = await fetch(
    "https://gbfs.bcycle.com/bcycle_santacruz/station_status.json"
  ).then((x) => x.json());

  const station_information = await fetch(
    "https://gbfs.bcycle.com/bcycle_santacruz/station_information.json"
  ).then((x) => x.json());

  if (
    !isStationPayload(station_status) ||
    !isStationPayload(station_information)
  ) {
    throw new Error("Failed to fetch data.");
  }

  const stations = station_information.data.stations.map((station) => {
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

// function main() {
//   const INTERVAL_DURATION = 1000 * 60 * 5; // Every 5 minutes
//   const stopInterval$ = new Subject<void>();

//   interval(INTERVAL_DURATION)
//     .pipe(
//       // Start with 0 so that the first interval is immediate
//       startWith(0),
//       takeUntil(stopInterval$)
//     )
//     .subscribe(async () => {
//       await collectMore();
//       console.log("Data collected.");
//     });

//   addEventListener("SIGINT", () => {
//     stopInterval$.next();
//     stopInterval$.complete();
//     console.log("Interval stopped.");
//   });
// }

// main();

await collectMore();