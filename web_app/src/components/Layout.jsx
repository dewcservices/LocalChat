import { createSignal, createEffect } from "solid-js";
import { useLocation } from "@solidjs/router";

import { getChatHistories, deleteChatHistories } from "../utils/ChatHistory";


function Layout(props) {
  // TODO add individual chat deletion
  // TODO polish deletion of entire chat history
  //    - currently reloads entire page
  //    - ui button is ugly, and needs to be clearer that the button is dangerous
  // TODO add styling to chat links (& highlight current chat)
  // TODO chat link order based on most recently accessed?

  const location = useLocation();
  const [chats, setChats] = createSignal(getChatHistories());

  // whenever the URL changes, re-fetch the chat history
  createEffect(() => {
    setChats(getChatHistories());
    location.pathname; // reactive dependency
  });

  return (
    <>
      <div class="container">
        <div class="sidebarContainer">
          <h1>Local Chat</h1>
          <a href="/">Create New Chat</a>
          <br/><br/>
          <h2>Chat History</h2>
          <For each={chats()}>{(chat) =>
            <>
              <a href={`/${chat.chatType}/${chat.chatId}`}>{chat.chatId}</a>
              <br/>
            </>
          }</For>
          <br/>
          <button onClick={() => {deleteChatHistories(); document.location.href = '/';}}>
            Delete Chat History
          </button>
        </div>
        <div class="pageContainer">
          {props.children} {/* nested components are passed in here */}
        </div>
      </div>
    </>
  );
}

export default Layout;
