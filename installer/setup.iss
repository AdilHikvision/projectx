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
Source: "..\installer\install-service.ps1"; DestDir: "{tmp}"; Flags: deleteafterinstall
Source: "..\installer\uninstall-service.ps1"; DestDir: "{tmp}"; Flags: deleteafterinstall
Source: "..\installer\detect-postgres.ps1"; DestDir: "{tmp}"; Flags: deleteafterinstall
Source: "..\installer\install-postgres.ps1"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\ProjectX Dashboard"; Filename: "http://localhost:5055/system"
Name: "{group}\Uninstall ProjectX Service"; Filename: "powershell.exe"; Parameters: "-ExecutionPolicy Bypass -File ""{tmp}\uninstall-service.ps1"""; Flags: runminimized

[Code]
var
  DbPage: TWizardPage;
  ExistingPgCheckbox: TNewCheckBox;
  DbHostLabel: TNewStaticText;
  DbPortLabel: TNewStaticText;
  DbNameLabel: TNewStaticText;
  DbUserLabel: TNewStaticText;
  DbPasswordLabel: TNewStaticText;
  JwtKeyLabel: TNewStaticText;
  LocalControlKeyLabel: TNewStaticText;
  DbHostEdit: TNewEdit;
  DbPortEdit: TNewEdit;
  DbNameEdit: TNewEdit;
  DbUserEdit: TNewEdit;
  DbPasswordEdit: TNewEdit;
  JwtKeyEdit: TNewEdit;
  LocalControlKeyEdit: TNewEdit;

function RunDetectPostgres(): Boolean;
var
  ResultCode: Integer;
begin
  Result := Exec(
    'powershell.exe',
    '-ExecutionPolicy Bypass -File "' + ExpandConstant('{tmp}\detect-postgres.ps1') + '"',
    '',
    SW_HIDE,
    ewWaitUntilTerminated,
    ResultCode
  ) and (ResultCode = 0);
end;

