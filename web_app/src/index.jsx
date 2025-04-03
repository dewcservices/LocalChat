/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route } from '@solidjs/router';

import './index.css';

import NewChat from './components/NewChat.jsx';
import Summarize from './components/Summarize.jsx';
import GeneralChat from './components/GeneralChat.jsx';


const Layout = (props) => {
  return (
    <>
      <div class="container">
        <div class="sidebarContainer">
          <h1>Local Chat</h1>
          <a href="/">Create New Chat</a>
        </div>
        <div class="pageContainer">
          {props.children} {/* nested components are passed in here */}
        </div>
      </div>
    </>
  );
};


render(
  () => (
    <Router root={Layout}>
      <Route path="/" component={NewChat} />
      <Route path="summarize" component={Summarize} />
      <Route path="chat" component={GeneralChat} />
    </Router>
  ),
  document.getElementById('root')
);
