# al-ʿIyāl Video Editor

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/47ef0556-8198-4539-8d89-cb462a4bfbab.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/47ef0556-8198-4539-8d89-cb462a4bfbab)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/al-iyaal)](https://al-iyaal.vercel.app)
[![codecov](https://codecov.io/gh/ragaeeb/al-iyaal/graph/badge.svg?token=N6E28TLTMC)](https://codecov.io/gh/ragaeeb/al-iyaal)
[![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)](https://www.typescriptlang.org)
[![Node.js CI](https://github.com/ragaeeb/al-iyaal/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/al-iyaal/actions/workflows/build.yml)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![GitHub License](https://img.shields.io/github/license/ragaeeb/al-iyaal)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Next.js-based video editor designed for parents to review and edit children's video content. The application uses AI-powered subtitle analysis to identify potentially inappropriate content based on customizable Islamic values and family-friendly criteria.

🌐 **Live Demo:** [al-iyaal.vercel.app](https://al-iyaal.vercel.app)

## Features

### 🎬 Video Management
- Browse videos from local directories
- Automatic subtitle detection (.srt files)
- Video streaming with range request support
- Video metadata display (duration, file size)

### ✂️ Video Editing
- Precise time-range selection for cutting video segments
- Visual timeline with subtitle overlay
- Keyboard shortcuts for quick navigation
- Real-time video preview with subtitle display
- Multi-segment extraction and merging

### 🤖 AI-Powered Content Analysis
- Automatic subtitle analysis using Google Gemini AI
- Customizable content filtering criteria
- Priority-based flagging system (High/Medium/Low)
- Storyline summary generation
- Visual indicators for concerning content with color-coded priorities:
  - 🔴 **High Priority** - Major aqeedah issues, explicit content
  - 🟠 **Medium Priority** - Questionable behavior, offensive language
  - 🟡 **Low Priority** - Mild concerns, ambiguous content

### ⚙️ Customization
- Editable content criteria via Settings page
- Custom priority guidelines with examples
- Persistent settings storage
- Token-optimized API requests

### 🎨 Modern UI
- Dark mode interface with gradient effects
- Responsive design for desktop and mobile
- Animated components and smooth transitions
- Real-time progress indicators
- Dynamic time formatting based on video duration

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Runtime:** Bun
- **UI Components:** Radix UI, Tailwind CSS, shadcn/ui
- **AI:** Google Gemini API
- **Video Processing:** ffmpeggy v3.1.3
- **Animations:** Motion (Framer Motion)
- **State Management:** React Hooks
- **Notifications:** Sonner

## Prerequisites

- Bun >= 1.3.0
- FFmpeg installed on your system
- Google Gemini API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ragaeeb/al-iyaal.git
cd al-iyaal
```

2. Install dependencies:
```bash
bun install
```

3. Create a `.env.local` file in the root directory:
```env
GOOGLE_API_KEY=your_gemini_api_key_here
PORT=3000
GEMINI_MODEL=gemini-2.5-flash-lite  # Fast, cost-effective model for subtitle analysis
```

You can provide multiple API keys separated by commas for load balancing:
```env
GOOGLE_API_KEY=key1,key2,key3
```

4. Create the data directory for settings:
```bash
mkdir data
```

## Development

Start the development server:
```bash
bun dev
```

The application will be available at `http://localhost:3000`

## Building for Production

```bash
bun run build
bun start
```

## Deployment on Vercel

1. Push your code to a GitHub repository

2. Import the project in Vercel

3. Add environment variables in Vercel dashboard:
   - `GOOGLE_API_KEY`
   - `GEMINI_MODEL` (optional)

4. Deploy

**Note:** FFmpeg is not available in Vercel's default serverless environment. For production deployment with video processing, consider:
- **Self-hosted**: Deploy to a VPS (AWS EC2, DigitalOcean, Linode)
- **Platform-as-a-service**: Render, Railway, Heroku (with buildpack)
- **Serverless with FFmpeg**: AWS Lambda with custom layer, Google Cloud Functions
For Vercel deployment, video processing would require proxying to an external FFmpeg service or disabling local video processing.

## Usage

### 1. Select Videos
- Enter a folder path or direct video file path on the home page
- Browse available videos in the selected folder
- Videos with existing .srt subtitle files will be automatically detected

### 2. Load Subtitles
- Subtitles are auto-loaded if found alongside the video file
- Alternatively, drag and drop a .srt file into the subtitles panel

### 3. Analyze Content
- Click the "Analyze" button in the subtitles panel
- Choose between "Quick" or "Detailed" analysis
- Review flagged content with priority indicators
- Read the AI-generated storyline summary

### 4. Edit Video
- Use the scissors button to mark time ranges at the current playback position
- Manually enter time ranges in format: `MM:SS-MM:SS` or `H:MM:SS-H:MM:SS`
- Click on flagged subtitles to jump to that timestamp
- Remove unwanted ranges by clicking the X icon

### 5. Process Video
- Click "Process Video" to extract selected time ranges
- Monitor progress with the real-time progress indicator
- Processed video will be saved in the same directory as the original

### 6. Customize Settings
- Click the "Settings" button to access configuration
- Edit content criteria to match your family values
- Customize priority guidelines with specific examples
- Save changes for future analysis sessions

## File Structure

```text
al-iyaal/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── files/          # File serving endpoints
│   │   │   ├── settings/       # Settings management
│   │   │   ├── subtitles/      # Subtitle analysis
│   │   │   └── videos/         # Video operations
│   │   ├── editor/             # Video editor page
│   │   ├── settings/           # Settings configuration page
│   │   ├── videos/             # Video listing page
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   └── types/                  # TypeScript type definitions
├── data/
│   └── settings.json          # Persisted settings
└── public/                     # Static assets
```

## API Endpoints

### `GET /api/videos/list`
List videos in a directory
- Query: `path` - Directory path
- Returns: Array of video metadata
- Example response:
  ```json
  [
    { "name": "video.mp4", "size": 1024000, "duration": 120 }
  ]
  ```

### `GET /api/videos/stream`
Stream video content with range support
- Query: `path` - Video file path
- Returns: Video stream

### `POST /api/videos/process`
Process video with selected time ranges
- Body: `{ path: string, ranges: TimeRange[] }`
- Returns: Server-sent events with progress

### `POST /api/subtitles/analyze`
Analyze subtitle content
- Body: `{ subtitles: SubtitleEntry[] }`
- Returns: Server-sent events with analysis results

### `GET /api/settings`
Retrieve current settings
- Returns: `{ contentCriteria: string, priorityGuidelines: string }`

### `POST /api/settings`
Update settings
- Body: `{ contentCriteria: string, priorityGuidelines: string }`
- Returns: Success confirmation

## Customization

### Content Criteria
Default criteria include:
- Adult relationships and romantic content
- Unethical behavior
- Content against Islamic values and aqeedah
- Magic, sorcery, and supernatural practices
- Music references
- Violence and frightening content
- Inappropriate language

### Priority Guidelines
- **HIGH**: Aqeedah violations (shirk, celebrating non-Islamic holidays), explicit magic/sorcery, sexual content
- **MEDIUM**: Questionable behavior, offensive language, moderate violence, dating/romance
- **LOW**: Mildly scary content, ambiguous references, minor concerns

All criteria and priorities are fully customizable via the Settings page.

## Performance Optimization

- Memoized components to minimize re-renders
- Token-optimized AI requests (removed redundant data)
- Dynamic time formatting based on video duration
- Efficient subtitle parsing and matching
- API key rotation for rate limit management

## Contributing

Contributions are welcome! Submit a Pull Request to help improve this project.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

# Credits

[edil-ozi.pro](https://www.edil-ozi.pro/)
[shadcnstudio.com](https://shadcnstudio.com)

## Author

### Ragaeeb Haq

- GitHub: [@ragaeeb](https://github.com/ragaeeb)

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/ragaeeb/al-iyaal/issues) page.

---

Built with ❤️ for families who want to provide safe, values-aligned content for their children.