procedure InitializeWizard();
begin
  DbPage := CreateCustomPage(
    wpSelectDir,
    'Database and Service Settings',
    'Configure local PostgreSQL connection and service secrets.'
  );

  ExistingPgCheckbox := TNewCheckBox.Create(DbPage);
  ExistingPgCheckbox.Parent := DbPage.Surface;
  ExistingPgCheckbox.Top := ScaleY(8);
  ExistingPgCheckbox.Width := DbPage.SurfaceWidth;
  ExistingPgCheckbox.Caption := 'Use existing local PostgreSQL (recommended)';
  ExistingPgCheckbox.Checked := True;

  DbHostLabel := TNewStaticText.Create(DbPage);
  DbHostLabel.Parent := DbPage.Surface;
  DbHostLabel.Top := ExistingPgCheckbox.Top + ScaleY(26);
  DbHostLabel.Caption := 'DB Host';

  DbHostEdit := TNewEdit.Create(DbPage);
  DbHostEdit.Parent := DbPage.Surface;
  DbHostEdit.Top := DbHostLabel.Top + ScaleY(14);
  DbHostEdit.Width := ScaleX(220);
  DbHostEdit.Text := 'localhost';

  DbPortLabel := TNewStaticText.Create(DbPage);
  DbPortLabel.Parent := DbPage.Surface;
  DbPortLabel.Top := DbHostEdit.Top + ScaleY(30);
  DbPortLabel.Caption := 'DB Port';

  DbPortEdit := TNewEdit.Create(DbPage);
  DbPortEdit.Parent := DbPage.Surface;
  DbPortEdit.Top := DbPortLabel.Top + ScaleY(14);
  DbPortEdit.Width := ScaleX(220);
  DbPortEdit.Text := '5432';

  DbNameLabel := TNewStaticText.Create(DbPage);
  DbNameLabel.Parent := DbPage.Surface;
  DbNameLabel.Top := DbPortEdit.Top + ScaleY(30);
  DbNameLabel.Caption := 'DB Name';

  DbNameEdit := TNewEdit.Create(DbPage);
  DbNameEdit.Parent := DbPage.Surface;
  DbNameEdit.Top := DbNameLabel.Top + ScaleY(14);
  DbNameEdit.Width := ScaleX(220);
  DbNameEdit.Text := 'projectx';

  DbUserLabel := TNewStaticText.Create(DbPage);
  DbUserLabel.Parent := DbPage.Surface;
  DbUserLabel.Top := DbNameEdit.Top + ScaleY(30);
  DbUserLabel.Caption := 'DB User';

  DbUserEdit := TNewEdit.Create(DbPage);
  DbUserEdit.Parent := DbPage.Surface;
  DbUserEdit.Top := DbUserLabel.Top + ScaleY(14);
  DbUserEdit.Width := ScaleX(220);
  DbUserEdit.Text := 'projectx_user';

  DbPasswordLabel := TNewStaticText.Create(DbPage);
  DbPasswordLabel.Parent := DbPage.Surface;
  DbPasswordLabel.Top := DbUserEdit.Top + ScaleY(30);
  DbPasswordLabel.Caption := 'DB Password';

  DbPasswordEdit := TNewEdit.Create(DbPage);
  DbPasswordEdit.Parent := DbPage.Surface;
  DbPasswordEdit.Top := DbPasswordLabel.Top + ScaleY(14);
  DbPasswordEdit.Width := ScaleX(220);
  DbPasswordEdit.PasswordChar := '*';

  JwtKeyLabel := TNewStaticText.Create(DbPage);
  JwtKeyLabel.Parent := DbPage.Surface;
  JwtKeyLabel.Top := DbPasswordEdit.Top + ScaleY(30);
  JwtKeyLabel.Caption := 'JWT Key (min 32 chars)';

  JwtKeyEdit := TNewEdit.Create(DbPage);
  JwtKeyEdit.Parent := DbPage.Surface;
  JwtKeyEdit.Top := JwtKeyLabel.Top + ScaleY(14);
  JwtKeyEdit.Width := ScaleX(420);
  JwtKeyEdit.Text := 'CHANGE_ME_SUPER_SECRET_KEY_WITH_MIN_32_CHARS';

  LocalControlKeyLabel := TNewStaticText.Create(DbPage);
  LocalControlKeyLabel.Parent := DbPage.Surface;
  LocalControlKeyLabel.Top := JwtKeyEdit.Top + ScaleY(30);
  LocalControlKeyLabel.Caption := 'Local Control Key (optional)';

  LocalControlKeyEdit := TNewEdit.Create(DbPage);
  LocalControlKeyEdit.Parent := DbPage.Surface;
  LocalControlKeyEdit.Top := LocalControlKeyLabel.Top + ScaleY(14);
  LocalControlKeyEdit.Width := ScaleX(420);
  LocalControlKeyEdit.Text := '';
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
      exit;
    end;

    if Length(Trim(JwtKeyEdit.Text)) < 32 then
    begin
      MsgBox('JWT key must be at least 32 characters.', mbError, MB_OK);
      Result := False;
      exit;
    end;

    if ExistingPgCheckbox.Checked and (not RunDetectPostgres()) then
    begin
      if MsgBox(
          'PostgreSQL service was not detected automatically. Continue anyway?',
          mbConfirmation,
          MB_YESNO
        ) = IDNO then
      begin
        Result := False;
      end;
    end;
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  Params: String;
  PgInstallParams: String;
  ResultCode: Integer;
begin
  if CurStep = ssPostInstall then
  begin
    if not ExistingPgCheckbox.Checked then
    begin
      PgInstallParams := '-ExecutionPolicy Bypass -File "' + ExpandConstant('{tmp}\install-postgres.ps1') + '"';
      Exec('powershell.exe', PgInstallParams, '', SW_SHOW, ewWaitUntilTerminated, ResultCode);
    end;

    Params :=
      '-ExecutionPolicy Bypass -File "' + ExpandConstant('{tmp}\install-service.ps1') + '"' +
      ' -SourceDir "' + ExpandConstant('{app}\payload') + '"' +
      ' -ServiceName "{#ServiceName}"' +
      ' -DbHost "' + DbHostEdit.Text + '"' +
      ' -DbPort ' + DbPortEdit.Text +
      ' -DbName "' + DbNameEdit.Text + '"' +
      ' -DbUser "' + DbUserEdit.Text + '"' +
      ' -DbPassword "' + DbPasswordEdit.Text + '"' +
      ' -JwtKey "' + JwtKeyEdit.Text + '"' +
      ' -LocalControlKey "' + LocalControlKeyEdit.Text + '"';

    if not Exec('powershell.exe', Params, '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
    begin
      MsgBox('Service installation script failed to start.', mbError, MB_OK);
    end
    else if ResultCode <> 0 then
    begin
      MsgBox('Service installation failed. Check installer log.', mbError, MB_OK);
    end;
  end;
end;
