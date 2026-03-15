# Prompt to Image Studio

A small React + Express app that supports this workflow:

1. A user writes a rough image description.
2. The backend asks an OpenAI language model to optimize it into a stronger image prompt.
3. The user reviews and optionally edits that optimized prompt.
4. The backend generates an image from the approved prompt.
5. The user leaves feedback on the image.
6. The backend rewrites the prompt based on that feedback so the next generation is easier.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file:

   ```bash
   cp .env.example .env
   ```

3. Add your OpenAI API key to `.env`.

4. Start the app:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:5173`.

## API routes

- `POST /api/optimize-prompt`
- `POST /api/generate-image`
- `POST /api/refine-prompt`

## Notes

- The prompt rewrite calls use `gpt-5-mini` for a fast, lower-cost text step.
- Image generation uses `gpt-image-1.5`.
- The server returns generated images as base64 data URLs so the frontend can show them immediately.
