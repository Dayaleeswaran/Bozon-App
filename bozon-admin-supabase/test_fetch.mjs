const url = "https://sgp.cloud.appwrite.io/v1/storage/buckets/699fe8a600000fb64831/files/69a013cd001654028895/preview?project=699fe70c0021e9371515";

async function run() {
    console.log("Fetching:", url);
    const res = await fetch(url);
    console.log("Status:", res.status);
    console.log("Status Text:", res.statusText);

    // Attempt to read the error body
    const body = await res.text();
    console.log("Body:", body);
}
run();
