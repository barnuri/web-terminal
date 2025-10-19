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
   npm install
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
- **Automatically stop the server** when recording is complete

**Note:** The script will build and start the production server, which may take a minute to be ready.

### Option 2: Convert MP4 to GIF

After recording, convert to GIF:

```bash
# Install ffmpeg if not already installed
brew install ffmpeg gifsicle

# Convert to GIF (30 FPS, optimized)
ffmpeg -i ../assets/demo.mp4 -vf "fps=30,scale=1200:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 ../assets/demo.gif

# Optimize GIF
gifsicle -O3 --lossy=80 -o ../assets/demo-optimized.gif ../assets/demo.gif
```

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
- `../assets/demo.gif` - Optimized GIF for README
