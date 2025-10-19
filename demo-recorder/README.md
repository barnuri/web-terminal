# Demo Recorder

Automated demo recording tool for Web Terminal using Puppeteer.

## Prerequisites

1. Install dependencies in the root directory:

   ```bash
   cd ..
   npm run install:all
   ```

2. Install demo-recorder dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

## Usage

### Automated Recording with Server Start (Recommended)

```bash
npm start
```

This will:

- **Automatically start the server and client** using `npm start` from the root directory
- Wait for the application to be ready
- Launch a browser
- Navigate to the Web Terminal
- Perform automated demo actions
- Record everything to `../assets/demo.mp4`
- to update README.md with the new video, drag and drop the video into the README.md file in place of the existing demo video in the browser and it will upload the video and generate a link (ex: https://github.com/user-attachments/assets/xxxx
  ).
- **Automatically stop the server** when recording is complete

**Note:** The script will build and start the production server, which may take a minute to be ready.

## Customization

Edit `record-automated-demo.js` to customize:

- Recording duration
- Commands to execute
- UI interactions
- Video resolution and FPS

## Troubleshooting

**Browser doesn't open:**

- Ensure puppeteer is installed: `npm install`
- Check if port 3000 is not already in use

**Server fails to start:**

- Ensure you've run `npm run install:all` in the root directory
- Check if port 3000 is available
- Verify all dependencies are installed

**Recording fails:**

- The script will wait up to 60 seconds for the server to start
- Check terminal selectors match your UI
- Check console output for error messages

**Video quality issues:**

- Adjust FPS in CONFIG.recordingOptions
- Modify viewport size for higher resolution

## Output

- `../assets/demo.mp4` - Full quality video
