# my-videos

Remotion video projects, rendered in the cloud with GitHub Actions.

## Add a new video
Put the Remotion project (with its `package.json` and `package-lock.json`, without `node_modules`) in its own folder here, e.g. `my-videos/volcanoes/`, then commit and push.

## Render
GitHub repo → **Actions** → **Render video** → **Run workflow**:
- **project**: the folder name (e.g. `dinosaurs`)
- **composition**: the composition ID (usually `Main`)
- **scale**: `1` for final quality, `0.5` for a quick preview

When it finishes, open the run and download the MP4 under **Artifacts**.
