// %%
import pl from "npm:nodejs-polars";
import { walk } from "https://deno.land/std@0.192.0/fs/walk.ts";

// %% Function to load all batch parquet files
async function loadAllBatches(): Promise<pl.DataFrame> {
  const batchDataFrames: pl.DataFrame[] = [];

  for await (const entry of walk("./batches")) {
    if (
      entry.isFile &&
      entry.name.startsWith("bcycle_data_batch_") &&
      entry.name.endsWith(".parquet")
    ) {
      console.log(`Loading ${entry.name}...`);
      const df = await pl.readParquet(entry.path);
      batchDataFrames.push(df);
    }
  }

  if (batchDataFrames.length === 0) {
    throw new Error("No batch parquet files found.");
  }

  console.log(`Loaded ${batchDataFrames.length} batch files.`);

  // Concatenate all DataFrames
  return pl.concat(batchDataFrames);
}

// %% Load and combine all batches
console.log("Loading and combining all batches...");
const combinedData = await loadAllBatches();

// %% Display info about the combined data
console.log(`Combined DataFrame shape: ${combinedData.shape}`);
console.log("Schema:");
console.log(combinedData.schema);

// %% Save combined data to a single parquet file
const outputFileName = "bcycle_data_combined.parquet";
console.log(`Saving combined data to ${outputFileName}...`);
await combinedData.writeParquet(outputFileName);
console.log("Save complete.");

// %% Verify the combined parquet file
console.log("Verifying the combined parquet file...");
const verifyDf = await pl.readParquet(outputFileName);
console.log(`Verified DataFrame shape: ${verifyDf.shape}`);
console.log("Verified Schema:");
console.log(verifyDf.schema);

// %% Display a few rows from the combined data
verifyDf.head();
// %%
verifyDf.sample(3)["last_reported"];
