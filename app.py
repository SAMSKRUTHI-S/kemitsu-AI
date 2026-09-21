import os
import sqlite3
import urllib.parse
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "demon_slayer_hashira_secret_key_8841")
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)

DB_PATH = "demon_slayer_chat.db"

# -------------------------------------------------------------
# Database Setup & Helpers
# -------------------------------------------------------------
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        rank TEXT DEFAULT 'Mizunoto',
        breathing_style TEXT DEFAULT 'Water Breathing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # Conversations table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS conversations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
    """)
    
    # Messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        conversation_id INTEGER NOT NULL,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        message_type TEXT DEFAULT 'text',
        image_url TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE
    )
    """)
    
    conn.commit()
    conn.close()

# Initialize DB
init_db()

# -------------------------------------------------------------
# Authentication Decorator
# -------------------------------------------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            if request.path.startswith("/api/"):
                return jsonify({
                    "error": "Session expired or warrior unauthenticated. Please log in or enter as Guest.",
                    "session_expired": True
                }), 401
            return redirect(url_for("login_page"))
        return f(*args, **kwargs)
    return decorated_function

# -------------------------------------------------------------
# Groq & Breathing Form System Prompts
# -------------------------------------------------------------
BREATHING_PERSONAS = {
    "Water": (
        "You are the Water Breathing AI Assistant (inspired by Giyu Tomioka & Tanjiro Kamado). "
        "Your responses are calm, adaptive, clear, and fluid. You solve problems with serene precision, "
        "weaving subtle Water Breathing metaphors (calm surface, flowing strike, total concentration) "
        "while providing thoroughly helpful, accurate, and structured answers like ChatGPT."
    ),
    "Flame": (
        "You are the Flame Breathing AI Assistant (inspired by Kyojuro Rengoku). "
        "Your tone is passionately enthusiastic, inspiring, and noble ('Set your heart ablaze!'). "
        "You deliver motivating, dynamic, and clear explanations with blazing energy and courage."
    ),
    "Thunder": (
        "You are the Thunder Breathing AI Assistant (inspired by Zenitsu Agatsuma). "
        "Your style is lightning-fast, ultra-concise, and laser-focused ('First Form: Thunderclap and Flash'). "
        "Deliver rapid, high-impact bullet points and instant solutions without unnecessary fluff."
    ),
    "Sun": (
        "You are the Sun Breathing / Hinokami Kagura AI Assistant (the origin of all techniques). "
        "Your responses are profoundly insightful, comprehensive, masterful, and illuminate complex concepts "
        "with deep clarity and warmth."
    ),
    "Beast": (
        "You are the Beast Breathing AI Assistant (inspired by Inosuke Hashibira). "
        "You are bold, fierce, direct, full of raw wild energy, and tackle challenges head-on "
        "with unyielding confidence while still being genuinely helpful."
    ),
    "Standard": (
        "You are a helpful, brilliant AI assistant with the intelligence and formatting precision of ChatGPT, "
        "infused with subtle Demon Slayer anime charm. You format responses beautifully with markdown and code snippets."
    )
}

AVAILABLE_MODELS = [
    {"id": "groq/compound-mini", "name": "Groq Compound Mini (Thunderclap Speed)", "speed": "Lightning"},
    {"id": "groq/compound", "name": "Groq Compound (Hashira Blade)", "speed": "Master"},
    {"id": "qwen/qwen3.8-27b", "name": "Qwen 3.8 27B (Hashira Grade)", "speed": "Fast"},
    {"id": "openai/gpt-oss-120b", "name": "GPT OSS 120B (Sun Master)", "speed": "Profound"},
    {"id": "openai/gpt-oss-20b", "name": "GPT OSS 20B (Flame Power)", "speed": "Very Fast"}
]

# Fallback model chain (in priority order - all verified working on this account)
FALLBACK_MODELS = [
    "groq/compound-mini",
    "groq/compound",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]

