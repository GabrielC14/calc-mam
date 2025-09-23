import requests
import base64
import os
from flask import Blueprint, jsonify, request, redirect, url_for, send_from_directory


spotify_bp = Blueprint('spotify_bp', __name__)

# --------------------------------------------------------------------------
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
REDIRECT_URI = os.getenv("REDIRECT_URI", "http://127.0.0.1:5000/callback")

# --------------------------------------------------------------------------
PLAYLIST_IDS = [
    "43zT80Wo1VN2ywsSgm1OuU", # Yasakani no Magatama
    "45012DeZYsX5Gn5RI2wiRb" # Boro Breath
]
# --------------------------------------------------------------------------

AUTH_URL = "https://accounts.spotify.com/authorize"
TOKEN_URL = "https://accounts.spotify.com/api/token"
API_BASE_URL = "https://api.spotify.com/v1/"

def get_refresh_token():
    return os.getenv("SPOTIFY_REFRESH_TOKEN")

def save_refresh_token(token):
    print("="*50)
    print(f"NOVO REFRESH TOKEN GERADO: {token}")
    print("Copie este valor e coloque no seu arquivo .env e nas variáveis de ambiente do Render.")
    print("="*50)

def get_access_token():
    refresh_token = get_refresh_token()
    if not refresh_token:
        return None

    auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}".encode("utf-8")
    auth_b64 = base64.b64encode(auth_str).decode("utf-8")
    headers = {"Authorization": f"Basic {auth_b64}", "Content-Type": "application/x-www-form-urlencoded"}
    data = {"grant_type": "refresh_token", "refresh_token": refresh_token}
    
    response = requests.post(TOKEN_URL, headers=headers, data=data)
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print("Erro ao renovar o token de acesso:", response.json())
        return None

@spotify_bp.route("/login")
def login():
    scope = "user-read-currently-playing user-top-read playlist-read-private user-read-email user-read-private"
    auth_url_full = f"{AUTH_URL}?client_id={CLIENT_ID}&response_type=code&redirect_uri={REDIRECT_URI}&scope={scope}&show_dialog=true"
    return redirect(auth_url_full)

@spotify_bp.route("/callback")
def callback():
    code = request.args.get("code")
    auth_str = f"{CLIENT_ID}:{CLIENT_SECRET}".encode("utf-8")
    auth_b64 = base64.b64encode(auth_str).decode("utf-8")
    headers = {"Authorization": f"Basic {auth_b64}", "Content-Type": "application/x-www-form-urlencoded"}
    data = {"grant_type": "authorization_code", "code": code, "redirect_uri": REDIRECT_URI}
    
    response = requests.post(TOKEN_URL, headers=headers, data=data)
    token_info = response.json()
    
    if "refresh_token" in token_info:
        save_refresh_token(token_info["refresh_token"])
        return redirect(url_for('spotify_bp.now_playing'))
    else:
        return f"Erro ao obter o refresh token: {token_info}", 400


@spotify_bp.route("/api/now-playing")
def now_playing():
    access_token = get_access_token()
    if not access_token: return jsonify({"error": "Auth required", "login_url": url_for('spotify_bp.login')}), 401
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(API_BASE_URL + "me/player/currently-playing", headers=headers)
    if response.status_code == 204: return jsonify({"is_playing": False})
    if response.status_code == 200:
        data = response.json()
        if data and data.get("item"):
            track = {
                "is_playing": data["is_playing"], "song_name": data["item"]["name"],
                "artist_name": ", ".join([a["name"] for a in data["item"]["artists"]]),
                "album_art_url": data["item"]["album"]["images"][0]["url"],
                "progress_ms": data["progress_ms"], "duration_ms": data["item"]["duration_ms"],
                "song_url": data["item"]["external_urls"]["spotify"]
            }
            return jsonify(track)
    return jsonify({"is_playing": False})

@spotify_bp.route("/api/top-tracks")
def top_tracks():
    access_token = get_access_token()
    if not access_token: return jsonify({"error": "Auth required"}), 401
    headers = {"Authorization": f"Bearer {access_token}"}
    params = {"time_range": "short_term", "limit": 10}
    response = requests.get(API_BASE_URL + "me/top/tracks", headers=headers, params=params)
    if response.status_code == 200:
        return jsonify(response.json()["items"])
    return jsonify({"error": "Falha ao buscar top tracks"}), response.status_code

@spotify_bp.route("/api/playlists")
def get_playlists():
    access_token = get_access_token()
    if not access_token:
        return jsonify({"error": "Auth required", "login_url": url_for('spotify_bp.login')}), 401
    
    headers = {"Authorization": f"Bearer {access_token}"}
    all_playlist_data = []

    for playlist_id in PLAYLIST_IDS:
        # 1. Busca os detalhes da playlist
        playlist_response = requests.get(API_BASE_URL + f"playlists/{playlist_id}", headers=headers)
        
        if playlist_response.status_code == 200:
            playlist_data = playlist_response.json()
            
            # 2. Pega a primeira página de músicas
            tracks_data = playlist_data["tracks"]
            all_tracks = tracks_data["items"]
            
            # 3. Executa o loop de paginação para buscar o RESTO das músicas
            next_url = tracks_data.get("next")
            while next_url:
                response = requests.get(next_url, headers=headers)
                if response.status_code == 200:
                    tracks_page = response.json()
                    all_tracks.extend(tracks_page["items"])
                    next_url = tracks_page.get("next")
                else:
                    break # Sai do loop se houver erro
            
            # 4. Substitui as músicas originais pela lista completa e atualiza o total
            playlist_data["tracks"]["items"] = all_tracks
            playlist_data["tracks"]["total"] = len(all_tracks)
            
            all_playlist_data.append(playlist_data)

    return jsonify(all_playlist_data)

@spotify_bp.route("/api/me")
def get_me():
    access_token = get_access_token()
    if not access_token: return jsonify({"error": "Auth required"}), 401
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(API_BASE_URL + "me", headers=headers)
    if response.status_code == 200:
        return jsonify(response.json())
    return jsonify({"error": "Falha ao buscar perfil do utilizador"}), response.status_code

@spotify_bp.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory('.', filename)

@spotify_bp.route("/api/audio-features/<track_id>")
def get_audio_features(track_id):
    access_token = get_access_token()
    if not access_token: return jsonify({"error": "Auth required"}), 401
    
    headers = {"Authorization": f"Bearer {access_token}"}
    response = requests.get(API_BASE_URL + f"audio-features/{track_id}", headers=headers)
    
    if response.status_code == 200:
        return jsonify(response.json())
        
    return jsonify({"error": "Falha ao buscar audio features"}), response.status_code

