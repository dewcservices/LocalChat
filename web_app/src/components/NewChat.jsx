import { A } from '@solidjs/router';
import './NewChat.css';


function NewChat() {
  return (
    <>
      <div class="newChat">
        <h2>Select an option:</h2>
        <div class="newChatButtons">
          <A href="/summarize">Summarize Text</A>
          <A href="/">Ask Question</A>
          <A href="/chat">General Chat</A>
          <A href="/">Placeholder 2</A>
        </div>
      </div>
    </>
  );
}

export default NewChat;
