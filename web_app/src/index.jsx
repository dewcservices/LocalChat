/* @refresh reload */
import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';

import './index.css';

import Layout from './components/Layout.jsx';
import NewChat from './components/NewChat.jsx';
import Chat from './components/chats/Chat.jsx';
import ModelTesting from './components/ModelTesting.jsx'
import Settings from './components/Settings.jsx';


render(
  () => (
    <HashRouter>
      {/* standalone page */}
      <Route path="/settings" component={Settings} />
        <Route path="/" component={Layout}>
        <Route path="/" component={NewChat} />
        <Route path="chat/:id" component={Chat} />
        <Route path="models" component={ModelTesting} />
        <Route path="*" component={NewChat} />
      </Route>
    </HashRouter>
  ),
  document.getElementById('root')
);