def query_groq_api(messages, model=None, max_tokens=800):
    load_dotenv(override=True)
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    
    if not api_key or api_key == "your_groq_api_key_here":
        return {
            "error": True,
            "message": (
                "⚠️ **Demon Slayer Corps Kasugai Dispatch:**\n\n"
                "No valid `GROQ_API_KEY` was detected in your `.env` file.\n\n"
                "**How to awaken the AI:**\n"
                "1. Open the `.env` file in the project directory.\n"
                "2. Replace `your_groq_api_key_here` with your actual key from [Groq Cloud Console](https://console.groq.com/keys).\n"
                "3. Save the file and send your message again!\n\n"
                "*Note: You can still generate Demon Slayer art using the Nichirin Canvas!*"
            )
        }

    # Resolve model to one in our available list
    if not model or model not in FALLBACK_MODELS:
        model = os.getenv("DEFAULT_MODEL", "groq/compound-mini")
    
    # Build ordered model list starting with chosen model
    model_queue = [model] + [m for m in FALLBACK_MODELS if m != model]

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        
        last_error = None
        for try_model in model_queue:
            # Progressive token reduction on retries for rate limits
            for try_tokens in [max_tokens, 500, 300]:
                try:
                    chat_completion = client.chat.completions.create(
                        messages=messages,
                        model=try_model,
                        temperature=0.7,
                        max_tokens=try_tokens,
                    )
                    content = chat_completion.choices[0].message.content or ""
                    # Skip empty content (e.g. reasoning models without enough output tokens)
                    if not content.strip():
                        continue
                    return {
                        "error": False,
                        "content": content,
                        "model_used": try_model
                    }
                except Exception as e:
                    last_error = e
                    err_str = str(e).lower()
                    # Only retry lower tokens for rate/token errors
                    if "429" in err_str or "rate_limit" in err_str or "otpm" in err_str or "rph" in err_str or "tokens" in err_str:
                        continue
                    # For model errors (e.g. 404), skip immediately to next model
                    break
        
        # All models failed
        err_msg = str(last_error) if last_error else "Rate limit reached"
        return {"error": True, "message": f"⚠️ All Demon Slayer AI models are currently busy or rate limited. Please take a deep breath and try again shortly!\n\n*(Notice: {err_msg[:120]})*"}

    except ImportError:
        # Fallback: direct HTTP request
        import requests
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        for try_model in model_queue:
            payload = {
                "model": try_model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": max_tokens
            }
            try:
                res = requests.post("https://api.groq.com/openai/v1/chat/completions", json=payload, headers=headers, timeout=30)
                if res.status_code == 200:
                    data = res.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if content and content.strip():
                        return {"error": False, "content": content, "model_used": try_model}
            except Exception as e:
                pass
        return {"error": True, "message": "⚠️ Connection error contacting Groq API. Please verify your connection."}
    except Exception as e:
        return {"error": True, "message": f"⚠️ Error contacting Groq API: {str(e)}"}

# -------------------------------------------------------------
# Authentication Routes
# -------------------------------------------------------------
@app.route("/login")
def login_page():
    if "user_id" in session:
        return redirect(url_for("chat_page"))
    return render_template("login.html")

@app.route("/api/login", methods=["POST"])
def api_login():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()

    if not username or not password:
        return jsonify({"success": False, "message": "Username and password are required."}), 400

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user["password_hash"], password):
        session.permanent = True
        session["user_id"] = user["id"]
        session["username"] = user["username"]
        session["rank"] = user["rank"]
        return jsonify({"success": True, "username": user["username"], "rank": user["rank"]})
    
    return jsonify({"success": False, "message": "Invalid username or password. Please verify your credentials."}), 401

@app.route("/api/signup", methods=["POST"])
def api_signup():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    breathing = data.get("breathing_style", "Water").strip()

    if not username or not password:
        return jsonify({"success": False, "message": "All fields are required."}), 400
    
    if len(password) < 4:
        return jsonify({"success": False, "message": "Password must be at least 4 characters long."}), 400

    conn = get_db()
    cursor = conn.cursor()
    try:
        pw_hash = generate_password_hash(password)
        cursor.execute(
            "INSERT INTO users (username, password_hash, rank, breathing_style) VALUES (?, ?, ?, ?)",
            (username, pw_hash, "Kanoe (Demon Slayer)", breathing)
        )
        conn.commit()
        user_id = cursor.lastrowid
        session.permanent = True
        session["user_id"] = user_id
        session["username"] = username
        session["rank"] = "Kanoe (Demon Slayer)"
        conn.close()
        return jsonify({"success": True, "username": username, "rank": "Kanoe (Demon Slayer)"})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"success": False, "message": "This warrior name is already registered. Choose another."}), 409

@app.route("/api/guest", methods=["POST"])
def api_guest():
    guest_name = f"CorpsRecruit_{int(datetime.now().timestamp()) % 10000}"
    conn = get_db()
    cursor = conn.cursor()
    pw_hash = generate_password_hash("demon_slayer_guest")
    cursor.execute(
        "INSERT INTO users (username, password_hash, rank, breathing_style) VALUES (?, ?, ?, ?)",
        (guest_name, pw_hash, "Mizunoto (Recruit)", "Water")
    )
    conn.commit()
    user_id = cursor.lastrowid
    session.permanent = True
    session["user_id"] = user_id
    session["username"] = guest_name
    session["rank"] = "Mizunoto (Recruit)"
    conn.close()
    return jsonify({"success": True, "username": guest_name, "rank": "Mizunoto (Recruit)"})

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login_page"))

