@echo off
title 英语工具箱 - 启动中...
cd /d "%~dp0"

echo ==========================================
echo    英语工具箱 - 一键启动脚本
echo ==========================================
echo.

:: 检查是否需要启动 LanguageTool
set START_LT=0
if "%1"=="--lt" set START_LT=1
if "%1"=="-lt" set START_LT=1

if %START_LT%==1 (
    echo [!] 检测到 --lt 参数，正在尝试启动 LanguageTool 离线服务...
    :: 路径为 ..\englishLearningTools\LanguageTool-6.6
    if exist "LanguageTool-6.6\languagetool-server.jar" (
        start /min "LanguageTool Server" java -cp "LanguageTool-6.6\languagetool-server.jar" org.languagetool.server.HTTPServer --port 8081 --allow-origin "*"
        echo [OK] LanguageTool 服务已在后台启动 (Port: 8081)
    ) else (
        echo [错误] 未在 LanguageTool-6.6 目录下找到 languagetool-server.jar
        echo 请确保 LanguageTool 已解压至项目根目录下的 LanguageTool-6.6 文件夹内。
    )
) else (
    echo [提示] 离线纠错服务未启动。如需启动，请运行: startup.bat --lt
)

echo.
echo [1/2] 正在检查依赖项...
if not exist node_modules (
    echo [!] 未发现 node_modules，正在执行 npm install...
    call npm install
)

echo [2/2] 正在启动开发服务器 (next dev)...
echo.
echo ------------------------------------------
echo 项目访问地址: http://localhost:3000
echo 离线纠错地址: http://localhost:8081 (仅在 --lt 模式下可用)
echo 退出请直接关闭此窗口或按 Ctrl+C
echo ------------------------------------------
echo.

npm run dev

pause
