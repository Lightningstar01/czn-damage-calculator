"""Recalculate every formula in an .xlsx with Microsoft Excel and report errors.

openpyxl writes formulas with no cached values, so a freshly generated workbook shows
blanks in some previewers and reads back as None in Python until it is recalculated.

Usage: python scripts/recalc.py output/CZN_Damage_Calculator.xlsx [timeout_seconds]
Prints JSON: {"status": "success"|"errors_found", "total_errors", "total_formulas", "errors"}
or {"error": "..."} if Excel could not run. Rewrites the file in place.
Requires Windows with Excel installed (driven through COM from PowerShell; no extra packages).
The file must not be open in Excel at the same time.
"""
import json
import platform
import subprocess
import sys
from pathlib import Path

from openpyxl import load_workbook

ERRORS = ["#VALUE!", "#DIV/0!", "#REF!", "#NAME?", "#NULL!", "#NUM!", "#N/A"]

# Opens the file in a separate, hidden Excel instance, recalculates, saves, and quits.
# Excel rejects COM calls while it is busy (RPC_E_CALL_REJECTED), so each step is retried.
PS = """$ErrorActionPreference = 'Stop'
function Retry([scriptblock]$f) {{
  for ($i = 0; ; $i++) {{
    try {{ return & $f }} catch {{
      if ($i -ge 60 -or $_.Exception.Message -notmatch 'rejected|busy|0x8001010A') {{ throw }}
      Start-Sleep -Milliseconds 500
    }}
  }}
}}
$xl = New-Object -ComObject Excel.Application
try {{
  Retry {{ $xl.Visible = $false }}; Retry {{ $xl.DisplayAlerts = $false }}
  $wb = Retry {{ $xl.Workbooks.Open('{path}') }}
  Retry {{ $xl.CalculateFull() }}
  Retry {{ $wb.Save() }}
  try {{ Retry {{ $wb.Close($false) }} }} catch {{}}
}} finally {{
  try {{ Retry {{ $xl.Quit() }} }} catch {{}}
  [void][Runtime.InteropServices.Marshal]::ReleaseComObject($xl)
}}"""


def find_excel():
    """Return True if Excel's COM server is registered on this machine."""
    if platform.system() != "Windows":
        return None
    import winreg
    try:
        winreg.CloseKey(winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, r"Excel.Application\CLSID"))
        return True
    except OSError:
        return None


def recalc(path, timeout=120):
    path = Path(path).resolve()
    if not path.exists():
        return {"error": f"{path} does not exist"}
    if not find_excel():
        return {"error": "Microsoft Excel not found; it is needed to recalculate"}
    before = path.stat().st_mtime_ns
    script = PS.format(path=str(path).replace("'", "''"))
    r = subprocess.run(["powershell", "-NoProfile", "-NonInteractive", "-Command", script],
                       capture_output=True, text=True, timeout=timeout)
    if path.stat().st_mtime_ns == before:
        msg = r.stderr.strip() or "file not rewritten (is it open in Excel?)"
        return {"error": f"Excel did not save the file: {msg}"}

    values = load_workbook(path, data_only=True)
    formulas = load_workbook(path)
    errs, n = {}, 0
    for ws in formulas.worksheets:
        vws = values[ws.title]
        for row in ws.iter_rows():
            for cell in row:
                if isinstance(cell.value, str) and cell.value.startswith("="):
                    n += 1
                    v = vws[cell.coordinate].value
                    if isinstance(v, str) and v in ERRORS:
                        errs.setdefault(v, []).append(f"{ws.title}!{cell.coordinate}")
    total = sum(len(v) for v in errs.values())
    return {"status": "success" if total == 0 else "errors_found", "total_errors": total,
            "total_formulas": n, "errors": {k: v[:50] for k, v in errs.items()}}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    res = recalc(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 120)
    print(json.dumps(res, indent=2))
    sys.exit(1 if "error" in res else 0)
