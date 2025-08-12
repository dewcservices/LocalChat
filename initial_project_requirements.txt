# UniSA Capstone Project: AI Inference in the Browser

There is an emerging trend of standing up local language models for analysing
private and sensitive data (for example, [Ollama](https://ollama.com/),
[Open WebUI](https://docs.openwebui.com/)). Typically, these solutions require
provisioning a server that is capable of hosting the model and then providing a
REST API for others on the network. This solution is not always ideal in
Defence.

Defence is a very siloed organisation by design, where need-to-know is a
critical security mechanism. Some teams work with extremely sensitive data and
may not have the expertise or the infrastructure necessary to set up a local LLM
service.

All teams however have access to a Windows machine with a web browser. Some of
these machines have GPUs, but many do not. By enabling AI inference in the
browser we can empower more teams in Defence to have access to state-of-the-art
chatbots to help them understand their data.

**Goal:** Get a ChatGPT-style language model running in the browser that can
answer useful questions about documents on the oldest, slowest computer
possible. The older and slower the machine, the better!

## Requirements

This project lays out two sets of requirements:

- Primary requirements
- Optional requirements

Meeting all of the primary requirements is necessary for project success. If it
turns out that the primary requirements are easy to solve (either because they
aren't that hard, or there exists a viable open-source solution), then one or
more of the optional requirements may be selected to make the project more
interesting and valuable.

### Primary requirements

This project seeks to develop a lightweight single-page application (SPA) that
allows users to analyse their documents. The SPA:

- Must be completely client-side (no network requests).
- Must be able to work in airgapped environments (i.e. no CDNs).
- Can be opened directly from the user's filesystem into the browser. No web
  server should be required to open the SPA. No software should need to be
  installed. No Docker. No sudo access. Assume Chrome or Edge are available
  (whichever is easier to work with). The language model need not be bundled
  with the SPA. If the language model is not bundled with the SPA, the user
  should be able to select the language model to use from their filesystem.
- Should be able to provide meaningful value for a user with a low-performance
  Windows machine with no GPU. (assume minimum 1 GHz processor, 4GB RAM, 64GB
  disk). If this minimum spec cannot be met, provide minimum specifications that
  are as low as possible.
- Should be able to analyse PDF, Word and HTML documents.
- Should be able to take advantage of hardware acceleration (i.e. GPUs) with
  little to no setup from the user.

The SPA will host a chat interface that allows users to select documents and ask
questions.

The team is encouraged to identify some sample PDF/Word/HTML documents early on
in the project to help analyse model/SPA performance.

_Note: Some PDFs can be extremely difficult to convert into a format that can be
understood by a language model. The team should adopt a decent open-source
parser, and should not be concerned if the language model is not able to
understand some PDF inputs._

Web Assembly (WASM) will likely be required to run language models in the
browser. It is the client's preference that Rust or Python be used to write the
WASM code, but this can be negotiated. If a suitable solution is developed that
does not require WASM (e.g. pure JavaScript), that may be OK too.

If an existing solution is found in the open-source ecosystem that already
satisfies all of the primary requirements, then that should be highlighted as
part of this project.

If the primary requirements are met quickly, or there already exists a stable
open-source solution, we will add optional requirements to the project. If an
open-source solution is identified that meets the primary requirements, it may
also function as the basis for meeting the additional requirements, rather than
needing to implement the entire solution from scratch.

On some underpowered systems, the LLM may run so poorly as to be unusable. This
is OK. As part of this project we want to document the minimum specs required to
have a usable experience, and _may_ conduct research into lowering the required
specs as much as possible.

#### Model test suite

In addition to the SPA, please provide a lightweight test suite that takes a
candidate model and computes relevant metrics for the device running the test
suite. We want a streamlined process for model selection which helps users
select the best possible model for their hardware (i.e., the best performing
model that meets some minimum level of throughput required for basic interactive
usage). This test suite can either be included in the SPA itself, or can be
standalone.

### Optional requirements

Optional requirements are only necessary if there exist open-source solutions
that already satisfy all of the primary requirements. The following optional
requirements are not set in stone and can be negotiated with the client once the
primary requirements are met:

- Model selector: Allow users to select from multiple models. We want to support
  small, simple models that can run CPU only, all the way up to medium-sized
  models that can run on 16GB GPUs.
- Model optimisation: If the SPA is largely solved, conduct research into how we
  can improve existing model performance. Can we go smaller? More efficient?
  What is the best model we can get on the worst system possible?
- RAG integration: If a user wants to work with multiple documents that do not
  fit in the prompt, can we include a lightweight retrieval-augmented generation
  (RAG) mechanism? RAG should operate seamlessly with the Windows operating
  system. Given that we need to work with lightweight language models due to
  machine restrictions, RAG may be very necessary for simply working with
  multi-page documents.
- Other model types: If LLMs in the browser are largely solved, can we
  investigate running other model types in the browser? Computer vision and/or
  audio processing models would be the highest priority.

### Other notes

#### Prettiness

The SPA should be functional and easy-to-use, but does not need to be "pretty".
Defence users are accustomed to working with clunky software that looks like it
is from the 1990s. Please do not invest time in creating fancy, complicated
animations. Where possible, prefer simple HTML and CSS that leverage web
standards over complicated SPA frameworks. Ideally, we should be able to support
browsers going back to 2015 (i.e. Windows 10 and above). However, if there is a
critical web standard required that is only available on newer browsers, that
may be acceptable. Any "prettiness" added to the SPA must be limited to your own
HTML/CSS/JS or should use lightweight and well-known third-party libraries on
npm. Please keep your dependencies to a minimum.

#### DeepSeek

DeepSeek is currently banned from Defence devices. Please do not use any
DeepSeek products for this project.

## Communications

Client catch-ups will happen once a fortnight. Use these catch-ups to provide
updates and to ask clarifying questions. GitHub Discussions may also be used for
asynchronous communications.

At the end of the project, the team are to present their solution to interested
parties from Defence Science and Technology Group (DST Group). DEWC will assist
with deploying the SPA onsite so DST Group can trial it.

### Documentation

Documentation deliverables come in two forms:

- A running blog hosted on GitHub Pages that documents your process. Each week,
  one team member is to publish a short blog post. Each blog post can be as
  short as a single paragraph, and can be on any topic that is relevant to the
  project. Each blog post may describe an idea, a concept, a lesson learnt, or
  really anything that you think would be useful for someone that is interested
  in your project. This deliverable must be shared equally between all team
  members. This is not intended to be a strenuous exercise. Each post should
  only take an hour or two to write. It could be something as simple as "here is
  how you interact with the filesystem using WASM" or "here is how to prepare
  text for language models". If code is required for the blog post, ideally you
  can just copy and paste previous code you have written for the project. Please
  do not use ChatGPT or similar to generate these posts. This exercise is to
  help you to develop _your_ voice and style. I want to hear what _you_ have to
  say, not a chatbot. I'd rather see typos and imperfections than
  [ChatGPT slop](https://en.wikipedia.org/wiki/AI_slop). You should be able to
  point to these blog posts with pride when interviewing with future employers.
  (Note that using ChatGPT or similar for SPA development is allowed.)
- A docs site hosted on GitHub pages. The site should include:
  - Appraisal/README: Advertise your solution to new users and differentiate
    your product from other similar solutions in the open-source ecosystem.
  - Analysis: Describe how you analyse model performance to select the best
    model for the hardware available. This is non-trivial and should be
    considered early in the project.
  - Contributing guidelines: Provide enough information so that a new
    contributor can understand the project and can pick up from wherever you
    finish off. It would be great if future capstone projects could build upon
    your success.
  - Troubleshooting: Users may get themselves into trouble by working with
    invalid file formats, or working on incompatible machines. While the SPA
    should help guide users through these issues where possible, external
    documentation may be necessary.

The docs and the blog may (and probably should) be hosted on the same site.
Please find a static site generator (SSG) that accomplishes this. Jekyl is
probably a good place to start, but you may choose whatever you like. All docs
and blog posts should be written in
[GitHub Flavored Markdown (GFM)](https://github.github.com/gfm/), so that it is
easy to migrate to other SSGs in the future if required.

Usage instructions should not be required on the docs site. The SPA should walk
users through the process without needing to consult external documentation.

If all of the documentation requirements above are met, no further documentation
is required. There is no need to produce a traditional report that captures the
entire project (unless your university requires it?).
