import Head from "next/head";
import { Inter } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { FormEvent, useState } from "react";
import type { SpotifySearchInterface } from "@/types/interface";
import { useSession, signIn, signOut } from "next-auth/react";
import { Spotify as InternalSpotify } from "@/utils/spotifyservice";
import { PlaylistInterface } from "@/types/playlist";
import toast from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const { data: session, status } = useSession();
  const accessToken = session?.accessToken!;
  const [playlistWord, setPlaylistWord] = useState<string>("");
  const [songs, setSongs] = useState<SpotifySearchInterface[]>([]);
  const [playlist, setPlaylist] = useState<{ name: string; desc?: string }>({
    name: playlistWord,
    desc: "",
  });

  const Spotify = new InternalSpotify();
  Spotify.setAccessToken(accessToken);

  async function getUser() {
    const user = await Spotify.getCurrentUser()
      .then(
        (data) => {
          if (data.error) {
            if (data.error.status && data.error.message) {
              toast.error(`${data.error.message} | Logging in again`);
              signIn("spotify");
            }
          }
          return { id: data.id, display_name: data.display_name };
        },
        (error) => {
          console.log("Error: ", error);
        }
      )
      .catch((error) => {
        console.error("Error getting user:", error);
      });

    return user;
  }

  async function getTracks(track: string) {
    Spotify.searchTracks(track)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        if (!response.ok || response.status === 401) {
          toast("Signing you in to spotify...");
          return signIn("spotify");
        }
      })
      .then(
        (data) => {
          if (data === undefined) return;
          setSongs((prev: any[]) => [...prev, { chunkChar: track, data }]);
        },
        (err) => {
          console.error("err", err);
        }
      )
      .catch((error) => {
        console.log("Errr", error);
      });
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

  async function addSelectedToPlaylist(id: string) {
    const playlistDetails = {
      playlist_id: id,
      track_uris: allSelected,
    };
    Spotify.addTracksToPlaylist(playlistDetails)
      .then((data) => {
        return toast.success("Tracks added to playlist");
      })
      .catch((error) => {
        console.log(error);
        return toast.error("Error adding tracks to playlist");
      });
  }

  async function createPlaylist() {
    if (allSelected.length === 0) {
      return toast.error("0 track(s) has been selected. Select something");
    }
    if (session?.accessToken === undefined) {
      toast.error("You're not signed in. Signing you in...");
      return signIn("spotify");
    }
    if (playlist.name.length === 0) {
      return toast.error("Type in a name for your playlist");
    }

    if (status === "unauthenticated") {
      toast("You're not signed in. Trying to sign you in");
      return signIn("spotify");
    }

    const user = await getUser();
    if (user && typeof user.id !== undefined) {
      const id = user.id;

      const plalistDetails = {
        userId: id,
        name: playlist.name,
        desc: playlist.desc,
      };

      const createPlaylist = await Spotify.createPlaylist(plalistDetails)
        .then((data: PlaylistInterface) => {
          toast.success("Playlist Created. Adding songs");
          return data;
        })
        .catch((error) => console.error(error));

      if (createPlaylist && createPlaylist.id !== undefined) {
        addSelectedToPlaylist(createPlaylist.id);
      }
    }
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

              <div className={styles.create_playlist}>
                <label htmlFor="playlistName"> Playlist Name</label>
                <input
                  value={playlist.name}
                  onChange={(e) => setPlaylist({ name: e.target.value })}
                  type="text"
                  name="playlistName"
                  placeholder={playlistWord}
                />

                <button onClick={createPlaylist}>Create Playlist</button>

                {/* <button onClick={() => signIn("spotify")}> Sign In</button> */}
                {/* <button onClick={() => signOut()}> Sign Out</button> */}
                {/* <button onClick={getUser}> Get User</button> */}
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
