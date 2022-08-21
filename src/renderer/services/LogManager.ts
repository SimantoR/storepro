import 'datejs';
import * as fs from 'fs';
import moment from 'moment';
import path from 'path';

export default class LogManager {
  private rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
  }

  logError({ message, stack }: Error): void {
    const currentDate = new Date().toString('yyyy-MM-dd');
    const logFilePath = `${path.join(this.rootPath, currentDate)}.log`;

    if (!fs.existsSync(logFilePath)) {
      const filestream = fs.openSync(logFilePath, 'a+');

      // const timestamp = new Date().toUTCString();
      const timestamp = moment.utc().format();
      const stackStr = stack ? stack.toString().replaceAll('\n', '\\n') : 'na';

      fs.writeSync(
        filestream,
        `timestamp: ${timestamp}, error: ${message}, stack: ${stackStr}`
      );
    }
  }
}
