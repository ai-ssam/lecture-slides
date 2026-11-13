#!/bin/sh
# src/ 와 vendor/(pdf.js)를 합쳐 단일 HTML(강의슬라이드.html)을 만듭니다.
cd "$(dirname "$0")"
OUT=강의슬라이드.html
{
  # head.html 은 <script> 로 끝남 → 먼저 pdf.js 를 별도 script 로 넣기 위해 마지막 줄(<script>)을 분리
  sed '$d' src/head.html
  echo '<script>'; cat vendor/pdf.min.js; echo '</script>'
  echo '<script id="pdfWorkerSrc" type="text/plain">'; cat vendor/pdf.worker.min.js; echo '</script>'
  echo '<script>'
  cat src/editor.js src/present.js
  printf '</script>\n</body>\n</html>\n'
} > "$OUT"
cp "$OUT" index.html
echo "built $OUT ($(wc -c < "$OUT") bytes)"
