# crop.mov

Quick video edits, right in your web browser. Built with React and [ffmpeg.wasm](https://github.com/ffmpegwasm/ffmpeg.wasm)

https://crop.mov

- ✔️ Simple UI
- ✔️ No watermarks
- ✔️ Your video files stay on your computer

## Building

Install the project with `yarn` and then run `yarn build`.

## Multi-core ffmpeg.wasm

To enable multi-core ffmpeg.wasm, SharedArrayBuffer needs to be available and env variable `VITE_ENABLE_MT` needs to equal `1`.

This is a work-in-progress feature and it may not work as expected.

### Nginx:

```nginx
server {
  # ...
  add_header Cross-Origin-Embedder-Policy 'require-corp';
	add_header Cross-Origin-Opener-Policy 'same-origin';
  # ...
}

```

See: https://developer.chrome.com/blog/enabling-shared-array-buffer/
