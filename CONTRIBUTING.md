# Site development

The site reads Markdown, navigation and `reference.json` from `otium/docs`.
Update the submodule to publish a new snapshot. CI checks out the submodule
and builds the site without running Otium.

To preview another checkout:

```sh
OTIUM_ROOT=~/code/otium pnpm dev
```

The same override works for `pnpm build` and `pnpm test`.

## Documents

Write ordinary Markdown in the Otium repository's `docs/` directory. Link to
other documents using relative paths, including `.md` and any heading anchor.
The site converts those paths to page URLs. Links to source files become
GitHub links pinned to the checkout's commit. Images use raw GitHub URLs at
that commit, so commit and push image assets before publishing.

A document can have `title`, `description` and `toc` front matter. Without a
`title`, its first level-one heading supplies the page title. Set `toc: false`
to hide the page's heading index. Level-two and level-three headings appear
in that index.

`index.md` becomes `/`; other paths retain their spelling and lose `.md`.
`manse/guide.md` becomes `/manse/guide/`. `ui-revisions.md` is excluded in
`src/content.config.ts`. Other Markdown files are published even when they
aren't in the sidebar. `reference/` is reserved for generated API pages.

## Navigation

`docs/nav.json` contains ordered sections. Each section has an optional
`title` and an `items` array. An item is a path relative to `docs/`, or an
object with `file` and an optional `label`. Labels default to document titles.
A section with `"generated": "reference"` lists the generated API namespaces.

The old installation and overview URLs redirect to the current guides.
Redirects live in `src/docs.mjs`.

## Checks

`pnpm test` checks syntax highlighting and link resolution. `pnpm build`
checks sidebar targets and rendered internal links, including heading and
API anchors. Broken links stop the build. External sites aren't fetched.

The old `src/content/docs` directory is no longer loaded. Its files remain
as migration history, including local edits that predate this change.
