import { Client, Databases, Storage, Account } from "appwrite";

// Appwrite Configuration parameters
export const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
export const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;

// Same Database and Bucket as Admin Panel
export const DB_ID = import.meta.env.VITE_APPWRITE_DB_ID;
export const BUCKET_ID = import.meta.env.VITE_APPWRITE_BUCKET_ID;

const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID, Query } from "appwrite";
