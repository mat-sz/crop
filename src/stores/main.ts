import { FFmpeg } from '@ffmpeg/ffmpeg';
import { makeAutoObservable, runInAction } from 'mobx';
import { get, set } from 'idb-keyval';

const canUseMT =
  import.meta.env.VITE_ENABLE_MT === '1' && 'SharedArrayBuffer' in window;
const ffmpegVersion = '0.12.3';
const ffmpegName = canUseMT ? 'core-mt' : 'core';
const ffmpegWorker = canUseMT ? 'ffmpeg-core.worker.js' : undefined;
const ffmpegBaseURL = `https://unpkg.com/@ffmpeg/${ffmpegName}@${ffmpegVersion}/dist/esm`;

async function retrieveBlob(
  url: string,
  type: string,
  onProgress?: (progress: number) => void,
) {
  let buffer = await get(url);
  if (!buffer) {
    const response = await fetch(url);
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error(`Unable to fetch: ${url}`);
    }

    const contentLength = +response.headers.get('Content-Length')!;
    let receivedLength = 0;
    const chunks = [];

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      chunks.push(value);
      receivedLength += value.length;
      onProgress?.(receivedLength / contentLength);
    }

    buffer = await new Blob(chunks).arrayBuffer();

    try {
      set(url, buffer);
      console.log(`Saved to IndexedDB: ${url}`);
    } catch {
      //
    }
  } else {
    console.log(`Loaded from IndexedDB: ${url}`);
  }

  const blob = new Blob([buffer], { type });
  return URL.createObjectURL(blob);
}

class MainStore {
  loaded = false;
  loadProgress = 0;
  ffmpeg = new FFmpeg();
  file: File | undefined = undefined;
  area: number[] = [0, 0, 1, 1];
  time: number[] = [0, 1];

  running = false;
  execProgress = 0;
  outputUrl: string | undefined = undefined;
  output: string = '';

  mute = false;
  flipH = false;
  flipV = false;

  step = 0;
  video: HTMLVideoElement | undefined = undefined;

  constructor() {
    makeAutoObservable(this);
    this.load();
  }

  reset() {
    this.area = [0, 0, 1, 1];
    this.time = [0, 1];
    this.mute = false;
    this.flipH = false;
    this.flipV = false;
  }

  async loadVideo(file: File) {
    this.video = undefined;
    this.file = file;
    this.step = 1;
    this.reset();

    const video = document.createElement('video');
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    video.autoplay = false;

    video.addEventListener('loadedmetadata', () => {
      runInAction(() => {
        video.currentTime = 0.01;
        video.pause();
        this.video = video;
      });
    });

    video.addEventListener('ended', () => {
      const min = this.time[0] * video.duration;
      video.currentTime = min;
    });

    video.addEventListener('timeupdate', () => {
      const min = this.time[0] * video.duration;
      const max = this.time[1] * video.duration;

      if (video.currentTime > max) {
        video.currentTime = min;
      } else if (video.currentTime < min - 1) {
        video.currentTime = min;
      }
    });

    video.src = URL.createObjectURL(file);
  }

  async load() {
    this.ffmpeg.on('log', e => {
      console.log(e);
      runInAction(() => {
        this.output = `${e.message}\n`;
      });
    });
    this.ffmpeg.on('progress', e => {
      runInAction(() => {
        this.execProgress = e.progress;
      });
    });

    // toBlobURL is used to bypass CORS issue, urls with the same
    // domain can be used directly.
    await this.ffmpeg.load({
      coreURL: await retrieveBlob(
        `${ffmpegBaseURL}/ffmpeg-core.js`,
        'text/javascript',
      ),
      wasmURL: await retrieveBlob(
        `${ffmpegBaseURL}/ffmpeg-core.wasm`,
        'application/wasm',
        progress => {
          runInAction(() => {
            this.loadProgress = progress;
          });
        },
      ),
      workerURL: ffmpegWorker
        ? await retrieveBlob(
            `${ffmpegBaseURL}/${ffmpegWorker}`,
            'text/javascript',
          )
        : undefined,
    });

    runInAction(() => {
      this.loadProgress = 1;
      this.loaded = true;
    });
  }

  async exec(args: string[]) {
    this.running = true;
    this.execProgress = 0;
    this.output = '';
    this.outputUrl = undefined;

    try {
      await this.ffmpeg.writeFile(
        'input',
        new Uint8Array(await this.file!.arrayBuffer()),
      );
      await this.ffmpeg.exec(['-i', 'input', ...args, 'output.mp4']);
      const data = (await this.ffmpeg.readFile('output.mp4')) as Uint8Array;
      this.outputUrl = URL.createObjectURL(
        new Blob([data.buffer], { type: 'video/mp4' }),
      );
    } finally {
      runInAction(() => {
        this.running = false;
      });
    }
  }
}

export const mainStore = new MainStore();
