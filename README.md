# Буквоежка

Браузерная игра. Код и материалы хранятся в этом репозитории; рабочий сайт размещён в Timeweb Cloud. Данные будущих игр хранятся в отдельном проекте Supabase «Игры» (`mzuxydvcdnlqmzinmfqk`).

## Работа с Supabase из PowerShell

Откройте папку этого репозитория и запускайте команды CLI из неё. Папка привязана к проекту «Игры»; папка «ПромБазы» имеет собственную привязку.

```powershell
cd 'C:\Users\Admin\Documents\ChatGPT\Игры\Буквоежка'
npx.cmd supabase@latest projects list
npx.cmd supabase@latest migration list
```

Для новой копии репозитория после входа в Supabase CLI выполните:

```powershell
npx.cmd supabase@latest link --project-ref mzuxydvcdnlqmzinmfqk
```

Локальная привязка лежит в `supabase/.temp` и не публикуется в GitHub. Перед применением миграций проверяйте проект в выводе CLI.
