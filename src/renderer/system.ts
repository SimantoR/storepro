import path from 'path';
import fs from 'promise-fs';
import { homedir } from 'os';
import sharp from 'sharp';
import 'datejs'

export const ROOT_PATH = path.resolve(homedir(), '.storepro');
export const LOGDIR_PATH = path.resolve(ROOT_PATH, 'logs');
export const CACHE_DIR = path.resolve(ROOT_PATH, '.cache');
export const CONF_PATH = path.resolve(ROOT_PATH, 'menu.conf');

export function init() {
    const rootTask = new Promise((resolve: () => void, reject: (err: Error) => void) => {
        if (!fs.existsSync(ROOT_PATH)) {
            fs.mkdir(ROOT_PATH).catch(err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }
    });
    const logTask = new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
        if (!fs.existsSync(LOGDIR_PATH)) {
            fs.mkdir(LOGDIR_PATH).catch(err => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        }
    });
    const cacheTask = new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdir(CACHE_DIR).catch(err => {
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
            fs.appendFileSync(outPath, output);
            resolve();
        } catch (err) {
            console.log('Error logged. Check log at ' + LOGDIR_PATH);
            reject(err);
        }
    })
}


export interface MenuButtonProps {
    sku: string,
    name: string,
    image?: string
}

export function saveMenu(menu: MenuButtonProps[]): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
        fs.writeFile(CONF_PATH, menu, { encoding: 'utf8', flag: 'w+' })
            .then(() => resolve())
            .catch(err => reject(err));
    })
}

export function loadMenu(): Promise<MenuButtonProps[] | undefined> {
    return new Promise<MenuButtonProps[] | undefined>(async (resolve, reject) => {
        let fStream: fs.ReadStream;
        if (!fs.existsSync(CONF_PATH)) {
            resolve(undefined);
        } else {
            fs.readFile(CONF_PATH, { encoding: 'utf8' })
                .then(data => resolve(JSON.parse(data) as MenuButtonProps[]))
                .catch(err => reject(err));
        }
    })
}

export function loadImage(imgPath: string): Promise<string> {
    return new Promise<string>(async (resolve, reject) => {
        if (fs.existsSync(imgPath)) {
            const image = sharp(imgPath);
            let base64 = '';
            
            const error = function (err: Error | null | undefined) {
                if (err)
                    reject(err)
            }
            if (image.webp().write(base64, 'base64', error)) {
                resolve(`data:image/webp; ${base64}`);
            }
            else {
                reject(new Error());
            }
        }
    })
}