# ⚔️ Kimetsu AI - Demon Slayer Themed Groq & Flask Chatbot

An immersive, full-featured AI Chatbot web application inspired by **Demon Slayer: Kimetsu no Yaiba** and powered by the **Groq API** with an OpenAI / ChatGPT-style interface and integrated **Nichirin Canvas** image generation.

![Demon Slayer AI](https://img.shields.io/badge/Theme-Demon_Slayer-red?style=for-the-badge)
![Groq](https://img.shields.io/badge/Inference-Groq_Llama_3.3_70B-orange?style=for-the-badge)
![Flask](https://img.shields.io/badge/Backend-Flask_Python-green?style=for-the-badge)

---

## 🌟 Key Features

1. **Demon Slayer Anime Visual Theme & Animations**:
   - **Water Breathing (`Mizu no Kokyu`)**: Flowing azure/cyan theme with fluid analysis responses.
   - **Flame Breathing (`En no Kokyu`)**: Blazing fiery orange/crimson theme with passionate energy.
   - **Thunder Breathing (`Kaminari no Kokyu`)**: Lightning gold theme with ultra-fast concise responses.
   - **Sun Breathing (`Hinokami Kagura`)**: Solar radiant theme with master-level reasoning.
   - **Beast Breathing (`Kedamono no Kokyu`)**: Savage emerald wild theme with direct answers.
   - **Nichirin Blade Slash Animation**: Real-time sword cutting slash visual FX and blade unsheathe sound effects on every message dispatch.
   - **Dynamic Particle Canvas**: Floating water droplets or rising Hinokami Kagura embers rendered smoothly in 60fps.

2. **OpenAI / ChatGPT Experience**:
   - **Multi-chat scroll history**: Create new mission scrolls, switch between past conversations, rename, or delete scrolls.
   - **Markdown & Code Highlighting**: Automatic code blocks with syntax highlighting (`atom-one-dark`) and one-click **Copy Code** button.
   - **Model Selector**: Switch seamlessly between `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, and `gemma2-9b-it`.
   - **Persistent SQLite Database**: Conversations and user accounts are saved locally in `demon_slayer_chat.db`.

3. **Nichirin Canvas (AI Image Generation)**:
   - Generate anime and cinematic art directly in chat.
   - Type `/image <prompt>` or `/imagine <prompt>` or use the **"🎨 Generate Art"** button modal.
   - In-chat image cards with preview, lightbox zoom inspector, and instant high-res download.

4. **Demon Slayer Corps Authentication Portal**:
   - Login, Sign-up with breathing style selection, or **One-Click Guest Pass** for immediate instant testing.

---

## 🚀 Quick Setup & Installation

### 1. Install Dependencies
Make sure you have Python 3.9+ installed. In your terminal:
```bash
pip install -r requirements.txt
```

### 2. Configure Your Groq API Key
Open `.env` in the root folder and add your free Groq API key:
```ini
GROQ_API_KEY=gsk_your_actual_groq_api_key_here
FLASK_SECRET_KEY=demon_slayer_hashira_secret_key_8841
DEFAULT_MODEL=llama-3.3-70b-versatile
```
> 💡 *Don't have a Groq key yet? Get one for free at [console.groq.com/keys](https://console.groq.com/keys).*

### 3. Run the Application
```bash
python app.py
```

Open your browser and navigate to:
```
http://127.0.0.1:5000
```

---

## 📜 File Structure
```
antigravity/
├── .env                  # Stores your secret GROQ_API_KEY
├── .env.example          # Template configuration
├── .gitignore            # Protects .env and database from git commits
├── requirements.txt      # Python dependencies (Flask, Groq, dotenv, etc.)
├── app.py                # Main Flask backend with SQLite, Auth, & Groq routing
├── templates/
│   ├── login.html        # Demon Slayer Corps Entrance Portal (Login/Signup)
│   └── index.html        # ChatGPT-style Demon Slayer Chatbot Interface
└── static/
    ├── css/
    │   └── style.css     # Complete Demon Slayer visual design system
    └── js/
        ├── sound.js      # Web Audio API sword unsheathe and chime synthesizer
        ├── particles.js  # Dynamic anime breathing particle canvas
        └── chat.js       # OpenAI chat logic, markdown, & image generation
```

---

## ⚔️ Keyboard Shortcuts & Commands
- **Enter**: Unleash strike and send message
- **Shift + Enter**: Add new line
- `/image <prompt>`: Summon Nichirin Canvas artwork directly in conversation
