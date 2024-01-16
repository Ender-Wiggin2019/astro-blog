
import { defineCollection, z } from "astro:content";
import { rssSchema } from '@astrojs/rss';

const postsCollection = defineCollection({
  schema: rssSchema
});

const aboutCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
  }),
});

export const collections = {
  posts: postsCollection,
  about: aboutCollection,
};
