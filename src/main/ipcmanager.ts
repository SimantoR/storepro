import { ipcMain as ipc } from 'electron';

import printerDriver from '@thiagoelg/node-printer';
import {
  printer as ThermalPrinter,
  types as PrinterTypes,
} from 'node-thermal-printer';

const thermalPrinter: ThermalPrinter = new ThermalPrinter({
  type: PrinterTypes.EPSON,
  interface: 'printer:RECEIPT_PRINTER',
  driver: printerDriver,
});

export default function registerIPC() {
  ipc.on('ipc-example', async (event, arg) => {
    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
    console.log(msgTemplate(arg));
    event.reply('ipc-example', msgTemplate('pong'));
  });

  ipc.on('print', (event, content: string) => {
    console.log(content);
    event.reply('print', undefined);
  });
}
