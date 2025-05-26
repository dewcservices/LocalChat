import { useContext } from 'solid-js';
import { pipeline, env, SummarizationPipeline } from '@huggingface/transformers';

import styles from '../Chat.module.css';
import { ChatContext } from '../ChatContext';


function QuestionAnswer() {

  const chatContext = useContext(ChatContext);

  return (
    <>
      <div class={styles.inputContainer}>
        <div>This chat can answer questions given a piece of text or document as input.</div>
        <div>Enter context here:</div>
        <textarea id="contextTextArea"></textarea>
        <div class={styles.fileUploadContainer}>
          <label for="folderInput" class={styles.fileUploadLabel}>Select Model</label>
          <input type="file" id="folderInput" webkitdirectory multiple onChange={console.log('model selection change')} />
          <label for="fileInput" class={styles.fileUploadLabel}>Summarize File</label>
          <input type="file" id="fileInput" accept=".txt, .html, .docx" onChange={console.log('file change')} />
          <label onClick={console.log('button press')} class={styles.fileUploadLabel}>Summarize Text</label>
        </div>
      </div>
    </>
  );
}

export default QuestionAnswer;
