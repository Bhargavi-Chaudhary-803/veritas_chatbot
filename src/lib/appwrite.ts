import { Client, Databases } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const databases = new Databases(client);

export const appwriteConfig = {
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  patientsCollectionId: process.env.NEXT_PUBLIC_APPWRITE_PATIENTS_COLLECTION_ID!,
  consultationsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_CONSULTATIONS_COLLECTION_ID!,
  answersCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_ANSWERS_COLLECTION_ID!,
  redFlagsCollectionId:
    process.env.NEXT_PUBLIC_APPWRITE_RED_FLAGS_COLLECTION_ID!,
};