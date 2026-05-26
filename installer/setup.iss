#define AppName "ProjectX Backend"
#define AppVersion "1.0.0"
#define ServiceName "ProjectXBackend"

[Setup]
AppId={{E85E0915-8C49-4ECA-8C0D-77CF09BD9965}
AppName={#AppName}
AppVersion={#AppVersion}
DefaultDirName={autopf}\ProjectX\InstallerTools
DefaultGroupName=ProjectX
OutputDir=..\artifacts\installer
OutputBaseFilename=ProjectX-Backend-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin

[Files]
Source: "..\artifacts\installer\backend-publish\*"; DestDir: "{app}\payload"; Flags: recursesubdirs ignoreversion
Source: "..\installer\install-service.ps1";   DestDir: "{tmp}"; Flags: deleteafterinstall
Source: "..\installer\uninstall-service.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\installer\install-postgres.ps1";  DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\ProjectX Dashboard"; Filename: "http://localhost:5055/system"

[UninstallRun]
Filename: "powershell.exe"; \
  Parameters: "-ExecutionPolicy Bypass -File ""{app}\uninstall-service.ps1"" -ServiceName ""ProjectXBackend"" -InstallDir ""{commonpf}\ProjectX\Backend"""; \
  Flags: runhidden waituntilterminated; \
  RunOnceId: "StopAndRemoveService"

[UninstallDelete]
Type: filesandordirs; Name: "{commonpf}\ProjectX\Backend"
Type: filesandordirs; Name: "{commonpf}\ProjectX\InstallerTools"
Type: dirifempty;     Name: "{commonpf}\ProjectX"

[Code]
var
  FilesWereInstalled: Boolean;
  InstallSucceeded: Boolean;

  { Page 1: Database }
  DbPage: TWizardPage;
  ExistingPgCheckbox: TNewCheckBox;
  DbHostLabel, DbPortLabel, DbNameLabel, DbUserLabel, DbPassLabel: TNewStaticText;
  DbHostEdit, DbPortEdit, DbNameEdit, DbUserEdit, DbPasswordEdit: TNewEdit;

  { Page 2: Security }
  SecPage: TWizardPage;
  JwtKeyLabel, LocalKeyLabel: TNewStaticText;
  JwtKeyEdit, LocalControlKeyEdit: TNewEdit;

{ Detect PostgreSQL via inline PowerShell — no temp file needed }
function DetectPostgres(): Boolean;
var
  RC: Integer;
begin
  Result := Exec(
    'powershell.exe',
    '-NoProfile -Command "if (Get-Service -Name ''postgresql*'' -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"',
    '', SW_HIDE, ewWaitUntilTerminated, RC
  ) and (RC = 0);
end;

procedure InitializeWizard();
var
  Y: Integer;
begin
  { ── Page 1: Database settings ─────────────────────────────── }
  DbPage := CreateCustomPage(wpSelectDir,
    'Database Settings',
    'Enter PostgreSQL connection details.');

  Y := ScaleY(4);

  ExistingPgCheckbox := TNewCheckBox.Create(DbPage);
  ExistingPgCheckbox.Parent := DbPage.Surface;
  ExistingPgCheckbox.Top    := Y;
  ExistingPgCheckbox.Width  := DbPage.SurfaceWidth;
  ExistingPgCheckbox.Caption := 'Use existing local PostgreSQL (recommended)';
  ExistingPgCheckbox.Checked := True;
  Y := Y + ScaleY(28);

  { Row: Host + Port side by side }
  DbHostLabel := TNewStaticText.Create(DbPage);
  DbHostLabel.Parent  := DbPage.Surface;
  DbHostLabel.Top     := Y;
  DbHostLabel.Caption := 'DB Host';
  DbHostLabel.AutoSize := True;

  DbPortLabel := TNewStaticText.Create(DbPage);
  DbPortLabel.Parent  := DbPage.Surface;
  DbPortLabel.Top     := Y;
  DbPortLabel.Left    := ScaleX(250);
  DbPortLabel.Caption := 'DB Port';
  DbPortLabel.AutoSize := True;
  Y := Y + ScaleY(14);

  DbHostEdit := TNewEdit.Create(DbPage);
  DbHostEdit.Parent := DbPage.Surface;
  DbHostEdit.Top    := Y;
  DbHostEdit.Width  := ScaleX(220);
  DbHostEdit.Text   := 'localhost';

  DbPortEdit := TNewEdit.Create(DbPage);
  DbPortEdit.Parent := DbPage.Surface;
  DbPortEdit.Top    := Y;
  DbPortEdit.Left   := ScaleX(250);
  DbPortEdit.Width  := ScaleX(80);
  DbPortEdit.Text   := '5432';
  Y := Y + ScaleY(30);

  { Row: DB Name + DB User side by side }
  DbNameLabel := TNewStaticText.Create(DbPage);
  DbNameLabel.Parent  := DbPage.Surface;
  DbNameLabel.Top     := Y;
  DbNameLabel.Caption := 'DB Name';
  DbNameLabel.AutoSize := True;

  DbUserLabel := TNewStaticText.Create(DbPage);
  DbUserLabel.Parent  := DbPage.Surface;
  DbUserLabel.Top     := Y;
  DbUserLabel.Left    := ScaleX(250);
  DbUserLabel.Caption := 'DB User';
  DbUserLabel.AutoSize := True;
  Y := Y + ScaleY(14);

  DbNameEdit := TNewEdit.Create(DbPage);
  DbNameEdit.Parent := DbPage.Surface;
  DbNameEdit.Top    := Y;
  DbNameEdit.Width  := ScaleX(220);
  DbNameEdit.Text   := 'projectx';

  DbUserEdit := TNewEdit.Create(DbPage);
  DbUserEdit.Parent := DbPage.Surface;
  DbUserEdit.Top    := Y;
  DbUserEdit.Left   := ScaleX(250);
  DbUserEdit.Width  := ScaleX(220);
  DbUserEdit.Text   := 'projectx_user';
  Y := Y + ScaleY(30);

  { DB Password full width }
  DbPassLabel := TNewStaticText.Create(DbPage);
  DbPassLabel.Parent  := DbPage.Surface;
  DbPassLabel.Top     := Y;
  DbPassLabel.Caption := 'DB Password';
  DbPassLabel.AutoSize := True;
  Y := Y + ScaleY(14);

  DbPasswordEdit := TNewEdit.Create(DbPage);
  DbPasswordEdit.Parent       := DbPage.Surface;
  DbPasswordEdit.Top          := Y;
  DbPasswordEdit.Width        := ScaleX(300);
  DbPasswordEdit.PasswordChar := '*';

  { ── Page 2: Security settings ─────────────────────────────── }
  SecPage := CreateCustomPage(DbPage.ID,
    'Security Settings',
    'Configure JWT key and optional local control key.');

  Y := ScaleY(4);

  JwtKeyLabel := TNewStaticText.Create(SecPage);
  JwtKeyLabel.Parent  := SecPage.Surface;
  JwtKeyLabel.Top     := Y;
  JwtKeyLabel.Caption := 'JWT Key (minimum 32 characters)';
  JwtKeyLabel.AutoSize := True;
  Y := Y + ScaleY(14);

  JwtKeyEdit := TNewEdit.Create(SecPage);
  JwtKeyEdit.Parent := SecPage.Surface;
  JwtKeyEdit.Top    := Y;
  JwtKeyEdit.Width  := SecPage.SurfaceWidth;
  JwtKeyEdit.Text   := 'CHANGE_ME_SUPER_SECRET_KEY_WITH_MIN_32_CHARS';
  Y := Y + ScaleY(36);

  LocalKeyLabel := TNewStaticText.Create(SecPage);
  LocalKeyLabel.Parent  := SecPage.Surface;
  LocalKeyLabel.Top     := Y;
  LocalKeyLabel.Caption := 'Local Control Key (optional)';
  LocalKeyLabel.AutoSize := True;
  Y := Y + ScaleY(14);

  LocalControlKeyEdit := TNewEdit.Create(SecPage);
  LocalControlKeyEdit.Parent := SecPage.Surface;
  LocalControlKeyEdit.Top    := Y;
  LocalControlKeyEdit.Width  := SecPage.SurfaceWidth;
  LocalControlKeyEdit.Text   := '';
end;

function NextButtonClick(CurPageID: Integer): Boolean;
begin
  Result := True;

  if CurPageID = DbPage.ID then
  begin
    if Trim(DbPasswordEdit.Text) = '' then
    begin
      MsgBox('Database password is required.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
    if ExistingPgCheckbox.Checked and (not DetectPostgres()) then
    begin
      if MsgBox('PostgreSQL service not detected. Continue anyway?',
                mbConfirmation, MB_YESNO) = IDNO then
      begin
        Result := False;
        Exit;
      end;
    end;
  end;

  if CurPageID = SecPage.ID then
  begin
    if Length(Trim(JwtKeyEdit.Text)) < 32 then
    begin
      MsgBox('JWT Key must be at least 32 characters.', mbError, MB_OK);
      Result := False;
      Exit;
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  Params, LogPath: String;
  ResultCode: Integer;
begin
  if CurStep = ssInstall then
    FilesWereInstalled := True;

  if CurStep = ssPostInstall then
  begin
    if not ExistingPgCheckbox.Checked then
      Exec('powershell.exe',
        '-ExecutionPolicy Bypass -File "' + ExpandConstant('{tmp}\install-postgres.ps1') + '"',
        '', SW_SHOW, ewWaitUntilTerminated, ResultCode);

    LogPath := ExpandConstant('{userdocs}') + '\ProjectX-install.log';

    Params :=
      '-ExecutionPolicy Bypass -File "' + ExpandConstant('{tmp}\install-service.ps1') + '"' +
      ' -SourceDir "'       + ExpandConstant('{app}\payload') + '"' +
      ' -ServiceName "'     + '{#ServiceName}' + '"' +
      ' -DbHost "'          + DbHostEdit.Text + '"' +
      ' -DbPort '           + DbPortEdit.Text +
      ' -DbName "'          + DbNameEdit.Text + '"' +
      ' -DbUser "'          + DbUserEdit.Text + '"' +
      ' -DbPassword "'      + DbPasswordEdit.Text + '"' +
      ' -JwtKey "'          + JwtKeyEdit.Text + '"' +
      ' -LocalControlKey "' + LocalControlKeyEdit.Text + '"' +
      ' -LogPath "'         + LogPath + '"';

    if not Exec('powershell.exe', Params, '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
      MsgBox('Service installation script failed to start.', mbError, MB_OK)
    else if ResultCode <> 0 then
      MsgBox('Service installation failed.' + #13#10 +
             'Check log: ' + LogPath, mbError, MB_OK)
    else
      InstallSucceeded := True;
  end;
end;

procedure DeinitializeSetup();
var
  ResultCode: Integer;
begin
  if FilesWereInstalled and (not InstallSucceeded) then
    Exec('powershell.exe',
      '-NoProfile -Command "' +
        'sc.exe stop ProjectXBackend 2>$null; ' +
        'sc.exe delete ProjectXBackend 2>$null; ' +
        'Start-Sleep -Seconds 1; ' +
        'Remove-Item -Recurse -Force ''C:\Program Files\ProjectX\Backend'' -ErrorAction SilentlyContinue; ' +
        'Remove-Item -Recurse -Force ''C:\Program Files\ProjectX\InstallerTools'' -ErrorAction SilentlyContinue; ' +
        '$d = ''C:\Program Files\ProjectX''; ' +
        'if ((Test-Path $d) -and -not (Get-ChildItem $d -ErrorAction SilentlyContinue)) { Remove-Item $d -Force -ErrorAction SilentlyContinue }' +
      '"',
      '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;
