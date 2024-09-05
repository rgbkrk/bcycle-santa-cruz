// %%
import pl from "npm:nodejs-polars";
import Plot from "https://deno.land/x/plot/mod.ts";
let bcycle_df = await pl.readParquet("../bcycle_data_combined.parquet");
bcycle_df.sample(3);

// %%
// Display DataFrame info
console.log(bcycle_df.schema);
console.log(`Number of rows: ${bcycle_df.height}`);
console.log(`Number of columns: ${bcycle_df.width}`);

// %%
// Display summary statistics
bcycle_df.describe().toString();

// %%
// Check for missing values
bcycle_df.nullCount().toString();

// %%
// Distribution of the number of bikes available
const bikes_available_data = bcycle_df
  .select("num_bikes_available")
  .toRecords();

Plot.plot({
  marks: [
    Plot.rectY(
      bikes_available_data,
      Plot.binX({ y: "count" }, { x: "num_bikes_available" }),
    ),
    Plot.lineY(
      bikes_available_data,
      Plot.binX({ y: "count" }, { x: "num_bikes_available", curve: "basis" }),
    ),
  ],
  x: { label: "Number of Bikes Available" },
  y: { label: "Frequency" },
  title: "Distribution of Number of Bikes Available",
});

// %%
// Distribution of the number of docks available
const docks_available_data = bcycle_df
  .select("num_docks_available")
  .toRecords();

Plot.plot({
  marks: [
    Plot.rectY(
      docks_available_data,
      Plot.binX({ y: "count" }, { x: "num_docks_available" }),
    ),
    Plot.lineY(
      docks_available_data,
      Plot.binX({ y: "count" }, { x: "num_docks_available", curve: "basis" }),
    ),
  ],
  x: { label: "Number of Docks Available" },
  y: { label: "Frequency" },
  title: "Distribution of Number of Docks Available",
});
// %%
// Note for self
// bcycle_df.filter(pl.col("station_id").eq("bcycle_santacruz_7431")) // Must wrap in `pl.lit`
// bcycle_df.filter(pl.col("station_id").eq(pl.lit("bcycle_santacruz_7431")));

// %%
// Number of bikes available over time for a specific station
const station_id = pl.lit("bcycle_santacruz_7431");
const station_data = bcycle_df
  .filter(pl.col("station_id").eq(station_id))
  .select(["last_reported", "num_bikes_available"])
  .toRecords();

Plot.plot({
  marks: [
    Plot.line(station_data, { x: "last_reported", y: "num_bikes_available" }),
  ],
  x: { label: "Time", tickRotate: 45 },
  y: { label: "Number of Bikes Available" },
  title: `Number of Bikes Available Over Time for Station ID: ${station_id}`,
});

// %%
// Number of docks available over time for a specific station
Plot.plot({
  marks: [
    Plot.line(station_data, { x: "last_reported", y: "num_docks_available" }),
  ],
  x: { label: "Time", tickRotate: 45 },
  y: { label: "Number of Docks Available" },
  title: `Number of Docks Available Over Time for Station ID: ${station_id}`,
});

// %%
// Average number of bikes available per station
const avg_bikes_per_station = bcycle_df
  .groupBy("station_id")
  .agg(pl.col("num_bikes_available").mean().alias("avg_bikes"))
  .sort("avg_bikes", false)
  .toRecords();

Plot.plot({
  marks: [
    Plot.barX(avg_bikes_per_station, { x: "avg_bikes", y: "station_id" }),
  ],
  x: { label: "Average Number of Bikes Available" },
  y: { label: "Station ID" },
  title: "Average Number of Bikes Available per Station",
});

// %%
// Average number of docks available per station
const avg_docks_per_station = bcycle_df
  .groupBy("station_id")
  .agg(pl.col("num_docks_available").mean().alias("avg_docks"))
  .sort("avg_docks", false)
  .toRecords();

Plot.plot({
  marks: [
    Plot.barX(avg_docks_per_station, { x: "avg_docks", y: "station_id" }),
  ],
  x: { label: "Average Number of Docks Available" },
  y: { label: "Station ID" },
  title: "Average Number of Docks Available per Station",
});
// %%
// %%

// %%
console.log(bcycle_df.schema.last_reported);
console.log(bcycle_df.select("last_reported").head(5).toString());
// %%
let dtCol = pl.col("last_reported").date;
bcycle_df.select(dtCol.weekday().as("weekday"));
o;

// %%
import pl from "npm:nodejs-polars";
import Plot from "https://deno.land/x/plot/mod.ts";

// Convert last_reported to datetime and extract hour
const df_with_hour = bcycle_df.withColumn(
  pl
    .col("last_reported")
    .str.strptime(pl.Datetime, "%Y-%m-%d %H:%M:%S")
    .dt.hour()
    .alias("hour"),
);

// Calculate average bikes available for each station and hour
const heatmap_data = df_with_hour
  .groupBy(["station_id", "hour"])
  .agg(pl.col("num_bikes_available").mean().alias("avg_bikes"))
  .sort(["station_id", "hour"])
  .toRecords();

// Create the heatmap
Plot.plot({
  color: {
    scheme: "viridis",
    label: "Avg. Bikes Available",
  },
  marks: [
    Plot.cell(heatmap_data, {
      x: "hour",
      y: "station_id",
      fill: "avg_bikes",
    }),
  ],
  x: {
    label: "Hour of Day",
    tickFormat: "d",
    domain: [0, 23],
  },
  y: {
    label: "Station ID",
  },
  width: 800,
  height: 400,
  marginLeft: 150,
  title: "Average Number of Bikes Available by Station and Hour",
});
