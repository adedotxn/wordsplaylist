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
    );
  }

  addTracksToPlaylist(params: { playlist_id: string; track_uris: string[] }) {
    if (this.accessToken === undefined) return "No access token set";

    fetch(`https://api.spotify.com/v1/playlists/${params.playlist_id}/tracks`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uris: params.track_uris,
        position: 0,
      }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        console.log("data", data);
      })
      .catch((error) => {
        // handle the error
      });
  }
}

export {};
