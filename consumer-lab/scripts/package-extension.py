"""Build a deterministic, source-only unpacked-test extension ZIP. No personal data."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
out=root/'public'/'orbit-extension.zip'
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
    for p in sorted((root/'extension').rglob('*')):
        if p.is_file():
            info=zipfile.ZipInfo(str(p.relative_to(root/'extension')),(2026,1,1,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            z.writestr(info,p.read_bytes())
print('Packaged',out.name)
