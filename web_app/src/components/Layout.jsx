import { createSignal, createEffect, For, Show } from "solid-js";
import { useLocation, useParams, useNavigate, A } from "@solidjs/router";

import { ChatHistoriesContext } from "./LayoutChatHistoriesContext";
import styles from './Layout.module.css';
import { getChatHistories, deleteChatHistories, deleteChatHistory, renameChat } from "../utils/ChatHistory";

// icon imports for use in chat history
import pencilIcon from '../assets/pencil.png';
import trashIcon from '../assets/trash.png';
import saveIcon from '../assets/save.png';
import cancelIcon from '../assets/cancel.png';

function Layout(props) {
  // TODO polish deletion of entire chat history
  //    - ui button is ugly, and needs to be clearer that the button is dangerous

  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  const [chatHistories, setChatHistories] = createSignal(getChatHistories());
  const [renamingId, setRenamingId] = createSignal(null);
  const [newTitle, setNewTitle]  = createSignal("");

  // hover state for mouse navigation of chats
  const [hoveredChatId, setHoveredChatId] = createSignal(null);
  
  // updates the chat history
  createEffect(() => {
    let chatList = getChatHistories();
    
    chatList.sort((c1, c2) => c2.latestMessageDate - c1.latestMessageDate);
    setChatHistories(chatList);

    chatHistories();  // whenever chatHistories is set, re-order it
    location.pathname;  // whenever the URL changes, re-fetch the chat history
  });
  
  const deleteChat = (chatId) => {
    if (!confirm("Are you sure you want to delete this chat? This action cannot be undone.")) return;

    deleteChatHistory(chatId);
    setChatHistories(getChatHistories());

    if (location.pathname.includes(chatId)) {
      navigate('/');
    }
  };

  const deleteAllChats = () => {
    if (!confirm("Are you sure you want to delete ALL chat histories? This action cannot be undone.")) return;
    if (!confirm("Final confirmation: This will permanently delete all your chat data.")) return;

    deleteChatHistories();
    navigate('/');
    setChatHistories([]);
  };
  
  // start renaming mode for a given chat
  const startRenaming = (chatId) => {
    setRenamingId(chatId);
    const chat = chatHistories().find(c => c.chatId === chatId);
    setNewTitle(chat?.chatName || chat.chatId);
  };

  // apply and save new title
  const applyRename = () => {
    renameChat(renamingId(), newTitle());
    setChatHistories(getChatHistories());
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
          <For each={chatHistories()}>{(chat) =>
            <div class={`${styles.chatHistoryContainer} ${hoveredChatId() === chat.chatId ? styles.highlighted : ''} ${params.id === chat.chatId ? styles.active : ''}`}
              onMouseEnter={() => setHoveredChatId(chat.chatId)}
              onMouseLeave={() => setHoveredChatId(null)}
            >
              <Show
                when={renamingId() === chat.chatId}
                fallback={
                  <div class={styles.chatHistoryEntry}>
                    <A 
                      href={`/chat/${chat.chatId}`}
                      title={`Created: ${new Date(chat.creationDate).toUTCString()} | Latest: ${new Date(chat.latestMessageDate).toUTCString()}`}
                    >
                      {chat.chatName}
                    </A>
                    <div class={styles.actionIcons}>
                      <button 
                        class={styles.actionButton}
                        onClick={(clicked) => {
                          clicked.preventDefault();
                          clicked.stopPropagation();
                          startRenaming(chat.chatId);
                        }}
                        title="Rename Chat"
                      >
                        <img src={pencilIcon} alt="Edit" class={styles.actionIcon} />
                      </button>
                      <button 
                        class={styles.actionButton}
                        onClick={(clicked) => {
                          clicked.preventDefault();
                          clicked.stopPropagation();
                          deleteChat(chat.chatId);
                        }}
                        title="Delete Chat"
                      >
                        <img src={trashIcon} alt="Delete" class={styles.actionIcon} />
                      </button>
                    </div>
                  </div>
                }
              >
                {/* section handling editing options UI */}
                <div class={styles.renameContainer}>
                  <input 
                    type="text" 
                    value={newTitle()}
                    onInput={clicked => setNewTitle(clicked.currentTarget.value)}
                    onKeyDown={clicked => clicked.key === 'Enter' && applyRename()}
                    class={styles.renameInput}
                  />
                  <div class={styles.renameActions}>
                    <button 
                      class={styles.actionButton}
                      onClick={applyRename}
                      title="Save Changes"
                    >
                      <img src={saveIcon} alt="Save" class={styles.actionIcon} />
                    </button>
                    <button 
                      class={styles.actionButton}
                      onClick={() => setRenamingId(null)}
                      title="Cancel"
                    >
                      <img src={cancelIcon} alt="Cancel" class={styles.actionIcon} />
                    </button>
                  </div>
                </div>
              </Show>
            </div>
          }</For>
          <br/>

          <button class={styles.deleteAllButton} onClick={deleteAllChats}>Delete All Chats</button>
          <br />
        </div>
        <div class="pageContainer">
          <ChatHistoriesContext.Provider value={{ setChatHistories }}>
            {props.children} {/* nested components are passed in here */}
          </ChatHistoriesContext.Provider>
        </div>
      </div>
    </>
  );
}

export default Layout;