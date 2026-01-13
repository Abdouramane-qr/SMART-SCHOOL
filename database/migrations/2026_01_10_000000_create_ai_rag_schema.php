<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        $vectorAvailable = (bool) DB::selectOne(
            "select 1 from pg_available_extensions where name = 'vector' limit 1"
        );

        if ($vectorAvailable) {
            DB::statement('create extension if not exists vector');
        }

        if ($vectorAvailable) {
            DB::statement(<<<'SQL'
create table if not exists ai_embeddings (
    id bigserial primary key,
    school_id bigint not null references schools(id) on delete cascade,
    source_table text not null,
    source_id bigint not null,
    chunk_index integer not null default 0,
    embedding vector(1536),
    content_hash text not null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (school_id, source_table, source_id, chunk_index)
)
SQL);

            DB::statement('alter table ai_embeddings enable row level security');
            DB::statement(<<<'SQL'
create policy if not exists ai_embeddings_school_isolation
on ai_embeddings
using (school_id = current_setting('app.school_id', true)::bigint)
with check (school_id = current_setting('app.school_id', true)::bigint)
SQL);
        }

        DB::statement(<<<'SQL'
create or replace view ai_documents with (security_barrier = true) as
select
    concat('admin-overview-', s.id) as doc_id,
    s.id as school_id,
    'admin' as rag_role,
    'school_overview' as document_type,
    concat(
        'School overview: students=', (select count(*) from eleves e where e.school_id = s.id),
        ', classes=', (select count(*) from classes c where c.school_id = s.id),
        ', teachers=', (select count(*) from enseignants t where t.school_id = s.id),
        ', absences=', (select count(*) from absences a where a.school_id = s.id),
        ', avg_grade=', coalesce((select round(avg(n.value)::numeric, 2) from notes n where n.school_id = s.id), 0)
    ) as document_text,
    now() as updated_at,
    'schools' as source_table,
    s.id as source_id
from schools s
where current_setting('app.rag_role', true) = 'admin'
  and current_setting('app.school_id', true)::bigint = s.id

union all
select
    concat('admin-finance-', s.id, '-', to_char(m.month, 'YYYY-MM')) as doc_id,
    s.id as school_id,
    'admin' as rag_role,
    'finance_month' as document_type,
    concat(
        'Month ', to_char(m.month, 'YYYY-MM'),
        ': payments=', coalesce(p.total, 0),
        ', expenses=', coalesce(e.total, 0),
        ', salaries=', coalesce(sa.total, 0)
    ) as document_text,
    greatest(
        coalesce(p.updated_at, m.month::timestamp),
        coalesce(e.updated_at, m.month::timestamp),
        coalesce(sa.updated_at, m.month::timestamp)
    ) as updated_at,
    'paiements' as source_table,
    null::bigint as source_id
from schools s
join (
    select school_id, date_trunc('month', payment_date)::date as month from paiements
    union
    select school_id, date_trunc('month', expense_date)::date as month from expenses
    union
    select school_id, date_trunc('month', payment_date)::date as month from salaries
) m on m.school_id = s.id
left join (
    select school_id, date_trunc('month', payment_date)::date as month,
        sum(amount) as total,
        max(coalesce(updated_at, created_at)) as updated_at
    from paiements
    group by school_id, date_trunc('month', payment_date)
) p on p.school_id = s.id and p.month = m.month
left join (
    select school_id, date_trunc('month', expense_date)::date as month,
        sum(amount) as total,
        max(coalesce(updated_at, created_at)) as updated_at
    from expenses
    group by school_id, date_trunc('month', expense_date)
) e on e.school_id = s.id and e.month = m.month
left join (
    select school_id, date_trunc('month', payment_date)::date as month,
        sum(net_amount) as total,
        max(coalesce(updated_at, created_at)) as updated_at
    from salaries
    group by school_id, date_trunc('month', payment_date)
) sa on sa.school_id = s.id and sa.month = m.month
where current_setting('app.rag_role', true) = 'admin'
  and current_setting('app.school_id', true)::bigint = s.id

union all
select
    concat('accountant-payments-', s.id) as doc_id,
    s.id as school_id,
    'accountant' as rag_role,
    'payments_status' as document_type,
    concat(
        'Payment status: ',
        coalesce((
            select string_agg(status || '=' || total, ', ')
            from (
                select p.status, count(*) as total
                from paiements p
                where p.school_id = s.id
                group by p.status
            ) status_totals
        ), 'none')
    ) as document_text,
    now() as updated_at,
    'paiements' as source_table,
    null::bigint as source_id
from schools s
where current_setting('app.rag_role', true) = 'accountant'
  and current_setting('app.school_id', true)::bigint = s.id

union all
select
    concat('teacher-class-', c.id) as doc_id,
    c.school_id as school_id,
    'teacher' as rag_role,
    'class_summary' as document_type,
    concat(
        'Class ', c.name,
        ': avg_grade=', coalesce(n.avg_grade, 0),
        ', absences=', coalesce(a.absence_count, 0),
        ', struggling=', coalesce(s.struggling, 'none')
    ) as document_text,
    greatest(
        coalesce(c.updated_at, c.created_at),
        coalesce(n.updated_at, c.updated_at),
        coalesce(a.updated_at, c.updated_at)
    ) as updated_at,
    'classes' as source_table,
    c.id as source_id
from classes c
join classe_enseignant ce on ce.classe_id = c.id
join enseignants t on t.id = ce.enseignant_id
join users u on u.id = t.user_id
left join (
    select class_id,
        round(avg(value)::numeric, 2) as avg_grade,
        max(coalesce(updated_at, created_at)) as updated_at
    from notes
    group by class_id
) n on n.class_id = c.id
left join (
    select classe_id,
        count(*) as absence_count,
        max(coalesce(updated_at, created_at)) as updated_at
    from absences
    group by classe_id
) a on a.classe_id = c.id
left join (
    select n.class_id,
        string_agg(distinct e.full_name, ', ') as struggling
    from notes n
    join eleves e on e.id = n.eleve_id
    where n.value < 10
    group by n.class_id
) s on s.class_id = c.id
where current_setting('app.rag_role', true) = 'teacher'
  and current_setting('app.user_id', true)::bigint = u.id
  and current_setting('app.school_id', true)::bigint = c.school_id

union all
select
    concat('student-summary-', e.id) as doc_id,
    e.school_id as school_id,
    'student' as rag_role,
    'student_summary' as document_type,
    concat(
        'Student ', e.full_name,
        ': avg_grade=', coalesce(n.avg_grade, 0),
        ', absences=', coalesce(a.absence_count, 0)
    ) as document_text,
    greatest(
        coalesce(n.updated_at, e.updated_at),
        coalesce(a.updated_at, e.updated_at)
    ) as updated_at,
    'eleves' as source_table,
    e.id as source_id
from eleves e
join users u on u.id = e.user_id
left join (
    select eleve_id,
        round(avg(value)::numeric, 2) as avg_grade,
        max(coalesce(updated_at, created_at)) as updated_at
    from notes
    group by eleve_id
) n on n.eleve_id = e.id
left join (
    select eleve_id,
        count(*) as absence_count,
        max(coalesce(updated_at, created_at)) as updated_at
    from absences
    group by eleve_id
) a on a.eleve_id = e.id
where current_setting('app.rag_role', true) = 'student'
  and current_setting('app.user_id', true)::bigint = u.id
  and current_setting('app.school_id', true)::bigint = e.school_id

union all
select
    concat('student-timetable-', e.id) as doc_id,
    e.school_id as school_id,
    'student' as rag_role,
    'timetable' as document_type,
    concat(
        'Timetable: ',
        coalesce(string_agg(distinct concat(t.day_of_week, ' ', t.start_time, '-', t.end_time, ' ', m.name), '; '), 'none')
    ) as document_text,
    max(coalesce(t.updated_at, t.created_at)) as updated_at,
    'timetables' as source_table,
    e.id as source_id
from eleves e
join users u on u.id = e.user_id
left join timetables t on t.class_id = e.classe_id
left join matieres m on m.id = t.matiere_id
where current_setting('app.rag_role', true) = 'student'
  and current_setting('app.user_id', true)::bigint = u.id
  and current_setting('app.school_id', true)::bigint = e.school_id
group by e.id, e.school_id

union all
select
    concat('parent-summary-', p.id) as doc_id,
    p.school_id as school_id,
    'parent' as rag_role,
    'children_summary' as document_type,
    concat('Children: ', coalesce(child.summary, 'none')) as document_text,
    now() as updated_at,
    'parents' as source_table,
    p.id as source_id
from parents p
join users u on u.id = p.user_id
left join lateral (
    select string_agg(child_line, '; ') as summary
    from (
        select
            e.full_name || ' avg=' || coalesce(round(avg(n.value)::numeric, 2), 0) as child_line
        from eleve_parent ep2
        join eleves e on e.id = ep2.eleve_id
        left join notes n on n.eleve_id = e.id
        where ep2.parent_id = p.id
        group by e.id, e.full_name
    ) child_rows
) child on true
where current_setting('app.rag_role', true) = 'parent'
  and current_setting('app.user_id', true)::bigint = u.id
  and current_setting('app.school_id', true)::bigint = p.school_id
SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'pgsql') {
            return;
        }

        DB::statement('drop view if exists ai_documents');
        DB::statement('drop table if exists ai_embeddings');
    }
};