# -------------------------------------------------------------
# Main Chat UI Route
# -------------------------------------------------------------
@app.route("/")
@login_required
def chat_page():
    return render_template(
        "index.html",
        username=session.get("username", "Warrior"),
        rank=session.get("rank", "Mizunoto"),
        models=AVAILABLE_MODELS
    )

# -------------------------------------------------------------
# Conversation Management APIs
# -------------------------------------------------------------
@app.route("/api/conversations", methods=["GET"])
@login_required
def get_conversations():
    user_id = session["user_id"]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE user_id = ? ORDER BY updated_at DESC",
        (user_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    conversations = [dict(row) for row in rows]
    return jsonify({"conversations": conversations})

@app.route("/api/conversations", methods=["POST"])
@login_required
def create_conversation():
    user_id = session["user_id"]
    data = request.get_json() or {}
    title = data.get("title", "New Mission Scroll").strip()

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
        (user_id, title)
    )
    conn.commit()
    conv_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": conv_id, "title": title})

@app.route("/api/conversations/<int:conv_id>", methods=["GET"])
@login_required
def get_conversation_messages(conv_id):
    user_id = session["user_id"]
    conn = get_db()
    cursor = conn.cursor()
    
    # Check ownership
    cursor.execute("SELECT id, title FROM conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
    conv = cursor.fetchone()
    if not conv:
        conn.close()
        return jsonify({"error": "Conversation not found"}), 404
        
    cursor.execute(
        "SELECT id, sender, content, message_type, image_url, timestamp FROM messages WHERE conversation_id = ? ORDER BY id ASC",
        (conv_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    messages = [dict(row) for row in rows]
    return jsonify({"conversation": dict(conv), "messages": messages})

@app.route("/api/conversations/<int:conv_id>", methods=["DELETE"])
@login_required
def delete_conversation(conv_id):
    user_id = session["user_id"]
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM messages WHERE conversation_id = ? AND conversation_id IN (SELECT id FROM conversations WHERE user_id = ?)", (conv_id, user_id))
    cursor.execute("DELETE FROM conversations WHERE id = ? AND user_id = ?", (conv_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# -------------------------------------------------------------
# Image Generation Route ("Nichirin Canvas")
# -------------------------------------------------------------
@app.route("/api/generate-image", methods=["POST"])
@login_required
def generate_image():
    data = request.get_json() or {}
    prompt = data.get("prompt", "").strip()
    conv_id = data.get("conversation_id")
    style = data.get("style", "demon_slayer")

    if not prompt:
        return jsonify({"error": "Please describe what image you want to generate."}), 400

    # Ensure conversation exists
    user_id = session["user_id"]
    conn = get_db()
    cursor = conn.cursor()
    
    if not conv_id:
        cursor.execute(
            "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
            (user_id, f"Art: {prompt[:24]}...")
        )
        conn.commit()
        conv_id = cursor.lastrowid
    
    # Enhance prompt based on Demon Slayer aesthetic or custom style
    style_modifiers = {
        "demon_slayer": "Kimetsu no Yaiba Demon Slayer anime style, Ufotable animation masterpiece, vivid atmospheric lighting, stunning particle effects, highly detailed cinematic anime art",
        "japanese_ink": "Traditional Japanese Sumi-e ink wash style, ukiyo-e woodblock print, elegant watercolor brushstrokes, feudal Japan atmosphere",
        "cinematic": "cinematic dramatic lighting, photorealistic 8k, hyper-detailed, octane render, masterpiece",
        "chibi": "cute chibi anime style, Demon Slayer mini character, vibrant colors, kawaii aesthetic"
    }
    
    enhancer = style_modifiers.get(style, style_modifiers["demon_slayer"])
    full_prompt = f"{prompt}, {enhancer}"
    encoded_prompt = urllib.parse.quote(full_prompt)
    
    # High-quality Pollinations Flux endpoint (fast, zero key required)
    seed = int(datetime.now().timestamp() * 1000) % 999999
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed={seed}&nologo=true&enhance=true&model=flux&safe=false"

    # Store user prompt and generated image in conversation
    cursor.execute(
        "INSERT INTO messages (conversation_id, sender, content, message_type) VALUES (?, 'user', ?, 'text')",
        (conv_id, f"🎨 [Nichirin Canvas] Generate: {prompt}")
    )
    cursor.execute(
        "INSERT INTO messages (conversation_id, sender, content, message_type, image_url) VALUES (?, 'assistant', ?, 'image', ?)",
        (conv_id, f"Here is your rendered vision of **{prompt}** summoned through the Nichirin Canvas!", image_url)
    )
    cursor.execute("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (conv_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "image_url": image_url,
        "prompt": prompt,
        "conversation_id": conv_id
    })

# -------------------------------------------------------------
# Chat Completion Route
# -------------------------------------------------------------
@app.route("/api/chat", methods=["POST"])
@login_required
def api_chat():
    data = request.get_json() or {}
    message_text = data.get("message", "").strip()
    conv_id = data.get("conversation_id")
    breathing_mode = data.get("breathing_mode", "Water")
    model = data.get("model", "groq/compound-mini")

    if not message_text:
        return jsonify({"error": "Message cannot be empty."}), 400

    user_id = session["user_id"]
    conn = get_db()
    cursor = conn.cursor()

    # Create conversation if not provided
    if not conv_id:
        title = message_text[:30] + ("..." if len(message_text) > 30 else "")
        cursor.execute(
            "INSERT INTO conversations (user_id, title) VALUES (?, ?)",
            (user_id, title)
        )
        conn.commit()
        conv_id = cursor.lastrowid
    else:
        # Check title update if first message
        cursor.execute("SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?", (conv_id,))
        count = cursor.fetchone()["count"]
        if count == 0:
            title = message_text[:30] + ("..." if len(message_text) > 30 else "")
            cursor.execute("UPDATE conversations SET title = ? WHERE id = ?", (title, conv_id))

    # Check for direct image prompt command: /image or /imagine or explicit image generation request
    lower_msg = message_text.lower()
    if message_text.startswith("/image ") or message_text.startswith("/imagine ") or lower_msg.startswith("generate image:") or lower_msg.startswith("draw:"):
        # Strip command
        if message_text.startswith("/image "):
            img_prompt = message_text[7:].strip()
        elif message_text.startswith("/imagine "):
            img_prompt = message_text[9:].strip()
        elif lower_msg.startswith("generate image:"):
            img_prompt = message_text[15:].strip()
        else:
            img_prompt = message_text[5:].strip()

        cursor.close()
        conn.close()
        # Direct to image generator
        return generate_image_internal(img_prompt, conv_id)

    # Save user message in DB
    cursor.execute(
        "INSERT INTO messages (conversation_id, sender, content, message_type) VALUES (?, 'user', ?, 'text')",
        (conv_id, message_text)
    )
    conn.commit()

    # Retrieve message history for context (last 6 messages to stay under OTPM limits)
    cursor.execute(
        "SELECT sender, content FROM messages WHERE conversation_id = ? AND message_type = 'text' ORDER BY id DESC LIMIT 6",
        (conv_id,)
    )
    history_rows = cursor.fetchall()
    history_rows.reverse()

    system_instruction = BREATHING_PERSONAS.get(breathing_mode, BREATHING_PERSONAS["Water"])
    
    groq_messages = [{"role": "system", "content": system_instruction}]
    for row in history_rows:
        role = "user" if row["sender"] == "user" else "assistant"
        groq_messages.append({"role": role, "content": row["content"]})

    # Query Groq API
    result = query_groq_api(groq_messages, model=model)

    is_error = result.get("error", False)
    if is_error:
        reply_content = result["message"]
    else:
        reply_content = result["content"]

    # Save assistant message
    cursor.execute(
        "INSERT INTO messages (conversation_id, sender, content, message_type) VALUES (?, 'assistant', ?, 'text')",
        (conv_id, reply_content)
    )
    cursor.execute("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (conv_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": not is_error,
        "conversation_id": conv_id,
        "reply": reply_content,
        "breathing_mode": breathing_mode,
        "is_error": is_error
    })

def generate_image_internal(prompt, conv_id):
    conn = get_db()
    cursor = conn.cursor()

    enhancer = "Kimetsu no Yaiba Demon Slayer anime style, Ufotable animation masterpiece, vivid atmospheric lighting, stunning particle effects, highly detailed cinematic anime art"
    full_prompt = f"{prompt}, {enhancer}"
    encoded_prompt = urllib.parse.quote(full_prompt)
    seed = int(datetime.now().timestamp() * 1000) % 999999
    image_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&seed={seed}&nologo=true&enhance=true&model=flux&safe=false"

    cursor.execute(
        "INSERT INTO messages (conversation_id, sender, content, message_type) VALUES (?, 'user', ?, 'text')",
        (conv_id, f"🎨 [Nichirin Canvas] {prompt}")
    )
    reply_text = f"Behold! The Nichirin Canvas has materialized your vision of: **{prompt}**"
    cursor.execute(
        "INSERT INTO messages (conversation_id, sender, content, message_type, image_url) VALUES (?, 'assistant', ?, 'image', ?)",
        (conv_id, reply_text, image_url)
    )
    cursor.execute("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?", (conv_id,))
    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "conversation_id": conv_id,
        "reply": reply_text,
        "image_url": image_url,
        "is_image": True
    })

if __name__ == "__main__":
    import sys
    try:
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

    port = int(os.getenv("PORT", 5000))
    print(f"[*] Demon Slayer Groq Chatbot is running at http://127.0.0.1:{port}")
    app.run(host="0.0.0.0", port=port, debug=False)
