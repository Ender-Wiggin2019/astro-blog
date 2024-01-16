
import { defineCollection, z } from "astro:content";
import { rssSchema } from '@astrojs/rss';

const postsCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    pubDate: z.date(),
    customData: z.string().optional(),
    categories: z.array(z.string()),
    tags: z.array(z.string()).optional(),
  })
});


export const collections = {
  posts: postsCollection,
};
