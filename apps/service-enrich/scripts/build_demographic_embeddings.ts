// scripts/build_demographic_embeddings.ts
import { FlagEmbedding, EmbeddingModel } from 'fastembed';
import fs from 'fs';
import path from 'path';

const GENDER_WORDS = {
  MALE: ['man', 'men', 'male', 'boys', 'gents'],
  FEMALE: ['woman', 'women', 'female', 'girls', 'ladies'],
  UNISEX: ['unisex', 'uni-sex', 'gender-neutral'],
};

const AGE_GROUP_WORDS = {
  NEWBORN: ['newborn'],
  BABY: ['baby', 'babies', 'infant', 'toddler'],
  KID: ['kid', 'kids', 'child', 'children'],
  TEEN: ['teen', 'teenager', 'teens'],
  ADULT: ['adult', 'adults', 'men', 'women'],
};

const OUTPUT_PATH = path.resolve(process.cwd(), 'src/data/demographic_embeddings.json');

async function main() {
  console.log('🧠 Initializing FastEmbed model...');

  let model;
  try {
    model = await FlagEmbedding.init({
      model: EmbeddingModel.BGESmallEN_V15,
    });
  } catch (err) {
    console.error('❌ Failed to initialize FastEmbed:', err);
    process.exit(1);
  }

  if (!model) {
    console.error('❌ Model did not initialize properly, exiting.');
    process.exit(1);
  }

  const out: any = { gender: {}, age_group: {} };

  async function embedCategoryMap(map: Record<string, string[]>, target: any, label: string) {
    for (const [key, phrases] of Object.entries(map)) {
      console.log(`➡️  Embedding ${label}.${key} (${phrases.length} phrases)`);
      try {
        const iter = model.embed(phrases);
        const all: number[][] = [];
        for await (const batch of iter) {
          for (const vec of batch) {
            all.push(Array.from(vec));
          }
        }
        target[key] = all;
        console.log(`✅ Finished ${label}.${key} (${all.length} embeddings)`);
      } catch (err) {
        console.error(`❌ Failed to embed ${label}.${key}:`, err);
      }
    }
  }

  await embedCategoryMap(GENDER_WORDS, out.gender, 'gender');
  await embedCategoryMap(AGE_GROUP_WORDS, out.age_group, 'age_group');

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });

  if (Object.keys(out.gender).length === 0 || Object.keys(out.age_group).length === 0) {
    console.error('❌ No embeddings generated — check model or network access.');
    process.exit(1);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(out, null, 2));
  console.log(`🎉 Saved embeddings to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('❌ Failed to build demographic embeddings:', err);
  process.exit(1);
});
