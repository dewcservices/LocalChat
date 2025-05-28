import { createContext, createSignal } from "solid-js";

export const ChatHistoriesContext = createContext();

// Create the hover state signals
export const createChatHistoriesContext = () => {
  const [hoveredChatId, setHoveredChatId] = createSignal(null);
  
  return {
    hoveredChatId,
    setHoveredChatId
  };
};