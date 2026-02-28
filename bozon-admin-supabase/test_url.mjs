import { Client, Storage } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('699fe70c0021e9371515');

const storage = new Storage(client);
const BUCKET_ID = '699fe8a600000fb64831';

const fileId = 'test-file-id';

const urlPreview = storage.getFilePreview(BUCKET_ID, fileId);
console.log("PREVIEW TYPE:", typeof urlPreview);
console.log("PREVIEW VAL:", urlPreview);
