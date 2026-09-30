# Propuesta de migración Supabase de Yardbook

Estado: SQL preparado, NO aplicado ni probado contra un motor de base de datos.
Destino único previsto: `xyprkjgmrtcvcgrzwhfg`.

## Alcance y uso futuro

Esta propuesta consolida el SQL local existente; no es una copia verificada del
esquema remoto. Antes de aplicarla, contrastar con una extracción de esquema de
solo lectura del original, si se autoriza, y validar en un entorno aislado.
No incluye datos reales, usuarios, sesiones, objetos de Storage ni secretos.

Los archivos de esta carpeta son borradores ordenados, fuera del directorio que
Supabase CLI aplica automáticamente. La CLI no está instalada; no se ha instalado
ni se han registrado migraciones mediante ella. Cuando se autorice su instalación,
crear una secuencia nueva con `supabase migration new` en un directorio de trabajo
limpio para Yardbook y trasladar cada borrador a su migración correspondiente.
La sintaxis concreta deberá confirmarse con la ayuda de la CLI instalada.

**No ejecutar `db push` con el directorio heredado `supabase/migrations/`. No
concatenar aquella secuencia con esta propuesta.** Ambas crean los mismos objetos.
Los SQL antiguos se conservan como referencia y para no romper los tests que los
leen. No aplicar tampoco `fleet_state.sql` ni `notification-cron.sql` heredados.

“Supabase vacío” significa proyecto Supabase nuevo, con sus esquemas administrados
`auth` y `storage`, roles `anon`, `authenticated`, `service_role` y funciones de
plataforma existentes, pero sin tablas, políticas o buckets propios de la app.
No es un PostgreSQL genérico vacío. Las operaciones futuras requieren un rol
administrador del nuevo proyecto. No repetir los borradores sobre una instalación
parcial: detenerse y revisar el estado, sin reset ni reparaciones automáticas.

## Orden de la propuesta

| Orden | Archivo | Contenido y dependencias |
| --- | --- | --- |
| 1 | `001_extensions.sql` | Vault, pg_cron y pg_net; permisos de uso de public. No programa jobs. |
| 2 | `002_fleet_state.sql` | Estado JSONB, índices, permisos, RLS, políticas y trigger de validación de deudas. |
| 3 | `003_notifications.sql` | Suscripciones, entregas, logs y runtime; índices, RPCs, triggers y RLS. Ya existe fleet_state. |
| 4 | `004_private_file_tables.sql` | maintenance_files y rental_documents; índices y políticas por propietario. |
| 5 | `005_storage.sql` | Tres buckets privados y sus políticas de acceso por carpeta de usuario. |
| 6 | `006_notification_config.sql` | RPCs reservadas al servidor para leer configuración y, posteriormente, guardar un par VAPID nuevo. |

Cada archivo tiene transacción propia. Se usan directamente las columnas y las
funciones en su versión final: no se eliminan constraints ni se actualizan datos
históricos. Los INSERT de preparación son exclusivamente los tres buckets vacíos
y la fila técnica `notification_runtime(id=1)`; no son datos de producción.
Las funciones contienen las operaciones de ejecución de la aplicación, pero
crear sus definiciones no las invoca. No hay DROP ni sentencias DELETE en esta
propuesta. Las políticas `FOR DELETE` conservan los permisos necesarios para
borrar archivos desde la aplicación; no ejecutan borrados.

Se conservan las relaciones del código original, incluidas las relaciones lógicas
dentro del JSONB y `fleet_state.user_id` sin nueva FK. No se inventan tablas de
vehículos/clientes ni un esquema distinto. Las concesiones a service_role para
leer fleet_state son explícitas, sin depender de privilegios predeterminados.

## Configuración posterior en Supabase (no realizada)

1. Confirmar visualmente el ref del destino y verificar que no contiene datos de
   negocio antes de cualquier aplicación autorizada.
2. Revisar disponibilidad de extensiones, esquemas administrados y exposición de
   `public` en Data API. La secuencia conserva RLS y permisos explícitos.
3. Revisar Auth: correo/contraseña, registro, confirmación, sesiones, Site URL,
   Redirect URLs, SMTP y plantillas. Crear únicamente usuarios de prueba nuevos.
4. Aplicar la secuencia solo después de validarla y recibir autorización.
5. Configurar los valores propios de Yardbook que figuran abajo, sin recuperar
   ningún secreto del proyecto original.
