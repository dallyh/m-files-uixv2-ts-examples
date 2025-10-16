# M-Files UIXv2 Application Examples (TypeScript)

Applications were bootstrapped with [@m-filescorporation/create-mfiles-uixv2](https://www.npmjs.com/package/@m-filescorporation/create-mfiles-uixv2).

Requirements:

- Node JS v22 (LTS)
- npm or any other package manager
- Preferably Visual Studio Code with TypeScript set up
- M-Files knowledge and M-Files license

This repository contains 2 examples

- [Hello World](./HelloWorld/README.md): a simple HelloWorld application with TypeScript support adapted from the [HelloWorld example](https://developer.m-files.com/Frameworks/User-Interface-Extensibility-Framework/Reference/Samples/HelloWorld/).
- [React Dashboard](./ReactDashboard/README.md): a simple React powered dashboard. Toggleable from command menu. Adapted from [ShellFrame & Dashboard](https://developer.m-files.com/Frameworks/User-Interface-Extensibility-Framework/Reference/Samples/ShellFrameAndDashboard/)

## How to use
Simply clone the repository, `cd` into any of the examples and run `npm install`. After this, the package should be ready to be created. Run the corresponding command (usually `npm build`). Example use [https://rspack.rs/](https://rspack.rs/) as a bundler.

## Useful links:

- [TS definitions from M-Files COM API](https://github.com/CtrlDocs/MFiles-UIX-COMAPI)
    - A wrapper for M-Files UIX and UIX v2 to conform with the COM API and abstract away all platform dependent quirks.
- [UIX extensions for TypeScript](https://www.npmjs.com/package/@m-filescorporation/uix-extensions)
    - A TypeScript type definitions package for the M-Files User Interface Extensibility Framework. This package provides types to develop client-side applications that extend the M-Files client interface, supporting features like custom commands, dashboards, and event handling.
