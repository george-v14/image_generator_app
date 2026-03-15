import { useState } from "react";
import workflowHeader from "../image_gen_workflow_header.png";

const initialForm = {
  description: "",
  optimizedPrompt: "",
  feedback: "",
  imageUrl: ""
};

async function apiRequest(path, body) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong.");
  }

  return data;
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({
    optimize: false,
    generate: false,
    refine: false
  });
  const [error, setError] = useState("");

  const setField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  };

  const optimizePrompt = async () => {
    if (!form.description.trim()) {
      setError("Enter an image description before optimizing the prompt.");
      return;
    }

    setError("");
    setStatus((current) => ({ ...current, optimize: true }));

    try {
      const data = await apiRequest("/api/optimize-prompt", {
        description: form.description
      });

      setForm((current) => ({
        ...current,
        optimizedPrompt: data.optimizedPrompt,
        imageUrl: "",
        feedback: ""
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setStatus((current) => ({ ...current, optimize: false }));
    }
  };

  const generateImage = async () => {
    if (!form.optimizedPrompt.trim()) {
      setError("Optimize and review the prompt before generating an image.");
      return;
    }

    setError("");
    setStatus((current) => ({ ...current, generate: true }));

    try {
      const data = await apiRequest("/api/generate-image", {
        optimizedPrompt: form.optimizedPrompt
      });

      setForm((current) => ({
        ...current,
        imageUrl: data.imageUrl
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setStatus((current) => ({ ...current, generate: false }));
    }
  };

  const refinePrompt = async () => {
    if (!form.optimizedPrompt.trim() || !form.feedback.trim()) {
      setError("Add feedback so the prompt can be refined.");
      return;
    }

    setError("");
    setStatus((current) => ({ ...current, refine: true }));

    try {
      const data = await apiRequest("/api/refine-prompt", {
        optimizedPrompt: form.optimizedPrompt,
        feedback: form.feedback
      });

      setForm((current) => ({
        ...current,
        optimizedPrompt: data.optimizedPrompt
      }));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setStatus((current) => ({ ...current, refine: false }));
    }
  };

  const isBusy = status.optimize || status.generate || status.refine;

  return (
    <div className="page-shell">
      <main className="app-card">
        <section className="hero">
          <div className="hero-image-shell">
            <img
              className="hero-image"
              src={workflowHeader}
              alt="Workflow showing prompt optimization, image generation, and feedback refinement"
            />
            <div className="hero-copy">
              <p className="eyebrow">React + OpenAI workflow</p>
              <h1>Prompt to Image Generator</h1>
              <p className="lede">
                Convert your draft image ideas into optimized image generation prompts.
              </p>
            </div>
          </div>
        </section>

        <section className="panel">
          <label htmlFor="description">1. Describe the image you want to create</label>
          <textarea
            id="description"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
            placeholder="Example: A cinematic photo of a tiny robot gardening on a rainy rooftop at sunrise."
            rows={5}
          />
          <button onClick={optimizePrompt} disabled={status.optimize}>
            {status.optimize ? "Optimizing prompt..." : "Optimize prompt"}
          </button>
        </section>

        <section className="panel">
          <label htmlFor="optimizedPrompt">2. Review the optimized prompt</label>
          <textarea
            id="optimizedPrompt"
            value={form.optimizedPrompt}
            onChange={(event) => setField("optimizedPrompt", event.target.value)}
            placeholder="The optimized prompt will appear here."
            rows={8}
          />
          <button onClick={generateImage} disabled={status.generate || !form.optimizedPrompt}>
            {status.generate ? "Generating image..." : "Generate image"}
          </button>
        </section>

        <section className="panel feedback-panel">
          <div>
            <label htmlFor="feedback">3. Share feedback on the generated image</label>
            <textarea
              id="feedback"
              value={form.feedback}
              onChange={(event) => setField("feedback", event.target.value)}
              placeholder="Example: Make the lighting warmer and the robot more expressive."
              rows={4}
            />
          </div>
          <button onClick={refinePrompt} disabled={status.refine || !form.feedback}>
            {status.refine ? "Refining prompt..." : "Refine prompt from feedback"}
          </button>
        </section>

        {error ? <p className="message error">{error}</p> : null}
        {!error && isBusy ? <p className="message">Working on your request...</p> : null}

        <section className="panel image-panel">
          <div className="image-header">
            <h2>Generated image</h2>
            <p>After you review the prompt and submit it, the image will appear here.</p>
          </div>

          {form.imageUrl ? (
            <div className="generated-image-frame">
              <img
                className="generated-image"
                src={form.imageUrl}
                alt="Generated from optimized prompt"
              />
            </div>
          ) : (
            <div className="image-placeholder">
              <span>Image preview pending</span>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
