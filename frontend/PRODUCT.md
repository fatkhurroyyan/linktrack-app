# LinkSense AI

<!-- uizze:product-schema 1 -->

LinkSense AI collects and organizes links from Google Drive, GitHub, and websites.
This record describes the existing application and the requested frontend scope.

## Platform

web

## Product purpose

You save URLs, read AI summaries, organize categories and tags, find saved
resources, and export the current collection.

## Users

The existing interface supports people collecting technical and learning
resources. The exact audience beyond this repository evidence is unconfirmed.

## Capabilities and constraints

Keep single and batch ingestion, platform and category filters, search, sorting,
grid and table views, metadata editing, category management, statistics, and
Excel, CSV, and PDF exports. Preserve API contracts, field names, and handlers.
The user explicitly limits this task to frontend presentation. Database,
backend, server configuration, and existing backend changes are out of scope.

## Brand commitments

Preserve the LinkSense AI name and existing sparkle brand mark. The user requests
a major redesign informed by https://luminux2026.vercel.app/. Its pastel cyan,
yellow, rounded typography, outlined controls, and friendly character are binding
reference signals. Do not copy its event branding or mascot.

## Evidence on hand

The React and TypeScript application lives in `src/`. Existing service contracts
live in `src/services/api.ts`. All displayed collection counts come from the API.
There are no verified customer logos, commercial claims, or testimonials.

## Product principles

The primary task remains saving and finding links. Show real application state,
make failures recoverable, support keyboard navigation and mobile layouts, and
keep data operations intact.
