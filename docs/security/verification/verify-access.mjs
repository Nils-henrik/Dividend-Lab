import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const { PGlite } = createRequire(resolve(process.env.PGLITE_ROOT ?? '.tmp/security-db', 'package.json'))('@electric-sql/pglite');
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const db = new PGlite();
const actor='00000000-0000-4000-8000-000000000001';
const other='00000000-0000-4000-8000-000000000002';
await db.exec(`
 create role anon; create role authenticated; create role service_role bypassrls;
 grant usage on schema public to anon,authenticated,service_role;
 create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 grant usage on schema auth to anon,authenticated;
 create table public.learning_article_comments(id uuid primary key default gen_random_uuid(), article_slug text not null,user_id uuid not null,body text not null,created_at timestamptz default now(),updated_at timestamptz default now(),is_hidden boolean default false,moderation_status text default 'visible');
 create table public.forum_threads(id uuid primary key,moderation_status text);
 create table public.forum_replies(id uuid primary key,thread_id uuid,moderation_status text);
 create table public.forum_thread_revisions(id int,thread_id uuid,body text);
 create table public.forum_reply_revisions(id int,reply_id uuid,body text);
 alter table public.learning_article_comments enable row level security;
 alter table public.forum_threads enable row level security;
 alter table public.forum_replies enable row level security;
 alter table public.forum_thread_revisions enable row level security;
 alter table public.forum_reply_revisions enable row level security;
 grant select,insert,update,delete on public.learning_article_comments to authenticated;
 grant select on public.learning_article_comments to anon;
 grant all on all tables in schema public to service_role;
 grant select on public.forum_threads,public.forum_replies,public.forum_thread_revisions,public.forum_reply_revisions to anon,authenticated;
 grant truncate,references,trigger on all tables in schema public to anon,authenticated;
 insert into public.learning_article_comments(id,article_slug,user_id,body,is_hidden,moderation_status) values
 ('10000000-0000-4000-8000-000000000001','test','${actor}','visible',false,'visible'),
 ('10000000-0000-4000-8000-000000000002','test','${actor}','hidden',true,'hidden'),
 ('10000000-0000-4000-8000-000000000003','test','${other}','someone else',false,'visible');
 insert into public.forum_threads values ('20000000-0000-4000-8000-000000000001','visible'),('20000000-0000-4000-8000-000000000002','hidden');
 insert into public.forum_replies values ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','visible'),('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','visible'),('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','hidden');
 insert into public.forum_thread_revisions values (1,'20000000-0000-4000-8000-000000000001','public'),(2,'20000000-0000-4000-8000-000000000002','hidden parent');
 insert into public.forum_reply_revisions values (1,'30000000-0000-4000-8000-000000000001','public'),(2,'30000000-0000-4000-8000-000000000002','hidden thread'),(3,'30000000-0000-4000-8000-000000000003','hidden reply');
`);
// Load the actual production policy expressions captured by the audit, rather
// than reproducing their predicates in the test.
const live = JSON.parse(readFileSync(new URL('./production-policy-baseline.json', import.meta.url),'utf8'));
const tables=new Set(['learning_article_comments','forum_threads','forum_replies','forum_thread_revisions','forum_reply_revisions']);
for(const p of live.filter(p=>p.schemaname==='public'&&tables.has(p.tablename)&&(p.tablename==='learning_article_comments'||p.cmd==='SELECT'))){
 const quote=x=>'"'+x.replaceAll('"','""')+'"';
 const roles=p.roles.replace(/[{}]/g,'').split(',').map(x=>x==='public'?'public':quote(x)).join(',');
 await db.exec(`create policy ${quote(p.policyname)} on public.${quote(p.tablename)} for ${p.cmd} to ${roles}${p.qual?' using ('+p.qual+')':''}${p.with_check?' with check ('+p.with_check+')':''}`);
}
async function as(role,fn){await db.exec(`set role ${role}; set request.jwt.claim.sub='${actor}'`);try{return await fn()}finally{await db.exec('reset role')}}
const count=async table=>(await db.query(`select count(*)::int as n from ${table}`)).rows[0].n;
await as('anon',async()=>{assert.equal(await count('forum_thread_revisions'),2);assert.equal(await count('forum_reply_revisions'),3)});
await as('authenticated',async()=>{
 // Existing SELECT RLS already blocks restoring a hidden row: do not overstate the grant issue.
 const rows=await db.query(`update learning_article_comments set moderation_status='visible',is_hidden=false where id='10000000-0000-4000-8000-000000000002' returning id`);
 assert.equal(rows.rows.length,0);
});
assert.equal((await db.query("select has_table_privilege('authenticated','learning_article_comments','truncate') as allowed")).rows[0].allowed,true);
console.log('BASELINE: hidden revisions exposed; hidden comment restore blocked by existing SELECT RLS; excess TRUNCATE granted');
await db.exec(readFileSync(new URL('../proposals/moderation-and-revision-access.sql', import.meta.url),'utf8'));
assert.equal((await db.query("select has_table_privilege('authenticated','learning_article_comments','truncate') as allowed")).rows[0].allowed,false);
for(const role of ['anon','authenticated']) await as(role,async()=>{assert.equal(await count('forum_thread_revisions'),1);assert.equal(await count('forum_reply_revisions'),1)});
await as('authenticated',async()=>{
 assert.equal((await db.query(`update learning_article_comments set body='edited' where id='10000000-0000-4000-8000-000000000001' returning id`)).rows.length,1);
 assert.equal((await db.query(`update learning_article_comments set body='forged' where user_id='${other}' returning id`)).rows.length,0);
 await db.exec(`insert into learning_article_comments(article_slug,user_id,body) values ('test','${actor}','new comment')`);
 for(const sql of [
  `update learning_article_comments set is_hidden=false where user_id='${actor}'`,
  `update learning_article_comments set moderation_status='visible' where user_id='${actor}'`,
  `insert into learning_article_comments(article_slug,user_id,body,moderation_status) values ('test','${actor}','forged','visible')`,
  `insert into learning_article_comments(article_slug,user_id,body) values ('test','${other}','forged')`
 ])await assert.rejects(()=>db.exec(sql));
});
await as('service_role',async()=>{assert.equal((await db.query(`update learning_article_comments set is_hidden=false,moderation_status='visible' where id='10000000-0000-4000-8000-000000000002' returning id`)).rows.length,1)});
console.log('PASS: anon/member visibility, same-user edits, cross-user denial, protected moderation fields, legitimate insert, staff moderation');
await db.close();
