
# Web Workers

JavaScript's main thread uses the event-loop to schedule tasks and update the GUI (HTML). This main thread is 
single-threaded.

When CPU-bound tasks are run on this thread, the thread becomes occupied with these tasks, and any tasks relating to
updating the GUI are delayed. This results in the UI becoming laggy, slow, and in the worst cases, completely 
unresponsive.

There are exceptions to this - network requests, timeouts, file system operations are common examples of operations
that can run in parallel and commonly are run in parallel within the JavaScript ecosystem (whenever promises are used).
These are special cases in which the parallelism is implemented by the browser API and not natively within the
JavaScript language. 

Contrast this with back-end languages such as Go, in which the language offers keywords that allow any code to run 
in parallel.

~ However, this isn't quite the full-story, whilst JavaScript didn't initially support parallelism, JavaScript now
supports limited parallelism through "web-workers".

Web-workers are essentially external JS files that run in parallel to the main thread. They run independently of other
scripts - contained within their own executing environment. They cannot access the main-thread's scope nor can the main
thread access the web-worker's scope. 

Instead the main-thread and web-worker(s) communicate through a message system. Where the main-thread (single-threaded)
will use the event-loop to schedule the handling of messages received from the web-worker.

Web-workers were brought about primarily as a means of running CPU-bound tasks within the JavaScript engine. 
CPU-bound tasks could now be pushed to run in the background, whilst the main thread continues to provide a responsive
GUI.

## Relevance to LocalChat

Currently, the app does not use web-workers. All the CPU-bound tasks occur within the main thread. This is why the app 
temporarily halts when loading models or inferencing text. 

Currently the team is looking to integrate [WebLLM](https://webllm.mlc.ai/) to provide conversational models. However,
these models are much more process intensive than the TransformersJS functionality. A single response could take 
minutes to generate. Hence, web-workers are essential to prevent the app from freezing for minutes at a time.

Overall, integrating web-workers provides a much smoother and more predictable user experience. This has already been
proven with some initial testing (see this [commit](https://github.com/andrewtran3643/LocalChat_dewc/commit/f9cdfab29bbc44bd80c967657469026efcf1da39)).

However, there are some technical limitations that prevent us from merging these changes into the current build.

## Technical Issues

Let's recap on one of the core security requirements of the app:

> The app should not require any executables to run. The app should be runnable from the filesystem using the file 
protocol.
> 
> As an extension of this, the web-app must be compiled into a single HTML file as to prevent CORS restrictions.

This causes a problem when using web-workers. Web-workers exist as external JS files, hence, cannot be bundled into the
HTML file.

In the example seen in the [linked commit](https://github.com/andrewtran3643/LocalChat_dewc/commit/f9cdfab29bbc44bd80c967657469026efcf1da39),
the web-worker JS files are not compiled into the HTML file. And hence, this version of the app does NOT work when ran
with the file protocol. Instead it only works when ran with a basic fileserver. 

This violates the aforementioned security requirement and is why web-workers have yet to be integrated into the app.

### Potential Fixes

1. Inlining the web-worker JS code. The web-worker code can be stored as raw text (a string) within the main JavaScript
modules, then loaded into a web-worker as a blob. However, import statements cannot be used (i.e. TransformerJS & 
WebLLM imports cannot be used), hence, this potential fix is not viable.

---

Note: The team is currently looking further into this issue. 
