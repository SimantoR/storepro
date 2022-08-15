import { Channels } from 'main/preload';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        sendMessage<T>(channel: Channels, args: T): void;
        // on(channel: string, func: (...args: unknown[]) => void): void;
        on<T>(channel: string, func: (args?: T) => void): void;
        once(channel: string, func: (...args: unknown[]) => void): void;
      };
    };
  }
}

export {};
