import Head from "next/head";
import Image from "next/image";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { FormEvent, useState } from "react";
import Spotify from "spotify-web-api-js";
import type { SpotifySearchInterface } from "@/types/interface";
import { useSession, signIn, signOut } from "next-auth/react";
import { Spotify as InternalSpotify } from "@/utils/spotifyservice";
import { PlaylistInterface } from "@/types/playlist";

const inter = Inter({ subsets: ["latin"] });

export async function getStaticProps() {
  const client_id = process.env.CLIENT_ID;
  const client_secret = process.env.CLIENT_SECRET;

  const authOptions = {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(client_id + ":" + client_secret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  };

  const token = await fetch(
    "https://accounts.spotify.com/api/token",
    authOptions
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      }
    })
    .then((data) => {
      const token = data.access_token;
      return token;
    })
    .catch((error) => {
      console.error(error);
    });

  return {
    props: {
      token,
    },
  };
}

export default function Home({ token }: { token: string }) {
  const { data: session } = useSession();
  const accessToken = session?.accessToken ?? token;
  const [playlistWord, setPlaylistWord] = useState<string>("");
  const [songs, setSongs] = useState<SpotifySearchInterface[]>([]);
  const [playlist, setPlaylist] = useState<{ name: string; desc?: string }>({
    name: playlistWord,
    desc: "",
  });

  const spotifyApi = new Spotify();
  spotifyApi.setAccessToken(accessToken);

  async function getUser() {
    const user = await spotifyApi
      .getMe()
      .then((response) => {
        const id: string = response.id;
        const display_name = response.display_name;
        return { id, display_name };
      })
      .catch((error) => {
        console.error("Error getting user ID:", error);
      });

    return user;
  }

  async function getTracks(track: string) {
    spotifyApi.searchTracks(track).then(
      (data) => {
        setSongs((prev: any[]) => [...prev, { chunkChar: track, data }]);
      },
      (err) => {
        console.error("err", err);
      }
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const isEmpty = playlistWord.length === 0;
    if (isEmpty) return;
    const chunks = playlistWord.split(",").map((chunk) => chunk.trim());

    chunks.map((track) => {
      return getTracks(track);
    });
  };

  const [selected, setStore] = useState<{ [key: string]: boolean }>({});

  const toggleOption = (trackName: string) => {
    if (selected[trackName]) {
      setStore({
        ...selected,
        [trackName]: false,
      });
    } else {
      setStore({
        ...selected,
        [trackName]: true,
      });
    }
  };

  const allSelected = Object.keys(selected).filter(
    (key) => selected[key] === true
  );

  console.log("allSelcted", allSelected);

  const iSpotify = new InternalSpotify();
  iSpotify.setAccessToken(accessToken);

  async function createPlaylist() {
    console.log("create playlist");
    if (allSelected.length === 0) {
      console.log("Select Something");
      return;
    }

    if (session?.accessToken === undefined) return;
    if (playlist.name.length === 0) return;
    console.log("starting");

    const user = await getUser();
    const id = user.id;
    console.log(id);

    const plalistDetails = {
      userId: id,
      name: playlist.name,
      desc: playlist.desc,
    };

    const createPlaylist = await iSpotify
      .createPlaylist(plalistDetails)
      .then((response) => response.json())
      .then((data: PlaylistInterface) => {
        return data;
      })
      .catch((error) => console.error(error));
    console.log("createPlaylist", createPlaylist);

    addSelectedToPlaylist(createPlaylist.id);
  }

  async function addSelectedToPlaylist(id) {
    const playlistDetails = {
      playlist_id: id,
      track_uris: allSelected,
    };
    iSpotify.addTracksToPlaylist(playlistDetails);
  }
  return (
    <>
      <Head>
        <title>WordPlaylist</title>
        <meta name="description" content="Create a spotify playlist of words" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1>Words Playlist</h1>
          <span></span>
          <p>
            Create a playlist from words for fun or to send to someone special
            :)
          </p>
        </header>

        <section className={styles.content}>
          <form action="" onSubmit={handleSubmit}>
            <label htmlFor="words">
              Type in the words you&apos;d like to use, separated with commas
            </label>
            <input
              value={playlistWord}
              onChange={(e) => setPlaylistWord(e.target.value)}
              type="text"
              name="words"
              placeholder="Be my, valentine"
            />

            <button disabled={playlistWord.length === 0} type="submit">
              Search Spotify
            </button>
          </form>

          {songs.length === 0 ? null : (
            <>
              <section className={styles.song__wrapper}>
                {songs.map((tracks, index) => (
                  <div className={styles.songs__list} key={index}>
                    <h1>For: {tracks.chunkChar}</h1>

                    <ul className={styles.songs}>
                      {tracks.data.tracks.items.map((track, idx) => (
                        <>
                          {track.album.album_type === "single" ? (
                            <li
                              key={track.uri}
                              onClick={() => toggleOption(track.uri)}
                            >
                              <input
                                type="checkbox"
                                checked={selected[track.uri]}
                              />
                              <p>
                                {track.name}{" "}
                                {track.artists.map((artist, idx: number) => (
                                  <>
                                    {track.artists.length === 1 ? (
                                      <span key={artist.name}>
                                        by {artist.name}.
                                      </span>
                                    ) : null}

                                    {track.artists.length > 1 &&
                                    idx !== track.artists.length - 1 ? (
                                      <span key={artist.name}>
                                        by {artist.name},{" "}
                                      </span>
                                    ) : null}

                                    {track.artists.length > 1 &&
                                    idx === track.artists.length - 1 ? (
                                      <span key={artist.name}>
                                        and {artist.name}.
                                      </span>
                                    ) : null}
                                  </>
                                ))}
                              </p>
                            </li>
                          ) : null}
                        </>
                      ))}
                    </ul>
                  </div>
                ))}
              </section>
            </>
          )}
        </section>

        <div className={styles.create_playlist}>
          <input
            value={playlist.name}
            onChange={(e) => setPlaylist({ name: e.target.value })}
            type="text"
            name="playlistName"
          />

          <button onClick={createPlaylist}>Create Playlist</button>

          <button onClick={() => signIn("spotify")}> Sign In</button>
          <button onClick={() => signOut()}> Sign Out</button>
          <button onClick={getUser}> Get User</button>
        </div>
      </main>
    </>
  );
}
