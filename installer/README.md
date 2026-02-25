# ProjectX Installer and Operations

## 1) Build artifacts

From repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\installer\build-artifacts.ps1
```

This script:

- builds frontend (`npm ci`, `npm run build`)
- copies frontend `dist` to backend `wwwroot`
- publishes backend single-file (`win-x64`, self-contained)
- places output to `artifacts\installer\backend-publish`

## 2) Build Windows installer

Install Inno Setup 6, then:

```powershell
powershell -ExecutionPolicy Bypass -File .\installer\build-installer.ps1
```

Output installer:

- `artifacts\installer\ProjectX-Backend-Setup.exe`

## 3) Install flow

Installer wizard:

1. asks DB and JWT parameters
2. checks local PostgreSQL (or tries install flow)
3. copies backend payload
4. generates `appsettings.Production.json`
5. installs Windows service `ProjectXBackend`
6. starts service

Default URL after install:

- `http://localhost:5055`
- dashboard page: `http://localhost:5055/system`

## 4) Update flow

1. Build new artifacts + installer
2. Run installer on target machine
3. Installer replaces payload and re-registers service
4. Verify:
   - `GET /api/health`
   - `GET /api/health/db`
   - `GET /api/system/status`

## 5) Uninstall

```powershell
powershell -ExecutionPolicy Bypass -File .\installer\uninstall-service.ps1
```

This script stops/removes service and deletes installation directory.

## 6) Recovery / troubleshooting

- **Service not running**
  - `sc query ProjectXBackend`
  - `sc start ProjectXBackend`
- **DB auth failed**
  - check generated `appsettings.Production.json` in install dir
  - verify `Database.Username/Password`
- **Port busy**
  - change `ApiUrls` in `install-service.ps1` invocation (for example `http://localhost:5155`)
- **Local service control returns 403**
  - call from local machine only
  - if `SystemMonitor:LocalControlKey` configured, send `X-Local-Control-Key`
