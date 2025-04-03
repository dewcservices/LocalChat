import './NewChat.css';

function NewChat() {
  return (
    <>
      <div class="newChat">
        <h2>Select an option:</h2>
        <div class="newChatButtons">
          <a href="/summarize">Summarize Text</a>
          <a>Ask Question</a>
          <a href="/chat">General Chat</a>
          <a>Placeholder 2</a>
        </div>
      </div>
    </>
  );
}

export default NewChat;