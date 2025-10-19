---
title: About the operating system
tableOfContents: false
---

The operating system currently runs on 32-bit RISC-V QEMU or WebAssembly with Emscripten.
Eventually, the RP2350 will be added as a real hardware target, possibly using the RISC-V mode.

# Building

Development so far has happened on a Macbook with Homebrew. Due to the odd toolchains
involved, it's probably likely that building on another system will require some work.
There are the beginnings of a Nix build which builds the WASM target, and that's probably
the best bet for running on any given system.

[Reach out](https://upvalue.io/contact/) if you'd like help.

# Architecture

There's so little code there's not much of an architecture to speak of, but here are the
current philosophical aims:

- Cooperative scheduling 
- Real process separation to the extent allowed by the system
- Microkernel; the OS kernel will only handle memory management, scheduling and inter-process communication