/* @refresh reload */
import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';

import './index.css';

import Layout from './components/Layout.jsx';
import NewChat from './components/NewChat.jsx';
import Chat from './components/chats/Chat.jsx';
import ModelTesting from './components/ModelTesting.jsx'


// TODO edit behavior so that new chats aren't saved until the user sends a message within the chat
// TODO port thinking animation from main branch, & edit so that it only shows when waiting for the chatbot to return 
//      a response, i.e. when inferencing.


render(
  () => (
    <HashRouter root={Layout}>
      <Route path="/" component={NewChat} />
      <Route path="chat/:id" component={Chat} />
      <Route path="models" component={ModelTesting} />
      <Route path="*" component={NewChat} />
    </HashRouter>
  ),
  document.getElementById('root')
);
