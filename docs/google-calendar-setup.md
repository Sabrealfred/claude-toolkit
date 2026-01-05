# Google Calendar API Setup Guide

## Requisitos Previos

```bash
# Instalar dependencias Python
pip3 install google-auth-oauthlib google-api-python-client
```

## Paso 1: Autenticar con gcloud

```bash
# Instalar gcloud CLI si no está
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Autenticar la cuenta de Google
gcloud auth login samuel@bracciacapital.com

# Verificar cuentas
gcloud auth list
```

## Paso 2: Habilitar Calendar API

```bash
# Setear el proyecto correcto
gcloud config set project clever-abbey-480818-m0

# Habilitar la API
gcloud services enable calendar-json.googleapis.com
```

## Paso 3: Script de Autenticación OAuth

Crear archivo `/tmp/calendar_auth.py`:

```python
import os
import pickle
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/calendar.readonly']
TOKEN_FILE = os.path.expanduser('~/.config/calendar_token.pickle')

creds = None
if os.path.exists(TOKEN_FILE):
    with open(TOKEN_FILE, 'rb') as token:
        creds = pickle.load(token)

if not creds or not creds.valid:
    if creds and creds.expired and creds.refresh_token:
        creds.refresh(Request())
    else:
        # Primera vez: abre navegador para OAuth
        from google.oauth2.credentials import Credentials
        import json

        # Usa las credenciales de gcloud
        adc_path = os.path.expanduser('~/.config/gcloud/application_default_credentials.json')
        with open(adc_path) as f:
            adc = json.load(f)

        creds = Credentials(
            token=None,
            refresh_token=adc.get('refresh_token'),
            token_uri='https://oauth2.googleapis.com/token',
            client_id=adc.get('client_id'),
            client_secret=adc.get('client_secret'),
            scopes=SCOPES
        )
        creds.refresh(Request())

    with open(TOKEN_FILE, 'wb') as token:
        pickle.dump(creds, token)

# Importante: setear el proyecto con quota
creds._quota_project_id = "clever-abbey-480818-m0"

# Conectar al servicio
service = build('calendar', 'v3', credentials=creds)

# Ejemplo: listar eventos
events_result = service.events().list(
    calendarId='primary',
    timeMin='2025-11-01T00:00:00Z',
    timeMax='2025-12-31T23:59:59Z',
    singleEvents=True,
    orderBy='startTime',
    maxResults=200
).execute()

events = events_result.get('items', [])
print(f"Total: {len(events)} eventos")
for event in events:
    start = event['start'].get('dateTime', event['start'].get('date'))
    summary = event.get('summary', '(Sin título)')
    print(f"{start[:16]}  {summary}")
```

## Paso 4: Primera Autenticación

```bash
# Autenticar con scopes de calendar
gcloud auth application-default login --scopes="https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/cloud-platform"

# Esto abre el navegador - seleccionar samuel@bracciacapital.com
```

## Paso 5: Ejecutar

```bash
python3 /tmp/calendar_auth.py
```

---

## Archivos Creados

| Archivo | Descripción |
|---------|-------------|
| `~/.config/gcloud/` | Credenciales de gcloud |
| `~/.config/calendar_token.pickle` | Token OAuth para Calendar API |

## Troubleshooting

### Error: "Quota project not found"
```bash
gcloud auth application-default set-quota-project clever-abbey-480818-m0
```

### Error: "API not enabled"
```bash
gcloud services enable calendar-json.googleapis.com
```

### Error: "Access blocked"
El proyecto necesita tener OAuth consent screen configurado en Google Cloud Console.

---

## Cuentas Configuradas en server-dev01

```
gcloud auth list:
- christinacanossa@gmail.com
- gerardo@dataprescapital.com
- sabrealfred@gmail.com
- samuel@bracciacapital.com (ACTIVE)
```

## Proyecto Google Cloud
- **Project ID:** clever-abbey-480818-m0
- **APIs habilitadas:** Calendar API
