import os

def get_secret(key_name: str) -> str:
    """
    Mengambil API Key dari Environment Variable (VPS/Local)
    atau Google Colab Secrets (jika di Colab).
    """
    # 1. Prioritas: OS Environment Variable (misal di .env atau server)
    val = os.environ.get(key_name)
    if val:
        return val
    
    # 2. Alternatif: Google Colab Secrets
    try:
        from google.colab import userdata
        return userdata.get(key_name)
    except (ImportError, Exception):
        # Jika bukan di Colab atau key tidak ditemukan
        return ""

# Contoh penggunaan untuk API keys
GROQ_API_KEY = get_secret("GROQ_API_KEY")
GEMINI_API_KEY = get_secret("GEMINI_API_KEY")
GH_TOKEN = get_secret("GH_TOKEN")
