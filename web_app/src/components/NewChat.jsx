import { A } from '@solidjs/router';
import styles from './NewChat.module.css';


function NewChat() {
  return (
    <>
      <div class={styles.newChat}>
        <h2>Select an option:</h2>
        <div class={styles.newChatButtons}>
          <A href="/summarize">Summarize Text</A>
          <A href="/">Ask Question</A>
          <A href="/chat">General Chat</A>
          <A href="/models">Model Testing</A>
        </div>
      </div>
    </>
  );
}

export default NewChat;
