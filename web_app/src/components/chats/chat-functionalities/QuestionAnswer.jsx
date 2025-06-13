import { useContext, createSignal, Match, Switch } from 'solid-js';
import { pipeline, env, QuestionAnsweringPipeline } from '@huggingface/transformers';
import styles from './QuestionAnswer.module.css';
import { ChatContext } from '../ChatContext';
import { parseDocxFileAsync, parseHTMLFileAsync, parseTxtFileAsync } from '../../../utils/FileReaders';

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
 
  const processQuestion = async () => {
    if (!(qaPipeline instanceof QuestionAnsweringPipeline)) {
      alert("Model is loading... please try again.");
      return;
    }
    
    let context = '';
    if (contextTab() === 'text') {
      let contextTextarea = document.getElementById('contextTextarea');
      context = contextTextarea.value;
    } else if (contextTab() === 'file') {
      let fileInput = document.getElementById("fileInput");
      let file = fileInput.files[0];
      context = "";
      if (file.name.endsWith('.txt')) {
        context = await parseTxtFileAsync(file);
      }
      if (file.name.endsWith('.html')) {
        context = await parseHTMLFileAsync(file);
      }
      if (file.name.endsWith('.docx')) {
        context = await parseDocxFileAsync(file);
      }
    }
    
    let question = document.getElementById('questionTextarea').value;
    
    if (context == '' || question == '') {
      alert('Must provide context and question.');
      return;
    }
    
    chatContext.addMessage(`Context: ${context}`, true);
    chatContext.addMessage(`Question: ${question}`, true);
    
    let output = await qaPipeline(question, context);
    chatContext.addMessage(output.answer, false, model);
    
    document.getElementById('questionTextarea').value = '';
  };

  return (
    <>
      <div class={styles.inputContainer}>
        <div class={styles.contextContainer}>
          <div class={styles.tabContainer}>
            <button
              class={contextTab() === "file" ? styles.selectedTab : styles.tab}
              onClick={() => setContextTab("file")}
            >
              File Context
            </button>
            <button
              class={contextTab() === "text" ? styles.selectedTab : styles.tab}
              onClick={() => setContextTab("text")}
            >
              Text Context
            </button>
          </div>
          <Switch>
            <Match when={contextTab() === "text"}>
              <textarea id="contextTextarea" placeholder='Enter context here. Answer will be based on the context provided.'></textarea>
            </Match>
            <Match when={contextTab() === "file"}>
              <input type="file" id="fileInput" accept=".txt, .html, .docx" />
            </Match>
          </Switch>
        </div>
        
        <div class={styles.questionContainer}>
          <div class={styles.tabContainer}>
            <button class={styles.selectedTab}>Question:</button>
          </div>
          <div class={styles.questionSection}>
            <textarea
              id="questionTextarea"
              placeholder='Enter question here.'
              onKeyDown={p_holder => {
                if (p_holder.key === 'Enter' && !p_holder.shiftKey) {
                  p_holder.preventDefault();
                  processQuestion();
                }
              }}
            />
            <button class={styles.sendButton} onClick={processQuestion}>Send</button>
          </div>
        </div>
      </div>
    </>
  );
}

export default QuestionAnswer;