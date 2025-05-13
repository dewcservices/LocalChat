/* @refresh reload */
import { render } from 'solid-js/web';
import { HashRouter, Route, useNavigate } from '@solidjs/router';

import './index.css';
import { newChatId, saveChatHistory } from './utils/ChatHistory.js';

import Layout from './components/Layout.jsx';
import NewChat from './components/NewChat.jsx';
import Summarize from './components/Summarize.jsx';
import GeneralChat from './components/GeneralChat.jsx';
import ModelTesting from './components/ModelTesting.jsx'


// TODO edit behavior so that new chats aren't saved until the user sends a message within the chat
// TODO port thinking animation from main branch, & edit so that it only shows when waiting for the chatbot to return 
//      a response, i.e. when inferencing.


const newSummarizeChat = () => {
  let newId = newChatId();
  let currentDate = Date.now();
  saveChatHistory(newId, 'summarize', currentDate, currentDate,
    [{sender: 'chatbotMessage', date: currentDate, content: "Hi, I can summarize information for you. Please enter some text or a file and I'll summarize the contents."}]
  );

  const navigate = useNavigate();
  navigate(`/summarize/${newId}`, { replace: true });
};

const newChat = () => {
  let newId = newChatId();
  let currentDate = Date.now();
  saveChatHistory(newId, 'chat', currentDate, currentDate,
    [{sender: 'chatbotMessage', date: currentDate, content: "Hi, this is a general chat where we can have conversations."}]
  );

  const navigate = useNavigate();
  navigate(`/chat/${newId}`, { replace: true });
};


render(
  () => (
    <HashRouter root={Layout}>
      <Route path="/" component={NewChat} />
      <Route path="summarize" component={() => newSummarizeChat()} />
      <Route path="summarize/:id" component={Summarize} />
      <Route path="chat" component={() => newChat()} />
      <Route path="chat/:id" component={GeneralChat} />
      <Route path="models" component={ModelTesting} />
      <Route path="*" component={NewChat} />
    </HashRouter>
  ),
  document.getElementById('root')
);
