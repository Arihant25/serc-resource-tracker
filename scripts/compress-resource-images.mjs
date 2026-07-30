/**
 * One-off: shrink the resource photos already stored in the database.
 *
 * Photos live inside the resource document as base64 data URIs. The ones uploaded
 * before compression existed are full-size camera JPEGs (the largest is ~1.6 MB of
 * base64), which cost their full size on every read of that document and inflate
 * the collection. New uploads are compressed in the browser — see
 * src/lib/compress-image.ts — so this only has to fix the existing rows.
 *
 * Usage:
 *   node scripts/compress-resource-images.mjs            # report only, writes nothing
 *   node scripts/compress-resource-images.mjs --apply    # write the compressed versions
 *
 * --apply first writes every original to backups/resource-images-<timestamp>.json
 * so the change can be undone with:
 *   node scripts/compress-resource-images.mjs --restore backups/<file>.json
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import sharp from 'sharp';

const MAX_EDGE = 1400;
const QUALITY = 72;

const apply = process.argv.includes('--apply');
const restoreIndex = process.argv.indexOf('--restore');
const restoreFile = restoreIndex === -1 ? null : process.argv[restoreIndex + 1];

const env = readFileSync('.env.local', 'utf8');
const uri = env.match(/^MONGODB_URI=(.*)$/m)?.[1].replace(/\r$/, '');
if (!uri) throw new Error('MONGODB_URI missing from .env.local');

await mongoose.connect(uri);
const resources = mongoose.connection.db.collection('resources');

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

if (restoreFile) {
    const rows = JSON.parse(readFileSync(restoreFile, 'utf8'));
    for (const row of rows) {
        await resources.updateOne(
            { _id: new mongoose.Types.ObjectId(row._id) },
            { $set: { image: row.image } }
        );
        console.log(`restored ${row.name} (${kb(row.image.length)})`);
    }
    console.log(`\nRestored ${rows.length} image(s) from ${restoreFile}.`);
    await mongoose.disconnect();
    process.exit(0);
}

const docs = await resources
    .find({ image: { $regex: '^data:' } }, { projection: { name: 1, image: 1 } })
    .toArray();

const results = [];
for (const doc of docs) {
    const comma = doc.image.indexOf(',');
    const header = doc.image.slice(0, comma);
    const type = /^data:([^;,]+);base64$/.exec(header)?.[1];
    if (!type) {
        console.log(`skip ${doc.name}: unrecognised header`);
        continue;
    }

    const input = Buffer.from(doc.image.slice(comma + 1), 'base64');
    const meta = await sharp(input).metadata();
    const output = await sharp(input)
        .rotate() // honour EXIF orientation before we drop the metadata
        .resize({
            width: MAX_EDGE,
            height: MAX_EDGE,
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({ quality: QUALITY, mozjpeg: true })
        .toBuffer();

    const next = `data:image/jpeg;base64,${output.toString('base64')}`;
    if (next.length >= doc.image.length) {
        console.log(`skip ${doc.name}: already smaller than a re-encode`);
        continue;
    }

    const after = await sharp(output).metadata();
    console.log(
        `${doc.name.padEnd(24)} ${String(meta.width)}x${meta.height} ${kb(doc.image.length).padStart(8)}` +
        `  ->  ${after.width}x${after.height} ${kb(next.length).padStart(8)}` +
        `  (-${((1 - next.length / doc.image.length) * 100).toFixed(0)}%)`
    );

    results.push({ _id: doc._id, name: doc.name, before: doc.image, after: next });
}

const before = results.reduce((n, r) => n + r.before.length, 0);
const after = results.reduce((n, r) => n + r.after.length, 0);
console.log(
    `\n${results.length} image(s): ${kb(before)} -> ${kb(after)}` +
    (before ? ` (-${((1 - after / before) * 100).toFixed(0)}%)` : '')
);

if (!apply) {
    console.log('\nReport only — nothing written. Re-run with --apply to save.');
    await mongoose.disconnect();
    process.exit(0);
}

if (results.length) {
    mkdirSync('backups', { recursive: true });
    const backup = path.join(
        'backups',
        `resource-images-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    writeFileSync(
        backup,
        JSON.stringify(
            results.map((r) => ({ _id: r._id.toString(), name: r.name, image: r.before })),
            null,
            2
        )
    );
    console.log(`\nOriginals backed up to ${backup}`);

    for (const r of results) {
        // updatedAt moves too, which is what busts the image URL's cache.
        await resources.updateOne(
            { _id: r._id },
            { $set: { image: r.after, updatedAt: new Date() } }
        );
        console.log(`updated ${r.name}`);
    }
}

await mongoose.disconnect();
