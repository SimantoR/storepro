import path from 'path';
import { homedir } from 'os';
import { osInfo } from 'systeminformation';
import { mkdirSync, existsSync, appendFileSync, exists, mkdir } from 'fs';
import 'datejs'

export const ROOT_PATH = path.resolve(homedir(), '.storepro')
export const LOGDIR_PATH = path.resolve(ROOT_PATH, 'logs')
export const CACHE_DIR = path.resolve(ROOT_PATH, '.cache');

export function init() {
    const rootTask = new Promise((resolve: () => void, reject: (err: Error) => void) => {
        if (!existsSync(ROOT_PATH)) {
            mkdir(ROOT_PATH, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }
    });
    const logTask = new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
        if (!existsSync(LOGDIR_PATH)) {
            mkdirSync(LOGDIR_PATH);
            mkdir(LOGDIR_PATH, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }
    });
    const cacheTask = new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
        if (!existsSync(CACHE_DIR)) {
            mkdir(CACHE_DIR, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }
    });
    const result = Promise.all([rootTask, logTask, cacheTask]);
    
    result.catch(([err1, err2, err3]) => {
        if (err1 || err2 || err3) {
            logErr(err1 || err2 || err3);
        }
    })
}

export function logErr(err: Error): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const outPath = path.resolve(LOGDIR_PATH, new Date().toString('dd-MM-yyyy') + '.json')
        const output = `${new Date().toString('hh:mm:ss')}, ${err.message}, ${JSON.stringify(err.stack)}`
        try {
            appendFileSync(outPath, output);
            resolve();
        } catch (err) {
            console.log('Error logged. Check log at ' + LOGDIR_PATH);
            reject(err);
        }
    })
}