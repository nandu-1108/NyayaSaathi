
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai.errors import ClientError, ServerError
import os
import json

app = Flask(__name__)
CORS(app)

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise ValueError("GEMINI_API_KEY is missing from the .env file")

client = genai.Client(api_key=api_key)


@app.route("/")
def home():
    return "NyayaSaathi backend is running"


@app.route("/analyse", methods=["POST"])
def analyse():

    data = request.get_json(silent=True) or {}
    problem = data.get("Problem")

    if not isinstance(problem, str) or not problem.strip():
        return jsonify({
            "error": "empty_input",
            "message": "Please describe your problem before analysing."
        }), 400

    try:
        response = client.models.generate_content(
            model="gemini-3.6-flash",

            contents=f"""
You are NyayaSaathi, an Indian legal awareness assistant.

Analyse the user's situation and provide two concise sections.

1. ANALYSIS
- Summarise the situation.
- Mention relevant Indian laws or sections only when applicable.
- Explain possible consequences.
- Identify important missing facts or uncertainties.

2. GUIDELINES
Use these headings:
- Possible Next Steps
- Protect Your Rights
- Evidence and Documents
- Where to Seek Help
- Safety Precautions

IMPORTANT:
- Respond in the same language as the user's problem.
- Use simple, clear and supportive language.
- Keep both sections concise and avoid repetition.
- Never invent laws, sections or legal facts.
- Do not assume facts not provided by the user.
- Explain uncertainty where necessary.
- Never encourage illegal actions or create unnecessary fear.
- This is legal awareness, not a substitute for a qualified lawyer.

Return ONLY valid JSON in this structure:

{{
    "analysis": "Concise situation analysis",
    "guidelines": "Concise practical legal guidance"
}}

User's problem:
{problem}
""",

            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                max_output_tokens=2200,
                temperature=0.2
            )
        )

        if not response.text:
            return jsonify({
                "error": "empty_response",
                "message": "No response was generated. Please try again."
            }), 502

        result = json.loads(response.text)

        analysis_text = result.get("analysis")
        guidelines_text = result.get("guidelines")

        if not isinstance(analysis_text, str) or not analysis_text.strip():
            raise ValueError("Analysis is missing from Gemini response")

        if not isinstance(guidelines_text, str) or not guidelines_text.strip():
            raise ValueError("Guidelines are missing from Gemini response")

        return jsonify({
            "analysis": analysis_text,
            "guidelines": guidelines_text
        }), 200

    except ServerError as e:
        app.logger.exception("Gemini server error")

        return jsonify({
            "error": "ai_service_unavailable",
            "message": "The AI service is temporarily busy. Please try again shortly."
        }), 503

    except ClientError as e:
        app.logger.exception("Gemini API request failed")

        if e.code == 429:
            return jsonify({
                "error": "quota_exceeded",
                "message": "NyayaSaathi has reached its AI request limit for now. Please try again later."
            }), 429

        return jsonify({
            "error": "ai_service_error",
            "message": "We couldn't process your problem right now. Please try again later."
        }), 502

    except json.JSONDecodeError:
        app.logger.exception("Invalid JSON received from Gemini")

        return jsonify({
            "error": "invalid_response",
            "message": "We couldn't process the generated response. Please try again."
        }), 502

    except Exception:
        app.logger.exception("Unexpected error in /analyse")

        return jsonify({
            "error": "server_error",
            "message": "Something went wrong. Please try again later."
        }), 500


if __name__ == "__main__":
    app.run(debug=True)
