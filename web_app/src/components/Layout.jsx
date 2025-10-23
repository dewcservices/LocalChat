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

  const location = useLocation();
  const params = useParams();
  const navigate = useNavigate();

  const [chatHistories, setChatHistories] = createSignal(getChatHistories(), {equals: false});
  const [renamingId, setRenamingId] = createSignal(null);
  const [newTitle, setNewTitle]  = createSignal("");

  // hover state for mouse navigation of chats
  const [hoveredChatId, setHoveredChatId] = createSignal(null);
  
  // sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = createSignal(false);
  
  const pageContent = props.children;
  
  // toggle sidebar function
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed());
  };
  
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

  // handle clicking on the entire chat container
  const handleChatClick = (chatId, event) => {
    // Don't navigate if we're clicking on action buttons or in rename mode
    if (renamingId() === chatId || 
        event.target.closest(`.${styles.actionButton}`) || 
        event.target.closest(`.${styles.renameContainer}`)) {
      return;
    }
    navigate(`/chat/${chatId}`);
  };

  return (
    <>
      <div class={sidebarCollapsed() ? "container sidebar-collapsed" : "container"}>
        <button 
          class={styles.toggleSidebarButton}
          onClick={toggleSidebar}
          title={sidebarCollapsed() ? "expand sidebar" : "collapse sidebar"}
        >
          {sidebarCollapsed() ? '→' : '←'}
        </button>

        <Show when={sidebarCollapsed()}>
          <button 
            class={styles.newChatButton}
            onClick={() => navigate('/')}
            title="Create New Chat"
          >
            +
          </button>
        </Show>

        <div class={sidebarCollapsed() ? "sidebarContainer collapsed" : "sidebarContainer"}>
          <div class={styles.sidebarTopSection}>
            <h1>Local Chat</h1>
            <A href="recommendation">Model Recommendations</A>
            <br/><br/>
            <A href="benchmarking">Model Benchmarking</A>
            <br/><br/>
            <A href="/settings">Settings</A>
            <br/><br/>
            <A href="/">Create New Chat</A>
            <br/><br/>
          </div>

          <div class={styles.sidebarMiddleSection}>
            <h2>Chat History</h2>
            <div class={styles.chatHistoryOuterContainer}>
              <div class={styles.chatHistoryWrapper}>
                <div class={styles.chatHistoryScrollContainer}>
                <For each={chatHistories()}>{(chat) =>
                  <div class={`${styles.chatHistoryContainer} ${hoveredChatId() === chat.chatId ? styles.highlighted : ''} ${params.id === chat.chatId ? styles.active : ''}`}
                    onMouseEnter={() => setHoveredChatId(chat.chatId)}
                    onMouseLeave={() => setHoveredChatId(null)}
                    onClick={(event) => handleChatClick(chat.chatId, event)}
                  >
                    <Show
                      when={renamingId() === chat.chatId}
                      fallback={
                        <div class={styles.chatHistoryEntry}>
                          <A 
                            href={`/chat/${chat.chatId}`}
                            class={styles.chatName}
                            title={`Created: ${new Date(chat.creationDate).toUTCString()} | Latest: ${new Date(chat.latestMessageDate).toUTCString()}`}
                          >
                            <Show when={chat.chatType === 'summarize'}>
                              <span class={styles.chatTypeIcon}>📄</span>
                            </Show>
                            <Show when={chat.chatType === 'question-answer'}>
                              <span class={styles.chatTypeIcon}>❓</span>
                            </Show>
                            <Show when={chat.chatType === 'translation'}>
                              <span class={styles.chatTypeIcon}>🌐</span>
                            </Show>
                            {chat.chatName}
                          </A>
                          <div class={styles.actionIcons}>
                            <button 
                              class={styles.actionButton}
                              onClick={(clickEvent) => {
                                clickEvent.preventDefault();
                                clickEvent.stopPropagation();
                                startRenaming(chat.chatId);
                              }}
                              title="Rename Chat"
                            >
                              <img src={pencilIcon} alt="Edit" class={`${styles.actionIcon} ${styles.editIcon}`} />
                            </button>
                            <button 
                              class={styles.actionButton}
                              onClick={(clickEvent) => {
                                clickEvent.preventDefault();
                                clickEvent.stopPropagation();
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
                      <div class={styles.renameContainer}>
                        <input 
                          type="text" 
                          value={newTitle()}
                          onInput={inputEvent => setNewTitle(inputEvent.currentTarget.value)}
                          onKeyDown={keyEvent => keyEvent.key === 'Enter' && applyRename()}
                          class={styles.renameInput}
                        />
                        <div class={styles.renameActions}>
                          <button 
                            class={styles.actionButton}
                            onClick={applyRename}
                            title="Save Changes"
                          >
                            <img src={saveIcon} alt="Save" class={`${styles.actionIcon} ${styles.editIcon}`} />
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
              </div>
            </div>
          </div>
          </div>

          <div class={styles.sidebarBottomSection}>
            <div class={styles.buttonContainer}>
              <button 
                class={styles.deleteAllButton} 
                onClick={deleteAllChats}
                title="Delete all chat histories"
              >
                Delete All Chats
              </button>
            </div>
            <br />
          </div>
        </div>
        <div class="pageContainer">
          <ChatHistoriesContext.Provider value={{ setChatHistories }}>
            {pageContent}
          </ChatHistoriesContext.Provider>
        </div>
      </div>
    </>
  );
}

export default Layout;