import sqlite from 'sqlite3';
import path from 'path';
import { workerData, parentPort } from 'worker_threads';

// Here workerdata is query to the sqlite3 database
// And this script will return the query results.