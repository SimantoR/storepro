import * as fs from 'fs';
import path from 'path';
import { createContext, useEffect, useState } from 'react';
import LogManager from './services/LogManager';

export const AppContext = createContext({
  tempDir: '',
  logManager: undefined as LogManager | undefined,
});

interface ContextProviderProps {
  children?: any;
}

export default function ContextProvider(props: ContextProviderProps) {
  const { children } = props;

  const [tempDir, setTempDir] = useState<string>('');
  const [logManager, setLogManager] = useState<LogManager>();

  useEffect(() => {
    if (!tempDir) {
      let dir = tempDir;

      if (process.platform === 'win32') {
        /* -------------------------- access %APPDATA% path ------------------------- */
        dir = process.env.APPDATA as string;
        dir = path.join(dir, 'StorePro');

        const logger = new LogManager(path.join(dir, 'crashes'));

        const subDirs = ['crashes', 'resources', 'cache'];

        subDirs.forEach((subdir) => {
          if (!fs.existsSync(path.join(dir, subdir)))
            fs.mkdirSync(path.join(dir, subdir), { recursive: true });
        });

        setTempDir(dir);
        setLogManager(logger);
      }
    }
  }, [tempDir]);

  return (
    <AppContext.Provider value={{ tempDir, logManager }}>
      {children}
    </AppContext.Provider>
  );
}
