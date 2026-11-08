# GitHub Pages 공개 배포

무료 공개 저장소 + GitHub 기본 github.io 주소를 사용합니다. 도메인 구매나 유료 서비스는 필요 없습니다.

## 현재 상태

사이트 코드와 루트의 .nojekyll 파일을 준비했습니다. 자동 활성화 요청은 연결된 GitHub 앱의 Pages/Administration 쓰기 권한 부족으로 HTTP 403 Resource not accessible by integration 응답을 받았습니다. 아직 공개 배포 완료 상태가 아닙니다.

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

배포 설정 완료를 알려 주시면 공개 주소에서 화면·정적 자원·배치·PDF 동작을 추가로 확인할 수 있습니다. 배포 전 로컬 PC·모바일 시뮬레이션 검증은 TESTING.md에 기록했습니다.
