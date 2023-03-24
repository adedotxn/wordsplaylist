import { signIn } from "next-auth/react";
import Image from "next/image";
import styles from "./modal.module.css";


const Modal = ({closeModal} : {closeModal : () => void}) => {
  return (
    <section className={styles.overlay}>
      <div className={styles.modal}>
        <div>
          <button onClick={closeModal} className={styles.close}> X </button>
          <span>
            WordsPlaylist needs your permission to search and create the playlist for you so please
            sign in to spotify to continue :)
          </span>
          <button onClick={() => signIn("spotify")} className={styles.sign}> 
          <Image src='/spotify.svg' alt="spotify_logo" width={25} height={25} />
          Sign In</button>
        </div>
      </div>
    </section>
  );
};

export default Modal;
