# 시안 인터랙티브 프로토타입

이 폴더는 **빌드 없이** 바로 열어볼 수 있는(정적) 시안 프로토타입입니다.

## 실행 방법

브라우저가 `fetch()`로 `data/prototypes.json`을 읽기 때문에, **파일 더블클릭(`file://`) 대신 로컬 서버**로 여는 것을 권장합니다.

### 방법 A) VS Code Live Server
- `prototype/index.html` 우클릭 → **Open with Live Server**

### 방법 B) PowerShell에서 간단 서버
Windows 10/11에는 Python이 없을 수 있어 아래 중 하나를 사용하세요.

- Node.js가 있으면:
  - `npx serve` (또는 `npx http-server`)로 `prototype` 폴더를 열기

## 이미지 등록 방법

1) 이미지 파일을 `prototype/assets/`에 넣습니다. (png/jpg/webp 권장)  
2) `prototype/data/prototypes.json`에서 썸네일/시퀀스 경로를 수정합니다.

예시:
- `thumb`: 갤러리 썸네일
- `sequence`: 클릭할 때 보여줄 전체화면 이미지 순서 (메인 → 서브1 → 서브2)

이미지 경로가 잘못되면 **대체(placeholder) 이미지**가 표시됩니다.

