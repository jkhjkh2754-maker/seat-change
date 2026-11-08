# GitHub Pages 공개 배포

무료 공개 저장소 + GitHub 기본 github.io 주소를 사용합니다. 도메인 구매나 유료 서비스는 필요 없습니다.

## 현재 상태

공개 배포를 완료했습니다. 주소: https://jkhjkh2754-maker.github.io/seat-change/

소유자가 main 브랜치의 /(root)를 Pages 배포 원본으로 활성화했고, GitHub Pages API의 built 상태를 확인했습니다. 공개 주소에서 HTTP 200, 주요 자원 8개의 검증 코드와의 일치, 30명 누락·중복 없는 배치, 좌석 교환, 한글 PDF 직접 다운로드와 JavaScript 오류 없음도 확인했습니다.

## 소유자 계정에서 한 번만 설정

1. GitHub에서 jkhjkh2754-maker/seat-change 저장소를 엽니다.
2. Settings → Pages로 이동합니다.
3. Build and deployment의 Source를 **Deploy from a branch**로 선택합니다.
4. Branch에서 **main**, 폴더는 **/(root)**를 선택하고 **Save**를 누릅니다.
5. Pages 화면에 배포 완료 안내와 Visit site 버튼이 나타날 때까지 기다린 뒤 엽니다. 몇 분 걸릴 수 있습니다.

유료 요금제 업그레이드, 도메인 등록, 별도 워크플로 추가는 필요하지 않습니다. main 브랜치의 정적 파일을 직접 배포하며 .nojekyll로 Jekyll 처리를 건너뜁니다. 저장소를 비공개로 바꾸지 마세요.

## 배포 후 확인

- Pages의 Visit site에서 한국어 화면이 열리는지 확인합니다.
- 명단을 생성·확정한 뒤 자리 배치 시작을 눌러 5초 후 결과를 확인합니다.
- 두 좌석을 교환하고 PDF를 다운로드합니다. 한글과 최종 좌석이 맞는지 확인합니다.
- 새로고침 후 명단·배치가 초기화되는지 확인합니다.

이후 main의 사이트 파일을 수정하면 GitHub Pages가 자동으로 다시 배포합니다. 설정 변경이 필요할 때 위 절차를 참고하세요. 로컬 PC·모바일 시뮬레이션 검증은 TESTING.md에 기록했습니다.
