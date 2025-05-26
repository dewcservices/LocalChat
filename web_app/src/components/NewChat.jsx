import { A, useNavigate } from '@solidjs/router';
import styles from './NewChat.module.css';

import { newChatId, createNewChat, saveMessages } from '../utils/ChatHistory';


function NewChat() {

  const navigate = useNavigate();

  const newSummarizeChat = () => {
    let newId = newChatId();
    let currentDate = Date.now();

    createNewChat(newId, 'summarize', currentDate);
    saveMessages(newId, currentDate,
      [{sender: 'chatbotMessage', date: currentDate, 
        content: "Hi, I can summarize information for you. Please enter some text or a file and I'll summarize the contents."}]
    );

    navigate(`/chat/${newId}`);
  };

  const newGeneralChat = () => {
    let newId = newChatId();
    let currentDate = Date.now();

    createNewChat(newId, 'general', currentDate);
    saveMessages(newId, currentDate,
      [{sender: 'chatbotMessage', date: currentDate, content: "Hi, this is a general chat where we can have conversations."}]
    );

    navigate(`/chat/${newId}`);
  };

  const newQuestionAnswerChat = () => {
    let newId = newChatId();
    let currentDate = Date.now();

    createNewChat(newId, 'question-answer', currentDate);
    saveMessages(newId, currentDate,
      [{sender: 'chatbotMessage', date: currentDate, content: "Hi, this is a question-answer chat where I can provide an answer based on some input text."}]
    );

    navigate(`/chat/${newId}`);
  };

  return (
    <>
      <div class={styles.newChat}>
        <h2>Select an option:</h2>
        <div class={styles.newChatButtons}>
          <button onclick={newSummarizeChat}>Summarize Text</button>
          <button onClick={newQuestionAnswerChat}>Ask Question</button>
          <button onclick={newGeneralChat}>General Chat</button>
          <A href="/models">Model Testing</A>
        </div>
      </div>
    </>
  );
}

export default NewChat;
