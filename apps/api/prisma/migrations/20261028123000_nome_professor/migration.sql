UPDATE "usuario"
SET "email" = 'bernardo@braga.com',
    "nome" = 'Bernardo Braga',
    "senha_hash" = '$2b$12$RXLum3XtRzp1ilwmLqZyg.x4GGnrN4PCGqzf.vNf6gvHpV/wEhjyq'
WHERE "email" = 'professor@eduitsm.local'
  AND "perfil" = 'PROFESSOR'
  AND NOT EXISTS (SELECT 1 FROM "usuario" WHERE "email" = 'bernardo@braga.com');

UPDATE "usuario"
SET "nome" = 'Bernardo Braga',
    "senha_hash" = '$2b$12$RXLum3XtRzp1ilwmLqZyg.x4GGnrN4PCGqzf.vNf6gvHpV/wEhjyq'
WHERE "email" = 'bernardo@braga.com'
  AND "perfil" = 'PROFESSOR';
