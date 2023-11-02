# BCycle Data Collection

Santa Cruz rolled out a bikeshare service through BCycle. To my surprise and delight, I noticed they adhere to the [General Bikeshare Feed Specification](https://github.com/MobilityData/gbfs). You can find all the endpoints at https://gbfs.bcycle.com/bcycle_santacruz/gbfs.json.

I'm interested in finding out the changes in capacity over time for each station. Since the service is a near realtime feed, I can collect the data every 10 minutes and store it in this repository [using github actions](./.github/workflows/data-collection.yml). Once I've had this running long enough, I'll analyze the changes in capacity over time.

## Data

This repository contains scripts for collecting data from the Santa Cruz BCycle service. The data includes the status and information of each station, such as the number of bikes available, the number of docks available, and the location of the station.

* `mod.ts` - quick library to collect data from the BCycle API
* `collect-data.ts` - collects data from the BCycle API and stores it in `data/`

The data collection is done by the `collectMore()` function in the `mod.ts` file. This function fetches data from the station status and station information endpoints, merges the data on `station_id`, and writes the result to `data/stations-<last_updated_time>.json`, where `<last_updated_time>` is the last updated time from the station status data.

## Automation

The data collection process is automated with a GitHub Actions workflow (in `.github/workflows/data-collection.yml`) that runs every 10 minutes.

The workflow checks out the repository, sets up Deno, runs the data collection script, checks for changes, stages the changes, commits the changes, and pushes the changes back to the repository.

## Usage

To collect data manually, run the `collect-data.ts` file with Deno. Make sure to allow network access and write access with the `--allow-net` and `--allow-write` flags, respectively.

```bash
$ deno run --allow-net --allow-write collect-data.ts
```

To view the collected data, check the JSON files in the `data` directory.

## Contributing

Contributions are welcome. Please submit a pull request or create an issue if you have any suggestions or improvements.

I'm open to notebooks and data visualizations! I'd also love to store the data as parquet. JSON was a nice and easy "just automate collection now" approach.