import path from 'path';
import fs from 'promise-fs';
import { homedir } from 'os';
import screenshot from 'screenshot-desktop';
import jimp from 'jimp';
import '@jimp/png';
import 'datejs'
import { AppConfig } from './App';

export const ROOT_PATH = path.resolve(homedir(), '.storepro');
export const LOGDIR_PATH = path.resolve(ROOT_PATH, 'logs');
export const CACHE_DIR = path.resolve(ROOT_PATH, '.cache');
export const CONF_PATH = path.resolve(ROOT_PATH, 'menu.conf');

export function init() {
    const rootTask = new Promise<void>((resolve: () => void, reject: (err: Error) => void) => {
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
    Promise.all<void>([rootTask, logTask, cacheTask]);
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

export function takeScreenshot(outPath: string): Promise<void> {
    return new Promise<void>(function (resolve, reject) {
        screenshot({ format: 'png' })
            .then(function (buffer) {
                jimp.read(buffer).then(image => {
                    image
                        .quality(80)
                        .write(outPath);
                    resolve();
                }).catch(err => reject(err));
            }).catch(err => reject(err));
    });
}

export function loadSettings(): Promise<AppConfig> {
    return new Promise<AppConfig>(function (resolve, reject) {
        const filePath = path.resolve(ROOT_PATH, 'conf.json');
        if (fs.existsSync(filePath)) {
            fs.readFile(filePath, { encoding: 'utf8' })
                .then(confBuffer => {
                    const _config: AppConfig = JSON.parse(confBuffer);
                    resolve(_config);
                })
                .catch((err: Error) => {
                    console.error(err.message)
                    reject();
                });
        } else {
            console.warn('No configuration found');
            reject();
        }
    });
}

export function saveSettings(config: AppConfig): Promise<void> {
    return new Promise<void>(function (resolve, reject) {
        const filePath = path.resolve(ROOT_PATH, 'conf.json');
          fs.writeFile(filePath, JSON.stringify(config))
            .then(() => resolve())
            .catch((err: Error) => reject(err));
    })
}