6. Desplegar, solo con autorización posterior, ambas Edge Functions al nuevo ref.
7. Activar Cron al final. Probar aislamiento de cuentas, archivos privados,
   registro de dispositivos y entrega push con datos ficticios.

### Vault y secretos nuevos

| Nombre en Vault | Valor que habrá que configurar | Salida de la RPC |
| --- | --- | --- |
| `yardbook_app_origin` | Origen HTTPS exacto del frontend Yardbook, sin ruta ni barra final | `APP_ORIGIN` |
| `yardbook_vapid_subject` | URL HTTPS o contacto mailto propio de Yardbook | `VAPID_SUBJECT` |
| `yardbook_notification_cron_secret` | Secreto aleatorio fuerte generado NUEVO para Yardbook | `NOTIFICATION_CRON_SECRET` |
| `yardbook_notification_url` | `https://xyprkjgmrtcvcgrzwhfg.supabase.co/functions/v1/notification-dispatch` | Solo lo lee Cron |
| `yardbook_vapid_public_key` | Clave pública del par NUEVO | `VAPID_PUBLIC_KEY` |
| `yardbook_vapid_private_key` | Clave privada del mismo par NUEVO, en JWK serializado | `VAPID_PRIVATE_KEY` |

No hay valores insertados en Vault por las migraciones. No copiar la clave raíz
ni el contenido de Vault original. El Vault del proyecto nuevo administra su
propio cifrado; estas RPCs no requieren importar claves del original.

El emisor existente puede generar y guardar un par VAPID nuevo en su primera
invocación autenticada si no existe `VAPID_PRIVATE_KEY`. Esa generación futura
requiere que antes estén configurados el secreto Cron, el origen y el asunto.
Alternativamente se puede provisionar un par nuevo compatible, manteniendo ambas
claves juntas. No introducir placeholders literales como secretos: impedirían la
generación automática. Nunca exponer la clave privada en una variable VITE_.

Las API keys y service_role deben proceder del proyecto Yardbook, no ser valores
inventados ni copiados de otro proyecto. Conservar service_role solo en servidor.
El backend actual utiliza SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY; confirmar
su disponibilidad y compatibilidad con verify_jwt antes del futuro despliegue.

### Variables y archivo de ejemplo

`.env.yardbook.example` es un inventario con placeholders, no un archivo para
copiar íntegro al frontend. Vite no carga automáticamente ese nombre de ejemplo.

- Frontend: únicamente VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY y, opcionalmente,
  VITE_YARDBOOK_STATE_TABLE (con compatibilidad temporal con `VITE_MONKEY_STATE_TABLE`). La variable activa debe ser `fleet_state`: las funciones SQL y
  el emisor utilizan ese nombre fijo. Se conserva su nombre para no cambiar el
  contrato del frontend en esta fase.
- Edge runtime: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY del nuevo
  proyecto; no llevarlas al bundle del navegador.
- APP_ORIGIN, NOTIFICATION_CRON_SECRET y VAPID_* pueden proceder de Vault o del
  entorno servidor; la RPC carga Vault y sus valores tienen prioridad. Se
  recomienda una sola fuente, Vault, para evitar configuraciones divergentes.
- `yardbook_notification_url` es un nombre de Vault, no una variable que lea el
  frontend ni una variable que las Edge Functions necesiten consumir.

`.env.local` y Vercel no se han modificado. El dominio definitivo queda pendiente.

## Revisión de Edge Functions

`notification-device` y `notification-dispatch` pueden reutilizar su código de
producción sin cambios de URLs ni de nombres de proyecto. `_shared/server.ts`
construye las URLs con SUPABASE_URL y obtiene configuración mediante
`notification_server_config()`. La RPC nueva traduce `yardbook_*` a los mismos
nombres APP_ORIGIN/VAPID_*/NOTIFICATION_CRON_SECRET esperados por el código.

- `notification-device`: verify_jwt=true, validación adicional de Auth/sesión y
  comparación exacta con APP_ORIGIN. Solo admite un origen configurado; localhost
  o previews no funcionarán automáticamente con un origen de producción.
- `notification-dispatch`: verify_jwt=false y autenticación propia x-cron-secret.
  Mantener ese contrato al configurar el job; nunca usar la anon key como secreto.
