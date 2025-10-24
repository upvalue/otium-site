---
title: MessagePack and inter-process communication
---

Internally, the operating system uses [MessagePack](https://msgpack.org/index.html)
messages for most extended communication between the kernel and user processes, and all
communication between user processes. (Simple syscalls whose inputs and outputs can be
stored in a few registers are still done the normal way).

The operating system allocates a few special pages at process startup: an argument page
containing a messagepack array with the processes's startup argument, a communications
page ("comm page") for both inputs and outputs to syscalls that require more than a
trivial amount of data (such as IPC calls), and pages to handle incoming messages from
other processes.
