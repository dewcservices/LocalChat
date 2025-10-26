/* @refresh reload */
import { render } from 'solid-js/web';
import { HashRouter, Route } from '@solidjs/router';

import './index.css';

import Layout from './components/Layout.jsx';
import NewChat from './components/NewChat.jsx';
import Chat from './components/chats/Chat.jsx';
import ModelBenchmarking from './components/ModelBenchmarking.jsx'
import ModelRecommendation from './components/ModelRecommendation.jsx'


render(
  () => (
    <HashRouter root={Layout}>
      <Route path="/" component={NewChat} />
      <Route path="chat/:id" component={Chat} />
      <Route path="recommendation" component={ModelRecommendation} />
      <Route path="benchmarking" component={ModelBenchmarking} />
      <Route path="*" component={NewChat} />
    </HashRouter>
  ),
  document.getElementById('root')
);

// test
