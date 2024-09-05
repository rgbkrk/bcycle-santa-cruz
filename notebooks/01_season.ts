// %%
import pl from "npm:nodejs-polars";
import Plot from "https://deno.land/x/plot/mod.ts";

let bcycle_df = await pl.readParquet("../bcycle_data_combined.parquet");

// %%
// Extract various time components
bcycle_df = bcycle_df.withColumns([
  pl.col("last_reported").date.month().alias("month"),
  pl.col("last_reported").date.weekday().alias("day_of_week"),
  pl.col("last_reported").date.hour().alias("hour"),
]);

// %%
// Monthly trends
const monthly_avg = bcycle_df
  .groupBy("month")
  .agg(
    pl.col("num_bikes_available").mean().alias("avg_bikes"),
    pl.col("num_docks_available").mean().alias("avg_docks"),
  )
  .sort("month")
  .toRecords();
Plot.plot({
  marks: [
    Plot.line(monthly_avg, {
      x: "month",
      y: "avg_bikes",
      stroke: "blue",
      strokeWidth: 2,
    }),
    Plot.line(monthly_avg, {
      x: "month",
      y: "avg_docks",
      stroke: "red",
      strokeWidth: 2,
    }),
  ],
  x: { label: "Month", domain: [1, 12], tickFormat: "d" },
  y: { label: "Average Count" },
  color: {
    domain: ["Bikes", "Docks"],
    range: ["blue", "red"],
  },
  title: "Monthly Trends of Bike and Dock Availability",
});
// %%
// Day of week patterns
const dow_avg = bcycle_df
  .groupBy("day_of_week")
  .agg(
    pl.col("num_bikes_available").mean().alias("avg_bikes"),
    pl.col("num_docks_available").mean().alias("avg_docks"),
  )
  .sort("day_of_week")
  .toRecords();

Plot.plot({
  marks: [
    Plot.line(dow_avg, {
      x: "day_of_week",
      y: "avg_bikes",
      stroke: "blue",
      strokeWidth: 2,
    }),
    Plot.line(dow_avg, {
      x: "day_of_week",
      y: "avg_docks",
      stroke: "red",
      strokeWidth: 2,
    }),
  ],
  x: {
    label: "Day of Week",
    domain: [0, 6],
    tickFormat: (d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d],
  },
  y: { label: "Average Count" },
  color: {
    domain: ["Bikes", "Docks"],
    range: ["blue", "red"],
  },
  title: "Day of Week Patterns of Bike and Dock Availability",
});

// %%
// Hourly patterns
const hourly_avg = bcycle_df
  .groupBy("hour")
  .agg(
    pl.col("num_bikes_available").mean().alias("avg_bikes"),
    pl.col("num_docks_available").mean().alias("avg_docks"),
  )
  .sort("hour")
  .toRecords();

Plot.plot({
  marks: [
    Plot.line(hourly_avg, {
      x: "hour",
      y: "avg_bikes",
      stroke: "blue",
      strokeWidth: 2,
    }),
    Plot.line(hourly_avg, {
      x: "hour",
      y: "avg_docks",
      stroke: "red",
      strokeWidth: 2,
    }),
  ],
  x: { label: "Hour of Day", domain: [0, 23], tickFormat: "d" },
  y: { label: "Average Count" },
  color: {
    domain: ["Bikes", "Docks"],
    range: ["blue", "red"],
  },
  title: "Hourly Patterns of Bike and Dock Availability",
});

// %%
// Academic calendar effects (assuming Fall semester starts in September and ends in December)
const academic_avg = bcycle_df
  .withColumn(
    pl
      .when(pl.col("month").isIn([9, 10, 11, 12]))
      .then(pl.lit("Fall Semester"))
      .when(pl.col("month").isIn([1, 2, 3, 4, 5]))
      .then(pl.lit("Spring Semester"))
      .otherwise(pl.lit("Summer"))
      .alias("academic_period"),
  )
  .groupBy("academic_period")
  .agg(
    pl.col("num_bikes_available").mean().alias("avg_bikes"),
    pl.col("num_docks_available").mean().alias("avg_docks"),
  )
  .toRecords();

Plot.plot({
  marks: [
    Plot.barY(academic_avg, {
      x: "academic_period",
      y: "avg_bikes",
      fill: "blue",
    }),
    Plot.barY(academic_avg, {
      x: "academic_period",
      y: "avg_docks",
      fill: "red",
    }),
  ],
  x: { label: "Academic Period" },
  y: { label: "Average Count" },
  color: {
    domain: ["Bikes", "Docks"],
    range: ["blue", "red"],
  },
  title: "Bike and Dock Availability by Academic Period",
});
