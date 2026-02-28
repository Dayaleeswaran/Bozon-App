import { Client, Storage, ID } from 'appwrite';
import fs from 'fs';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('699fe70c0021e9371515');

const storage = new Storage(client);
const BUCKET_ID = '699fe8a600000fb64831';

async function run() {
    try {
        console.log("Creating dummy file...");
        fs.writeFileSync("dummy.txt", "hello world");
        const fileData = new File([fs.readFileSync("dummy.txt")], "dummy.txt", { type: "text/plain" });

        console.log("Uploading file...");
        const res = await storage.createFile(BUCKET_ID, ID.unique(), fileData);
        console.log("File created:", res.$id);

        console.log("Getting file view URL...");
        const url = storage.getFileView(BUCKET_ID, res.$id);
        console.log("View URL:", url.href);

        console.log("Getting file preview URL...");
        const previewUrl = storage.getFilePreview(BUCKET_ID, res.$id);
        console.log("Preview URL:", previewUrl.href);

        // Fetch to see if public access works
        const fetchRes = await fetch(previewUrl.href);
        console.log("Preview Status:", fetchRes.status);

    } catch (e) {
        console.error(e);
    }
}
run();
