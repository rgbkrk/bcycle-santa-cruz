// %%
import pl from "npm:nodejs-polars";
import { walk } from "https://deno.land/std@0.192.0/fs/walk.ts";

// %% Helper function to parse timestamp from filename
function parseTimestampFromFilename(filename: string): number | null {
  const match = filename.match(/stations-(\d+)\.json$/);
  return match ? parseInt(match[1]) : null;
}

// %% Helper function to read JSON file
async function readJsonFile(path: string): Promise<any> {
  const text = await Deno.readTextFile(path);
  return JSON.parse(text);
}

// %% Helper function to process a single JSON file
async function processJsonFile(path: string): Promise<pl.DataFrame> {
  const timestamp = parseTimestampFromFilename(path);
  const data = await readJsonFile(path);

  // Add timestamp to each row
  const dataWithTimestamp = data.map((row: any) => ({
    ...row,
    file_timestamp: timestamp,
  }));

  return pl.DataFrame(dataWithTimestamp);
}

// %%

// Let's start with /Users/kylekelley/code/src/github.com/rgbkrk/bcycle-santa-cruz/data/stations-1722379280.json

const df = await processJsonFile("./data/stations-1722379280.json");

df.toRecords()[0];
