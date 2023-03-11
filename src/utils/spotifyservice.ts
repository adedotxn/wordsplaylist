import { PlaylistInterface } from "@/types/playlist";

export class Spotify {
  protected accessToken: string | undefined;
  protected refreshToken: string | undefined;

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken() {
    if (this.accessToken === undefined) return "No access token set";
    return this.accessToken;
  }

  setRefreshToken(token: string) {
    this.refreshToken = token;
  }

  getRefreshToken() {
    if (this.refreshToken === undefined) return "No refresh token set";
    return this.refreshToken;
  }

  getCurrentUser() {
    return fetch("https://api.spotify.com/v1/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    }).then((response) => {
      if (response.ok) {
        return response.json();
      }
    });
  }

  searchTracks(query: string, type: string[] = []) {
    const _type = type.length === 0 ? "track" : type.join(",");
    return fetch(`https://api.spotify.com/v1/search?q=${query}&type=${_type}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  createPlaylist(parans: {
    name: string;
    desc?: string;
    userId: string;
    public?: boolean;
  }) {
    return fetch(
      `https://api.spotify.com/v1/users/${parans.userId}/playlists`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: parans.name,
          description: parans.desc,
          public: parans.public ?? false,
        }),
      }
    ).then((response) => {
      if (response.ok) {
        return response.json();
      }
    });
  }

  addTracksToPlaylist(params: { playlist_id: string; track_uris: string[] }) {
    return fetch(
      `https://api.spotify.com/v1/playlists/${params.playlist_id}/tracks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uris: params.track_uris,
          position: 0,
        }),
      }
    ).then((response) => {
      if (response.ok) {
        return response.json();
      }
    });
  }
}

export {};
