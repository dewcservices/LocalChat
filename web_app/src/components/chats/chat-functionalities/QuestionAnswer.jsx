import { useContext, createSignal, Match } from 'solid-js';
import { pipeline, env, QuestionAnsweringPipeline } from '@huggingface/transformers';

import styles from './QuestionAnswer.module.css';
import { ChatContext } from '../ChatContext';


function QuestionAnswer() {

  const chatContext = useContext(ChatContext);
  const [contextTab, setContextTab] = createSignal("text");

  // TODO force it to use local models (like summarize)
  const model = 'Xenova/distilbert-base-uncased-distilled-squad';
  let qaPipeline;
  const setupModel = async () => {
    qaPipeline = await pipeline('question-answering', model);
  };
  setupModel();
  
  let processQuestion = async () => {
    
    if (!(qaPipeline instanceof QuestionAnsweringPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }

    let context = '';
    if (contextTab() === 'text') {
      let contextTextarea = document.getElementById('contextTextarea');
      context = contextTextarea.value;
    } else if (contextTab() === 'file') {
      // TODO
    }

    let question = document.getElementById('questionTextarea').value;

    if (context == '' || question == '') {
      alert('Must provide context and question.');
      return;
    }

    chatContext.addMessage(`Context: ${context}`, true);
    chatContext.addMessage(`Question: ${question}`, true);

    let output = await qaPipeline(question, context);
    chatContext.addMessage(output.answer, false, model)

    document.getElementById('contextTextarea').value = '';
    document.getElementById('questionTextarea').value = '';
  };

  return (
    <>
      <div class={styles.inputContainer}>
        <div class={styles.contextContainer}>
          <div>
            <button 
              class={contextTab() === "file" ? styles.selectedTab : styles.tab}
              onClick={() => {setContextTab("file");}
            }>
              File Context
            </button>
            <button
              class={contextTab() === "text" ? styles.selectedTab: styles.tab}
              onClick={() => {setContextTab("text");}}
            >
              Text Context
            </button>
          </div>
          <Switch>
            <Match when={contextTab() === "text"}>
              <textarea id="contextTextarea" placeholder='Enter context here. Answer will be based on the context provided.'></textarea>
            </Match>
            <Match when={contextTab() === "file"}>
              <div>File Input</div>
            </Match>
          </Switch>
        </div>
        <div class={styles.questionContainer}>
          <div>
            <button class={styles.selectedTab}>Question:</button>
          </div>
          <textarea id="questionTextarea" placeholder='Enter question here.'></textarea>
          <button class={styles.sendButton} onClick={processQuestion}>Send</button>
        </div>
      </div>
    </>
  );
}

export default QuestionAnswer;
