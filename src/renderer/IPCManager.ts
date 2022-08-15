const ipc = window.electron.ipcRenderer;

function print(content: string) {
  return new Promise<void>((resolve, reject) => {
    ipc.on<Error>('print', (error) => {
      if (error) reject(error);
      else resolve();
    });

    ipc.sendMessage<string>('print', content);
  });
}

export default {
  print,
};
