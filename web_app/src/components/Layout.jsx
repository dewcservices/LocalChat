import { createSignal, createEffect } from "solid-js";
import { useLocation, useNavigate, A } from "@solidjs/router";

import styles from './Layout.module.css';
import { getChatHistories, deleteChatHistories, deleteChatHistory, renameChat } from "../utils/ChatHistory";


function Layout(props) {
  // TODO polish deletion of entire chat history
  //    - ui button is ugly, and needs to be clearer that the button is dangerous
  // TODO add styling to chat links (& highlight current chat)
  // TODO chat link order based on most recently accessed?

  const location = useLocation();
  const navigate = useNavigate();

  const [chats, setChats] = createSignal(getChatHistories());
  const [renamingId, setRenamingId] = createSignal(null);
  const [newTitle, setNewTitle]  = createSignal("");

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
  
  // start renaming mode for a given chat
  const startRenaming = (chatId) => {
    setRenamingId(chatId);
    const chat = chats().find(c => c.chatId === chatId);
    setNewTitle(chat?.title || chat.chatId);
  };

  // apply and save new title
  const applyRename = () => {
    renameChat(renamingId(), newTitle());
    setChats(getChatHistories());
    setRenamingId(null);
  };

  return (
    <>
      <div class="container">
        <div class="sidebarContainer">

          <h1>Local Chat</h1>
          <A href="models">Model Testing</A>
          <br/><br/>
          <A href="/">Create New Chat</A>
          <br/><br/>

          <h2>Chat History</h2>
          <For each={chats()}>{(chat) =>
            <div class={styles.chatHistoryContainer}>
              {/* TODO make the latest message date update for each new message sent */}
              <Show
                when={renamingId() === chat.chatId}
                fallback={
                  <div class={styles.chatHistoryEntry}>
                    <A 
                      href={`/${chat.chatType}/${chat.chatId}`}
                      title={
                        "Created: " + new Date(chat.creationDate).toUTCString() +
                        " | Latest: " + new Date(chat.latestMessageDate).toUTCString()
                      }
                    >
                      {chat.chatName}
                    </A>
                    <div>
                      <button onClick={() => startRenaming(chat.chatId)}>Rename</button>
                      <button onClick={() => deleteChat(chat.chatId)}>Delete</button>
                    </div>
                  </div>
                }
              >
                {/* section handling renaming UI */}
                <input type="text" value={newTitle()}
                  onInput={e => setNewTitle(e.currentTarget.value)}
                  onKeyDown={e => e.key === 'Enter' && applyRename()}
                  style="margin-right:0.5em; width: 200px;"
                />
                <button onClick={applyRename}>Save</button>
                <button onClick={() => setRenamingId(null)}>Cancel</button>
              </Show>
            </div>
          }</For>
          <br/>

          <button onClick={deleteAllChats}>Delete Chat History</button>
          <br />
        </div>
        <div class="pageContainer">
          {props.children} {/* nested components are passed in here */}
        </div>
      </div>
    </>
  );
}

export default Layout;
