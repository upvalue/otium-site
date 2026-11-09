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

// Pages for the 2025 operating system, published under /legacy/.
const legacy = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/legacy/content' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    toc: z.boolean().default(true),
  }),
});

export const collections = { docs, legacy };
