import path from 'path';
import { open, mkdirSync, existsSync, appendFileSync } from 'fs';
import { homedir } from 'os';

export const ROOT_PATH = path.resolve(homedir(), '.storepro')
export const LOGDIR_PATH = path.resolve(ROOT_PATH, 'logs')

export function init() {
    if (!existsSync(ROOT_PATH))
        mkdirSync(ROOT_PATH, { recursive: false })
    if (!existsSync(LOGDIR_PATH))
        mkdirSync(LOGDIR_PATH, { recursive: true })
}

export function logErr(err: Error): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const outPath = path.resolve(LOGDIR_PATH, new Date().toString('dd-MM-yyyy'))
        try {
            appendFileSync(outPath, JSON.stringify({
                timestamp: new Date(),
                message: err.message,
                stack: err.stack
            }))
            resolve();
        } catch (err) {
            console.log('Error logged. Check log at ' + LOGDIR_PATH);
            reject(err);
        }
    })
}