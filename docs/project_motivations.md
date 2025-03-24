# Project Motivations

The technology behind AI chatbots is Large Language Models (LLMs), a category of machine learning that processes text,
or natural-language, and responds using natural language. LLMs have become mainstream in recent years, due to its
impressive ability to answer various questions across almost any discipline of knowledge. To the user, a LLM can be 
described as a chatbot or virtual assistant that can be used to answer questions; write documents/emails; summarise 
documents; translate languages; and more, often being described as “super-charging” one’s productivity. 

In traditional LLM-as-a-service business models, such as ChatGPT, the front end is simply responsible for taking a 
user’s query and sending it to the back end. The LLM inferencing is then executed within the back end, where a server 
is setup with the necessary hardware and software requirements. A depiction of this architecture can be seen below: 

![traditional LLM-as-a-service architecture](figures/traditional%20LLM-as-a-service%20architecture.png)

This architecture invites two primary limitations when it comes to industries where confidentiality and security are
of utmost importance.

Firstly, this architecture requires that the queries must be sent over either, a local network or the internet, to 
reach the HTTP server. This can be a problem when the queries contain sensitive information that mustn't be sent over
unsecured networks. Additionally, air-gapped devices must be considered.

Secondly, this architecture requires that a server is acquired, setup, and maintained. This can be costly and 
infeasible for smaller teams that require this setup over a local-secured network. Furthermore, this requires that 
various software/system-dependencies are installed onto the server, in which may not be possible.

Due to this, LLMs have yet to make their way into the workflow of many various organisations/industries. Hence, the 
need arises for a self-contained application that can run on any device directly from the filesystem, without modifying 
any system-dependencies. It can be assumed that all users have access to a Windows machine with a web browser, hence, 
the app should run entirely within this browser (which also servers to sandbox the execution environment).

