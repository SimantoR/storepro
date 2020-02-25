declare module 'screenshot-desktop' {
  export default function(props: { format: 'jpg' | 'png' }): Promise<Buffer>;
}
