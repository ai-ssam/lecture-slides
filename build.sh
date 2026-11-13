#!/bin/sh
# src/ 의 조각을 합쳐 단일 HTML(강의슬라이드.html)을 만듭니다.
cd "$(dirname "$0")"
cat src/head.html src/editor.js src/present.js > 강의슬라이드.html
printf '</script>\n</body>\n</html>\n' >> 강의슬라이드.html
echo "built 강의슬라이드.html"
