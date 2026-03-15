import "dotenv/config";
import cors from "cors";
import express from "express";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3001);

if (!process.env.OPENAI_API_KEY) {
  console.warn("Missing OPENAI_API_KEY. API routes will fail until it is set.");
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

function extractText(response) {
  if (typeof response.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const text = response.output
    ?.flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  return text || "";
}

async function rewritePrompt({ instruction, sourcePrompt, userInput }) {
  const response = await client.responses.create({
    model: "gpt-5-mini",
    reasoning: { effort: "minimal" },
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You create polished prompts for image generation. Return only the final prompt text with no intro, labels, bullets, or quotation marks. Optimize for clean, centered compositions with safe margins around all important subjects. Avoid placing faces, objects, UI cards, arrows, or text flush against the edges. If the concept includes diagrams, infographics, or interface-like layouts, keep every major element comfortably inside the frame and avoid cut-off callouts."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `${instruction}\n\nOriginal text:\n${sourcePrompt}\n\nAdditional context:\n${userInput}`
          }
        ]
      }
    ]
  });

  return extractText(response);
}

app.post("/api/optimize-prompt", async (req, res) => {
  try {
    const { description } = req.body;

    if (!description?.trim()) {
      return res.status(400).json({ error: "A description is required." });
    }

    const optimizedPrompt = await rewritePrompt({
      instruction:
        "Turn the user's idea into a vivid image generation prompt. Keep it production-ready, concise but specific, and include subject, setting, composition, lighting, style, and important constraints when useful. Make the composition fully visible inside the frame, keep the focal subject centered unless the user asks otherwise, avoid cropped-off subjects or UI elements at the edges, leave comfortable margins around key content, and avoid text in the image unless the user explicitly requests text.",
      sourcePrompt: description.trim(),
      userInput: "None"
    });

    return res.json({ optimizedPrompt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to optimize the prompt." });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { optimizedPrompt } = req.body;

    if (!optimizedPrompt?.trim()) {
      return res.status(400).json({ error: "An optimized prompt is required." });
    }

    const result = await client.images.generate({
      model: "gpt-image-1.5",
      prompt: optimizedPrompt.trim(),
      size: "1024x1024",
      quality: "medium"
    });

    const imageBase64 = result.data?.[0]?.b64_json;

    if (!imageBase64) {
      return res.status(502).json({ error: "The image service did not return an image." });
    }

    return res.json({
      imageUrl: `data:image/png;base64,${imageBase64}`
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to generate the image." });
  }
});

app.post("/api/refine-prompt", async (req, res) => {
  try {
    const { optimizedPrompt, feedback } = req.body;

    if (!optimizedPrompt?.trim() || !feedback?.trim()) {
      return res
        .status(400)
        .json({ error: "Both the optimized prompt and user feedback are required." });
    }

    const revisedPrompt = await rewritePrompt({
      instruction:
        "Revise the image generation prompt based on the user's feedback. Preserve the original intent unless the feedback requests a change. Keep the main composition fully visible inside the frame, keep important content centered with safe margins, avoid cropped-off subjects or text at the edges, avoid text in the image unless the user explicitly requests it, and return a single improved prompt ready for the next image generation attempt.",
      sourcePrompt: optimizedPrompt.trim(),
      userInput: feedback.trim()
    });

    return res.json({ optimizedPrompt: revisedPrompt });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Unable to refine the prompt." });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
