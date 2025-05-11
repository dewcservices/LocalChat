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

  // updates the chat history
  createEffect(() => {
    let chatList = getChatHistories();
    
    // order chat history
    // FIXME does not update order when a new message is added to a chat
    chatList.sort((c1, c2) => c2.latestMessageDate - c1.latestMessageDate);
    setChats(chatList);

    location.pathname;  // whenever the URL changes, re-fetch the chat history
  });
  
  const deleteChat = (chatId) => {
    if (!confirm("are you sure you want to remove this history?")) return;

    deleteChatHistory(chatId);
    setChats(getChatHistories());

    if (location.pathname.includes(chatId)) {
      navigate('/');
    }
  };

  const deleteAllChats = () => {
    if (!confirm("Are you sure you want to remove all chat histories.")) return;
    if (!confirm("This is a confirmation check to ensure that this is really what you want to do.")) return;

    deleteChatHistories();
    navigate('/');
    setChats([]);
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
            <div style="display:flex;justify-content:space-between;align-items:center;padding-left:6em;padding-right:6em;">
              {/* TODO make the latest message date update for each new message sent */}
              <A 
                href={`/${chat.chatType}/${chat.chatId}`} 
                title={"creationDate: " + new Date(chat.creationDate).toUTCString() + 
                  " LatestMessageDate: " + new Date(chat.latestMessageDate).toUTCString()}
              >
                {chat.chatId}
              </A>
              <button onClick={() => {deleteChat(chat.chatId);}}>Delete</button>
            </div>
          }</For>
          <br/>

          <button onClick={deleteAllChats}>Delete Chat History</button>
        </div>
        <div class="pageContainer">
          {props.children} {/* nested components are passed in here */}
        </div>
      </div>
    </>
  );
}

export default Layout;
