-- ============================================================================
-- Parola — Migración 0034: modo di registrazione semplificato (temporaneo)
--
-- Permite al admin activar/desactivar desde el panel un modo de registro
-- de estudiantes reducido (Nome, Cognome, Corso, Codice insegnante — sin
-- Livello CEFR, con acceso inmediato sin aprobación). El estado del toggle
-- vive en una tabla singleton (app_settings) para poder alternarlo sin
-- deploy. corso es un dato nuevo (grado escolar), independiente del nivel
-- CEFR (livello_target), usado tanto en modo simplificado como en la nueva
-- gestión admin de estudiantes.
-- ============================================================================

create table app_settings (
  id boolean primary key default true check (id),
  simplified_registration_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into app_settings (id, simplified_registration_enabled) values (true, false);

alter table app_settings enable row level security;
-- Sin policies: solo el service-role (createAdminClient) lee/escribe,
-- igual que el resto de las mutaciones sensibles del panel admin.

alter table profiles add column corso text;

alter table profiles
  add constraint corso_only_student check (
    (role = 'student') or (corso is null)
  );

alter table profiles
  add constraint corso_valido check (
    corso is null or corso in ('1', '2', '3', '4', '5', '7')
  );

comment on column profiles.corso is
  'Grado escolar del estudiante (1,2,3,4,5,7), independiente del nivel CEFR. NULL = no definido (registro clásico no lo pide).';

comment on table app_settings is
  'Configuración global de la app, editable desde el panel admin sin deploy. Fila única (id=true).';
