import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { docsRoot, docId } from './docs.mjs';

const docs = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!ui-revisions.md'],
    base: docsRoot,
    generateId: ({ entry }) => docId(entry),
  }),
  schema: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    toc: z.boolean().default(true),
  }),
});

export const collections = { docs };
