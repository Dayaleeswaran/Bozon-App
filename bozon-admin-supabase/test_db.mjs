import { Client, Databases } from 'appwrite';

const client = new Client()
    .setEndpoint('https://sgp.cloud.appwrite.io/v1')
    .setProject('699fe70c0021e9371515');

const databases = new Databases(client);
const DB_ID = '699fe851001a317d7aa3';

async function run() {
    try {
        const team = await databases.listDocuments(DB_ID, 'team_members');
        console.log("--- TEAM MEMBERS ---");
        console.log(JSON.stringify(team.documents, null, 2));

        const clients = await databases.listDocuments(DB_ID, 'clients');
        console.log("--- CLIENTS ---");
        console.log(JSON.stringify(clients.documents, null, 2));

        const testimonials = await databases.listDocuments(DB_ID, 'testimonials');
        console.log("--- TESTIMONIALS ---");
        console.log(JSON.stringify(testimonials.documents, null, 2));

    } catch (e) {
        console.error(e);
    }
}
run();
