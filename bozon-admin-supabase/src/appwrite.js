import { Client, Account, Databases, Storage, ID, Query } from 'appwrite';

const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;
const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

export { client, account, databases, storage, DB_ID, BUCKET_ID, ID, Query };
