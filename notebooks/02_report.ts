// %%
import pl from "npm:nodejs-polars";
import Plot from "https://deno.land/x/plot@0.0.3/mod.ts";

let bcycle_df = await pl.readParquet("../bcycle_data_combined.parquet");

// Extract various time components
bcycle_df = bcycle_df.withColumns(
  pl.col("last_reported").date.month().alias("month"),
  pl.col("last_reported").date.weekday().alias("day_of_week"),
  pl.col("last_reported").date.hour().alias("hour"),
);

// Function to create a plot and return its SVG
function createPlot(plotFunction: () => _Plot.Plot): _Plot.Plot {
  const plot = plotFunction();
  return plot;
  // return plot.plot();
}

// Monthly trends
const monthlyPlot = createPlot(() => {
  const monthly_avg = bcycle_df
    .groupBy("month")
    .agg(
      pl.col("num_bikes_available").mean().alias("avg_bikes"),
      pl.col("num_docks_available").mean().alias("avg_docks"),
    )
    .sort("month")
    .toRecords();
  return Plot.plot({
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
      Plot.text(monthly_avg, {
        x: 12,
        y: (d) => Math.max(d.avg_bikes, d.avg_docks),
        text: ["Bikes", "Docks"],
        fill: ["blue", "red"],
        dy: [-10, 10],
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
});

// Day of week patterns
const dowPlot = createPlot(() => {
  const dow_avg = bcycle_df
    .groupBy("day_of_week")
    .agg(
      pl.col("num_bikes_available").mean().alias("avg_bikes"),
      pl.col("num_docks_available").mean().alias("avg_docks"),
    )
    .sort("day_of_week")
    .toRecords();
  return Plot.plot({
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
      Plot.ruleY([0]),
      // Plot.legend({
      //   color: {
      //     domain: ["Bikes", "Docks"],
      //     range: ["blue", "red"],
      //   },
      // }),
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
});

// Hourly patterns
const hourlyPlot = createPlot(() => {
  const hourly_avg = bcycle_df
    .groupBy("hour")
    .agg(
      pl.col("num_bikes_available").mean().alias("avg_bikes"),
      pl.col("num_docks_available").mean().alias("avg_docks"),
    )
    .sort("hour")
    .toRecords();
  return Plot.plot({
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
      Plot.text(hourly_avg, {
        x: 23,
        y: (d) => Math.max(d.avg_bikes, d.avg_docks),
        text: ["Bikes", "Docks"],
        fill: ["blue", "red"],
        dx: [-10, 10],
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
});

// Academic calendar effects
const academicPlot = createPlot(() => {
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
  return Plot.plot({
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
      Plot.ruleY([0]),
      // Plot.legend({
      //   color: {
      //     domain: ["Bikes", "Docks"],
      //     range: ["blue", "red"],
      //   },
      // }),
    ],
    x: { label: "Academic Period" },
    y: { label: "Average Count" },
    color: {
      domain: ["Bikes", "Docks"],
      range: ["blue", "red"],
    },
    title: "Bike and Dock Availability by Academic Period",
  });
});

// Create HTML report
const htmlReport = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BCycle Data Analysis Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
            background-color: #f0f0f0;
        }
        .container {
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .plot {
            margin-bottom: 40px;
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 5px rgba(0,0,0,0.05);
        }
        .plot-description {
            margin-bottom: 20px;
            font-style: italic;
            color: #555;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>BCycle Data Analysis Report</h1>
        <div class="plot">
            <p class="plot-description">This plot shows the average number of bikes and docks available each month, helping identify seasonal trends in bike usage.</p>
            ${monthlyPlot}
        </div>
        <div class="plot">
            <p class="plot-description">This plot illustrates the patterns of bike and dock availability across different days of the week, revealing usage patterns that may correlate with weekdays vs. weekends.</p>
            ${dowPlot}
        </div>
        <div class="plot">
            <p class="plot-description">This plot demonstrates how bike and dock availability changes throughout the day, helping identify peak usage times and potential rebalancing needs.</p>
            ${hourlyPlot}
        </div>
        <div class="plot">
            <p class="plot-description">This plot compares bike and dock availability across different academic periods, showing how university schedules might impact bike-sharing system usage.</p>
            ${academicPlot}
        </div>
    </div>
</body>
</html>
`;

// Write HTML report to file
await Deno.writeTextFile("bcycle_analysis_report.html", htmlReport);
console.log("HTML report generated: bcycle_analysis_report.html");
