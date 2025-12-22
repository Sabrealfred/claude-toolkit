# Claude FSI - Plan de Acceso

## Resumen Ejecutivo

Anthropic lanzó "Claude for Financial Services" con skills y conectores premium.
Este documento detalla cómo acceder o replicar cada feature.

---

## Nivel 1: Gratis / Ya Tenemos

### Skills que podemos crear (0 costo)

| Skill | Archivo | Estado |
|-------|---------|--------|
| Comparable Company Analysis | `/skills/fsi-comps.md` | 🔨 Por crear |
| DCF Models | `/skills/fsi-dcf.md` | 🔨 Por crear |
| Due Diligence Packs | `/skills/ma-pipeline.md` | ✅ Parcial |
| Company Profiles | `/skills/fsi-profiles.md` | 🔨 Por crear |
| Earnings Analysis | `/skills/fsi-earnings.md` | 🔨 Por crear |
| Coverage Reports | `/skills/fsi-coverage.md` | 🔨 Por crear |

### Data Sources Gratuitos

```javascript
// MCP Connectors que podemos crear
const FREE_DATA_SOURCES = {
  'sec-edgar': {
    url: 'https://www.sec.gov/cgi-bin/browse-edgar',
    data: '10-K, 10-Q, 8-K, proxy statements',
    api: 'https://data.sec.gov/api/'
  },
  'yahoo-finance': {
    url: 'https://finance.yahoo.com',
    data: 'Prices, financials, news',
    api: 'yfinance Python library'
  },
  'fred': {
    url: 'https://fred.stlouisfed.org',
    data: 'Macro indicators, rates, GDP',
    api: 'https://api.stlouisfed.org/fred/'
  },
  'open-figi': {
    url: 'https://www.openfigi.com',
    data: 'Security identifiers',
    api: 'https://api.openfigi.com/'
  }
};
```

---

## Nivel 2: Bajo Costo ($50-200/mes)

### Data APIs Asequibles

| Proveedor | Costo | Datos | MCP |
|-----------|-------|-------|-----|
| Financial Modeling Prep | $15/mes | Financials, DCF data | 🔨 Crear |
| Polygon.io | $29/mes | Real-time market data | 🔨 Crear |
| Alpha Vantage | $50/mes | Global stocks, forex | 🔨 Crear |
| Intrinio | $50/mes | Fundamentals, news | 🔨 Crear |
| Quandl/Nasdaq | $50/mes | Alternative data | 🔨 Crear |

### Implementación sugerida

```bash
# Instalar MCPs de datos financieros
claude mcp add fmp-data \
  -e FMP_API_KEY=your_key \
  -- node /path/to/fmp-mcp-server.js

claude mcp add polygon-data \
  -e POLYGON_API_KEY=your_key \
  -- node /path/to/polygon-mcp-server.js
```

---

## Nivel 3: Enterprise ($500+/mes)

### Para acceder a los conectores premium de Anthropic:

1. **Claude for Enterprise** - Contactar sales@anthropic.com
2. **AWS Marketplace** - Buscar "Claude for Financial Services"
3. **Google Cloud Marketplace** - Coming soon

### Conectores premium que requieren licencia separada:

| Conector | Costo estimado | Valor |
|----------|----------------|-------|
| S&P Capital IQ | $20,000/año | Comparables, financials completos |
| PitchBook | $15,000/año | PE/VC deal data |
| Bloomberg | $24,000/año | Terminal completo |
| Refinitiv/LSEG | $10,000/año | Market data |

---

## Nivel 4: Claude for Excel

### Estado actual
- Beta cerrada (1,000 usuarios iniciales)
- Rollout para Max, Enterprise, Teams

### Alternativas mientras esperamos:

1. **Python + openpyxl** - Generar Excel desde Claude Code
2. **Google Sheets API** - Ya tenemos acceso
3. **Office Scripts** - Automatización en Excel Online

### Workaround actual:

```python
# Claude Code puede generar Excel files
import openpyxl
from openpyxl.utils.dataframe import dataframe_to_rows

def create_dcf_model(company_data):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "DCF Model"
    # ... build model
    wb.save(f"{company_data['ticker']}_dcf.xlsx")
```

---

## Roadmap de Implementación

### Semana 1-2: Skills FSI
- [ ] Crear `/skills/fsi-comps.md`
- [ ] Crear `/skills/fsi-dcf.md`
- [ ] Crear `/skills/fsi-earnings.md`
- [ ] Crear `/skills/fsi-profiles.md`

### Semana 3-4: Data MCPs
- [ ] MCP para SEC EDGAR
- [ ] MCP para Yahoo Finance
- [ ] MCP para Financial Modeling Prep

### Semana 5-6: Excel Integration
- [ ] Script generador de Excel DCF
- [ ] Script generador de Comps tables
- [ ] Templates en `/templates/excel/`

### Mes 2+: Premium Data
- [ ] Evaluar si necesitamos S&P/PitchBook
- [ ] Aplicar para Claude Enterprise FSI beta
- [ ] Evaluar Claude for Excel beta

---

## Costo Total Estimado

### Opción Mínima (Skills propios)
| Item | Costo |
|------|-------|
| Claude Code (actual) | $0 (ya pagado) |
| Skills FSI | $0 (lo creamos) |
| SEC/Yahoo/FRED | $0 |
| **Total** | **$0** |

### Opción Media (Data APIs)
| Item | Costo/mes |
|------|-----------|
| Claude Code | $0 |
| Financial Modeling Prep | $15 |
| Polygon.io | $29 |
| **Total** | **$44/mes** |

### Opción Premium (Enterprise)
| Item | Costo/mes |
|------|-----------|
| Claude Enterprise | ~$500 |
| S&P Capital IQ | ~$1,600 |
| **Total** | **~$2,100/mes** |

---

## Siguiente Paso

Empezar con **Opción Mínima** y escalar según necesidad.

```bash
# Crear primer skill FSI
cd /root/claude-toolkit
# El skill de DCF será el primero
```