- Los endpoints externos de Web Push son proveedores, no proyectos Supabase.
- Los archivos compartidos/types y tests pueden conservar nombres o marcas Monkey
  Rentals; eso no fija el destino de red. La personalización visual queda fuera.
- Las suscripciones push deben registrarse de nuevo con usuarios y claves nuevos.

## Cron posterior: instrucciones, NO ejecutadas

No se incluye un job en los seis borradores. Cuando las funciones y Vault estén
listos, crear una sola tarea en Cron del proyecto nuevo:

- Nombre: `yardbook-notification-dispatch`.
- Frecuencia: `* * * * *`.
- Tipo: SQL, con el siguiente cuerpo (solo documentación, no ejecutado):

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets
          where name = 'yardbook_notification_url'),
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets
                     where name = 'yardbook_notification_cron_secret')
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 55000
);
```

Antes de crear el job, comprobar que la URL de Vault es exactamente la indicada
para xyprkjgmrtcvcgrzwhfg, que el secreto existe y que no hay ya un job del mismo
nombre. No reutilizar ni cancelar tareas del original. No programar hasta que el
endpoint nuevo esté desplegado y configurado. Después, verificar la señal
`notification_runtime.last_success` y una entrega real con una cuenta de prueba.

Referencias oficiales: [Vault](https://supabase.com/docs/guides/database/vault),
[Cron](https://supabase.com/docs/guides/cron/install),
[pg_net](https://supabase.com/docs/guides/database/extensions/pg_net),
[programar funciones](https://supabase.com/docs/guides/functions/schedule-functions).

## Restos locales y límites

- config.toml utiliza ahora el identificador local `yardbook`; esto no enlaza ni
  renombra proyectos remotos.
- Es seguro eliminar `supabase/.temp/linked-project.json`: es metadato temporal
  local ignorado por Git. Se ha retirado únicamente ese archivo de esta copia de
  Yardbook, sin invocar CLI, API ni cambiar el Supabase original. Esto no debe
  confundirse con una prueba de desvinculación universal de todas las herramientas.
- El directorio heredado de migraciones, fleet_state.sql, notification-cron.sql y
  NOTIFICATIONS.md siguen presentes con referencias históricas. No son la ruta
  de instalación de Yardbook.
- `.vercel/project.json` sigue asociado localmente al proyecto anterior y NO se
  ha tocado; no utilizarlo para desplegar Yardbook.
- Persisten marcas, claves de caché/sesión y nombres de backup del frontend. Su
  separación debe completarse antes de probar ambos proyectos bajo el mismo origen.

Validación de esta fase: revisión del código y de git diff/git status únicamente.
Sin ejecución SQL, tests, build, red a proyectos Supabase, instalación CLI, link,
push, despliegue de funciones, activación de Cron o modificación de Vercel.


## Validación estática con inventario remoto aportado (30/09/2026)

Resultado: estructura esperada cubierta por los SQL locales consolidados. No se
certifica identidad exacta con el esquema remoto: el inventario aportado confirma
nombres y estructura resumida, no contiene el DDL completo de todas las migraciones.
Los índices privados sí se han contrastado con el SQL remoto exacto aportado
posteriormente por el usuario tras su comprobación del Supabase original.
No se ha conectado a ningún proyecto ni ejecutado SQL para esta revisión.

### Correspondencia de migraciones

| Migración remota proporcionada | Evidencia local y destino |
| --- | --- |
| 20260619161746 isolate_fleet_state_by_user | fleet_state.sql: user_id nullable, índice único por usuario, índice usuario/fecha, cuatro políticas por propietario; recogidos en 002. No se copia ninguna transformación de datos históricos. |
| 20260919115233 notification_delivery | Local 20260919113200; consolidada en 003, con las funciones finales de fiabilidad. |
| 20260919115316 notification_vault_config | Local 20260919115237; 006 conserva el contrato RPC y cambia el prefijo a yardbook_, sin creación inmediata de secretos ni URL original. |
| 20260919115434 notification_cron | notification-cron.sql; extensiones en 001 y programación pospuesta en esta guía. No se copia el job original. |
| 20260928200946 materials_debts_notification_reliability | Local 20260928195715; repartida en 002, 003 y 005. No se copia el UPDATE de historial de entregas. |
| 20260930102811 private_maintenance_and_rental_files | Local 20260930180000; tablas en 004 y buckets/políticas en 005. |
| 20260930103305 private_file_indexes | Contrastada con el SQL remoto exacto aportado por el usuario: los cuatro índices de 004 coinciden en nombre, tabla, método btree, columnas y orden. No se ha modificado el SQL. |

Las marcas de tiempo locales no coinciden con las remotas. Esta propuesta no
intenta copiar o reparar el historial remoto y no necesita hacerlo para instalar
la estructura en un proyecto nuevo.

### Tablas y restricciones

Las siete tablas enumeradas por el usuario están presentes con todas las columnas
esperadas. fleet_state conserva id text PK, state jsonb NOT NULL, updated_at
NOT NULL DEFAULT now() y user_id uuid nullable (sin FK). Los NOT NULL se conservan
del SQL local; el resumen remoto no permite comprobarlos todos independientemente.
notification_subscriptions conserva endpoint UNIQUE, límite de 4096 caracteres y
UUID generado. notification_deliveries conserva device_id nullable y los estados
pending/claimed/sent/failed/cancelled. notification_runtime conserva CHECK(id=1).
notification_logs conserva id bigint GENERATED ALWAYS AS IDENTITY y su PK.

maintenance_files y rental_documents conservan storage_path UNIQUE, tamaño entre
0 y 10485760 bytes y FK de propietario. maintenance_files admite file_type image/pdf;
rental_documents admite signed_contract/delivery_document/return_document/other.
Los MIME se restringen en los buckets, no mediante un CHECK de mime_type en tablas.

### Ocho claves foráneas verificadas en los borradores

| Origen | Destino | ON DELETE |
| --- | --- | --- |
| notification_subscriptions.user_id | auth.users.id | CASCADE |
| notification_subscriptions.session_id | auth.sessions.id | CASCADE |
| notification_deliveries.user_id | auth.users.id | CASCADE |
| notification_deliveries.device_id | notification_subscriptions.id | SET NULL |
| notification_logs.user_id | auth.users.id | CASCADE |
| notification_logs.reminder_id | notification_deliveries.delivery_key | NO ACTION (predeterminado) |
| maintenance_files.user_id | auth.users.id | CASCADE |
| rental_documents.user_id | auth.users.id | CASCADE |

notification_logs.device_id es una referencia lógica sin FK, como en el SQL local.
No se han añadido relaciones inferidas que no estén declaradas en las fuentes.

### Índices explícitos verificados

- fleet_state_user_id_key: UNIQUE(user_id).
- fleet_state_user_id_updated_at_idx: (user_id, updated_at DESC).
- notification_subscriptions_owner: (user_id).
- notification_deliveries_owner_time: (user_id, scheduled_at DESC).
- notification_logs_owner_time: (user_id, attempted_at DESC).
- maintenance_files_user_id_idx: (user_id).
- maintenance_files_record_idx: (user_id, maintenance_id).
- rental_documents_user_id_idx: (user_id).
- rental_documents_record_idx: (user_id, rental_id).

También se conservan los índices implícitos de las siete PK y de los UNIQUE de
endpoint y de ambos storage_path. Los cuatro índices privados explícitos han sido
contrastados con el SQL remoto aportado: maintenance_files_user_id_idx (user_id),
maintenance_files_record_idx (user_id, maintenance_id), rental_documents_user_id_idx
(user_id) y rental_documents_record_idx (user_id, rental_id). Todos coinciden;
la omisión de USING btree en 004 usa el mismo método predeterminado.
Las constraints PRIMARY KEY (id) y UNIQUE (storage_path) generan automáticamente
maintenance_files_pkey, maintenance_files_storage_path_key, rental_documents_pkey
y rental_documents_storage_path_key. No se crean manualmente ni se duplican.
Solo se ha actualizado esta documentación; no se ha ejecutado SQL ni accedido
a proyectos remotos para esta comparación.

### Políticas revisadas individualmente

Todas estas políticas se dirigen a authenticated. Las tablas tienen RLS activado;
salvo notification_runtime, además tienen FORCE ROW LEVEL SECURITY.

| Tabla | Políticas y predicados |
| --- | --- |
| fleet_state | fleet_state_authenticated_select: USING propietario; fleet_state_authenticated_insert: WITH CHECK propietario; fleet_state_authenticated_update: USING y WITH CHECK propietario; fleet_state_authenticated_delete: USING propietario. |
| notification_subscriptions | notification_devices_owner: SELECT USING propietario. Escrituras por servidor, no por cliente. |
| notification_deliveries | notification_deliveries_owner: SELECT USING propietario. Escrituras por servidor/RPC. |
| notification_logs | notification_logs_owner: SELECT USING propietario. Inserciones por trigger. |
| notification_runtime | Sin políticas de cliente intencionadamente; sin permisos para PUBLIC/anon/authenticated, acceso service_role. No falta una política pública. |
| maintenance_files | maintenance_files_owner_select: USING propietario; _insert: WITH CHECK propietario; _update: USING y WITH CHECK propietario; _delete: USING propietario. |
| rental_documents | rental_documents_owner_select: USING propietario; _insert: WITH CHECK propietario; _update: USING y WITH CHECK propietario; _delete: USING propietario. |

Propietario significa auth.uid() = user_id. En Storage significa bucket exacto y
primer segmento de nombre igual a auth.uid()::text:

- maintenance-materials: materials_owner_read (SELECT/USING), materials_owner_insert
  (INSERT/WITH CHECK), materials_owner_delete (DELETE/USING). No UPDATE: el cliente
  crea rutas nuevas y no usa upsert para estas fotos.
- maintenance-files: maintenance_files_storage_select (USING), _insert (WITH CHECK),
  _update (USING y WITH CHECK), _delete (USING).
- rental-documents: rental_documents_storage_select (USING), _insert (WITH CHECK),
  _update (USING y WITH CHECK), _delete (USING).

Se conservan las 15 políticas de tablas y 11 políticas de Storage de las fuentes.
Los permisos explícitos a service_role y las revocaciones de PUBLIC en tablas de
estado/archivos evitan depender de privilegios predeterminados; son diferencias
intencionadas de la consolidación. Storage usa sus permisos administrados por
Supabase; no se modifica la propiedad de sus tablas.

### Funciones, triggers y extensiones

Las seis RPC están presentes: notification_session_active verifica usuario/sesión;
notification_register_device registra o actualiza el endpoint; notification_schedule
valida preferencias/evento y programa; notification_claim reclama y limita intentos;
notification_server_config lee solo configuración yardbook_; notification_initialize_vapid
permite guardar después un par nuevo bajo bloqueo. Todas restringen EXECUTE a
service_role, usan SECURITY DEFINER y search_path vacío.

Los triggers conservan momento y alcance: notification_cancel_stale AFTER UPDATE
OF state en fleet_state; notification_log_attempt BEFORE UPDATE en entregas;
fleet_validate_debts BEFORE INSERT OR UPDATE OF state en fleet_state. Las funciones
de trigger no tienen EXECUTE público. Las dos primeras son SECURITY DEFINER;
fleet_validate_debts mantiene SECURITY INVOKER predeterminado.

Corrección en 001: retirada la activación explícita de pgcrypto. El único uso local
directo adicional era generar el secreto Cron mediante gen_random_bytes, operación
que no pertenece a esta propuesta. gen_random_uuid está integrado en PostgreSQL;
no requiere uuid-ossp. Vault conserva CASCADE exclusivamente para sus dependencias
reales según la versión instalada. No se desinstala ninguna extensión existente.
Supabase Vault es necesario para 006; pg_cron y pg_net para la fase posterior de
notificaciones programadas. Activar esas extensiones no crea ningún job.
Referencia: https://www.postgresql.org/docs/current/functions-uuid.html

Los flags de ambas Edge Functions coinciden con los proporcionados. El handler de
notification-dispatch rechaza ausencia o discrepancia de x-cron-secret antes de
enviar notificaciones; no se ha modificado su autenticación. En 006 no se leen ni
crean secretos monkey_*. yardbook_notification_url queda fuera de la respuesta
RPC por diseño: solo lo consume el futuro job de Cron.

### Pendientes que esta revisión estática no resuelve

La comprobación de private_file_indexes queda cerrada con el SQL remoto aportado.
Para certificar equivalencia total, queda contrastar el resto del esquema remoto,
sin datos ni secretos. Validar luego la ejecución en un
entorno aislado con autorización. Configurar Auth, secretos nuevos y Cron según
las secciones anteriores. No se han ejecutado tests ni migraciones en esta fase.
