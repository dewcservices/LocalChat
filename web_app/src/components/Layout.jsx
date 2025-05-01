import { createSignal, createEffect } from "solid-js";
import { useLocation, useNavigate, A } from "@solidjs/router";

import { getChatHistories, deleteChatHistories, deleteChatHistory } from "../utils/ChatHistory";


function Layout(props) {
  // TODO polish deletion of entire chat history
  //    - currently reloads entire page
  //    - ui button is ugly, and needs to be clearer that the button is dangerous
  // TODO add styling to chat links (& highlight current chat)
  // TODO chat link order based on most recently accessed?

  const location = useLocation();
  const navigate = useNavigate();

  const [chats, setChats] = createSignal(getChatHistories());

  // whenever the URL changes, re-fetch the chat history
  createEffect(() => {
    setChats(getChatHistories());
    location.pathname; // reactive dependency
  });

  const handleChatDeletion = (chatId = null) => {

    // handle a single chat removal.
    if (chatId != null) {
      if (confirm("are you sure you want to remove this history?")) {
        deleteChatHistory(chatId);
        setChats(getChatHistories());

        if (location.pathname.includes(chatId)) {
          navigate('/');
        }
      }

    // handle deletion of multiple chat histories.
    } else {
      if (confirm("Are you sure you want to remove all chat histories.")) {
        if (confirm("This is a confirmation check to ensure that this is really what you want to do.")) {
          deleteChatHistories();
          navigate('/');
        }
      }
    }
  };

  return (
    <>
      <div class="container">
        <div class="sidebarContainer">
          <h1>Local Chat</h1>
          <A href="/">Create New Chat</A>
          <br/><br/>
          <h2>Chat History</h2>
          <For each={chats()}>{(chat) =>
            <div style="display:flex;justify-content:space-between;align-items:center;justify-content:center;margin:0.3em 2em;border:1px solid black;">
              {/* TODO make the latest message date update for each new message sent */}
              <A href={`/${chat.chatType}/${chat.chatId}`} title={"creationDate: " + new Date(chat.creationDate).toUTCString() + " LatestMessageDate: " + new Date(chat.latestMessageDate).toUTCString()}>{chat.chatId}</A>
              <button onClick={() => {handleChatDeletion(chat.chatId)}}>Delete</button>
            </div>
          }</For>
          <br/>
          <button onClick={() => {handleChatDeletion();}}>
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
