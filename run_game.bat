@echo off
chcp 65001 >nul
cd /d "%~dp0"
title 트레이딩 게임 실행기
color 0A

echo ==========================================
echo       트레이딩 게임을 시작합니다
echo ==========================================

:: 포트 7777을 사용하는 좀비 프로세스 정리
echo [알림] 기존에 실행 중인 게임 프로세스를 정리합니다...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":7777" ^| find "LISTENING"') do taskkill /f /pid %%a >nul 2>&1

:: Vite 캐시 및 빌드 캐시 정리 (최신 버전 보장)
echo [알림] 캐시를 정리하여 최신 버전을 준비합니다...
if exist node_modules\.vite rd /s /q node_modules\.vite >nul 2>&1
if exist dist rd /s /q dist >nul 2>&1

:: 의존성 설치 확인
if not exist node_modules (
    echo [알림] 필수 파일을 설치하고 있습니다... (첫 실행 시 1회)
    call npm install
)

:: 게임 서버 시작 (백그라운드에서 실행)
echo [알림] 게임 서버를 시작합니다...
echo [안내] 게임을 종료하려면 이 창을 닫으세요.

:: 서버가 준비될 때까지 대기 후 브라우저 실행
set "GAME_URL=http://localhost:7777?nocache=%random%"
start "" /b powershell -NoProfile -Command "Start-Sleep -Seconds 5; Start-Process '%GAME_URL%'"

:: 메인 프로세스에서 npm run dev 실행 (창 유지)
call npm run dev

pause
