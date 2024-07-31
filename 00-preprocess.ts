// Create batches of parquet files for segments of loaded data
// %%
import pl from "npm:nodejs-polars";
import { walk } from "https://deno.land/std@0.192.0/fs/walk.ts";

// %% Helper function to flatten nested objects
function flattenObject(obj: any, prefix = ""): any {
  return Object.keys(obj).reduce((acc: any, k: string) => {
    const pre = prefix.length ? `${prefix}_` : "";
    if (
      typeof obj[k] === "object" &&
      obj[k] !== null &&
      !Array.isArray(obj[k])
    ) {
      Object.assign(acc, flattenObject(obj[k], `${pre}${k}`));
    } else {
      acc[`${pre}${k}`] = obj[k];
    }
    return acc;
  }, {});
}

// %% Helper function to process a single JSON file
async function processJsonFile(path: string): Promise<pl.DataFrame> {
  const data = JSON.parse(await Deno.readTextFile(path));

  // Flatten nested objects and add timestamps
  const flattenedData = data.map((row: any) => {
    delete row.rental_uris;
    delete row.num_bikes_available_types;

    const flattened = flattenObject(row);
    return {
      ...flattened,
      last_reported: new Date(flattened.last_reported * 1000),
    };
  });

  return pl.DataFrame(flattenedData);
}

// %% Process files in batches
async function processBatches(): Promise<void> {
  const batches: { [key: string]: string[] } = {};
  let processedCount = 0;

  // Group files into batches
  for await (const entry of walk("./data")) {
    if (
      entry.isFile &&
      entry.name.startsWith("stations-") &&
      entry.name.endsWith(".json")
    ) {
      const timestamp = entry.name.split("-")[1].split(".")[0];
      const batchKey = timestamp.slice(0, 4);
      if (!batches[batchKey]) {
        batches[batchKey] = [];
      }
      batches[batchKey].push(entry.path);
    }
  }

  // Process each batch
  for (const [batchKey, filePaths] of Object.entries(batches)) {
    console.log(
      "Processing batch " + batchKey + " with " + filePaths.length + " files",
    );
    const batchDataFrames = await Promise.all(filePaths.map(processJsonFile));

    // Find all unique columns in this batch
    const allColumns = new Set<string>();
    batchDataFrames.forEach((df) => {
      df.columns.forEach((col) => allColumns.add(col));
    });

    // Uniform the DataFrames in this batch
    const uniformDataFrames = batchDataFrames.map((df) => {
      // Add missing columns with null values
      const missingColumns = Array.from(allColumns).filter(
        (col) => !df.columns.includes(col),
      );
      let uniformDf = df;
      missingColumns.forEach((col) => {
        uniformDf = uniformDf.withColumn(pl.lit(null).alias(col));
      });

      // Ensure column order is consistent
      uniformDf = uniformDf.select(
        Array.from(allColumns).map((col) => pl.col(col)),
      );

      return uniformDf;
    });

    // Concatenate the uniform DataFrames in this batch
    const batchData = pl.concat(uniformDataFrames);

    // Save batch to parquet
    batchData.writeParquet(`batches/bcycle_data_batch_${batchKey}.parquet`);
    console.log(
      `Batch ${batchKey} saved to bcycle_data_batch_${batchKey}.parquet`,
    );

    processedCount += filePaths.length;
  }

  console.log("\nProcessing complete.");
}

// %% Run the processing
await processBatches();

// %% Verify a parquet file (you can change the batch number to verify different files)
const verifyDf = await pl.readParquet("batches/bcycle_data_batch_1718.parquet");
console.log(verifyDf.schema);
verifyDf.head();
