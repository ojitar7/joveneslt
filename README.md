# Jóvenes LT v2

Aplicación móvil/PWA para Jóvenes LT con Next.js, Tailwind y Supabase.

## Incluye
- Calendario real 2026/27 de reuniones (no semanas fijas).
- Reuniones configurables por coordinadores.
- El Termómetro con votos anónimos y resultados Realtime.
- ThinkGlao con cuenta atrás, modo directo y muro de preguntas moderable.
- Peticiones privadas sin SELECT público.
- Planes CRUD.
- Retos programables.
- Gestor de enlaces.
- Sorteo de tareas de cena con 15 tareas iniciales.
- Dashboard de coordinación.
- Roles `coordinator` / `super_admin`.
- RLS de Supabase.
- Diseño móvil/PWA.

## Instalación
```bash
npm install
npm run dev
```

## Variables
Copia `.env.example` a `.env.local`.

## Supabase
1. Crea un proyecto.
2. Abre SQL Editor.
3. Ejecuta `supabase/schema.sql`.
4. Crea un usuario en Authentication > Users.
5. Copia su UUID.
6. Inserta su perfil:
```sql
insert into public.admin_profiles(id,name,role,active)
values('UUID-DEL-USUARIO','Coordinador','super_admin',true);
```
7. Configura las variables públicas.
8. Reinicia Next.

## Importante
El SQL está pensado como migración estructural hacia v2. Haz una copia de tu base anterior antes de ejecutarlo si ya tienes datos que quieras conservar.

Las peticiones no tienen ninguna política pública SELECT. Solo un coordinador puede consultarlas.

Para producción, añade iconos 192/512 al manifest y una política de backups de Supabase.
