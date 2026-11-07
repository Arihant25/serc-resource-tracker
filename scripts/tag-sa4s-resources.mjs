/**
 * One-off: mark the SA4S machines as "Only for SA4S".
 *
 * Machines are matched by their `systemIp`. The IPs are passed on the command line
 * instead of living in this (public) repo, since the app hides them from everyone
 * except admins and current holders.
 *
 * Usage:
 *   node scripts/tag-sa4s-resources.mjs 10.0.0.1 10.0.0.2 ...          # report only
 *   node scripts/tag-sa4s-resources.mjs 10.0.0.1 10.0.0.2 ... --apply  # write the flags
 *
 * Only sets the flag on matches; it never clears it on anything else. Admins can
 * change it per resource later from the admin page.
 */
import { readFileSync } from 'node:fs';
import mongoose from 'mongoose';

const apply = process.argv.includes('--apply');
const ips = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!ips.length) {
    console.error('Pass the SA4S machine IPs as arguments.');
    process.exit(1);
}

const env = readFileSync('.env.local', 'utf8');
const uri = env.match(/^MONGODB_URI=(.*)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '');
if (!uri) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

await mongoose.connect(uri);
const resources = mongoose.connection.db.collection('resources');
const all = await resources.find({}, { projection: { name: 1, systemIp: 1, sa4sOnly: 1 } }).toArray();

const matched = all.filter((r) => r.systemIp && ips.includes(r.systemIp.trim()));
for (const r of all) {
    const hit = matched.includes(r);
    console.log(`${hit ? 'SA4S' : '    '}  ${r.sa4sOnly ? '(already tagged) ' : ''}${r.name}`);
}
const unmatched = ips.filter((ip) => !matched.some((r) => r.systemIp.trim() === ip));
if (unmatched.length) console.log(`\nNo resource has these IPs: ${unmatched.join(', ')}`);

if (apply) {
    const res = await resources.updateMany(
        { _id: { $in: matched.map((r) => r._id) } },
        { $set: { sa4sOnly: true } }
    );
    console.log(`\nTagged ${res.modifiedCount} resource(s).`);
} else {
    console.log(`\n${matched.length} resource(s) would be tagged. Re-run with --apply to write.`);
}
await mongoose.disconnect();
