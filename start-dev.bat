@echo off
chcp 65001 >nul
REM ============================================================
REM  教师学情系统 - 本地一键启动 (自动探测 node 路径)
REM  适用: node 不在系统 PATH 的环境 (如本机特殊安装目录)
REM ============================================================
setlocal

REM 1. 探测 node 目录 (优先已安装完成的 22.22.2, 否则遍历 versions 找非 installing 目录)
set NODE_DIR=
if exist "%USERPROFILE%\.workbuddy\binaries\node\versions\22.22.2" (
  set NODE_DIR=%USERPROFILE%\.workbuddy\binaries\node\versions\22.22.2
) else (
  for /d %%d in ("%USERPROFILE%\.workbuddy\binaries\node\versions\*") do (
    echo %%~nxd | findstr /i "installing" >nul || set NODE_DIR=%%d
  )
)

if not defined NODE_DIR (
  echo [错误] 未找到 node 安装目录, 请先安装 Node.js 18+
  pause
  exit /b 1
)
echo [信息] 使用 node 目录: %NODE_DIR%
set "PATH=%NODE_DIR%;%PATH%"

REM 2. 依赖检查 (缺失则自动安装)
if not exist "%~dp0backend\node_modules" (
  echo [1/4] 安装后端依赖...
  pushd "%~dp0backend" && call npm install --no-audit --no-fund && popd
)
if not exist "%~dp0frontend\node_modules" (
  echo [2/4] 安装前端依赖...
  pushd "%~dp0frontend" && call npm install --no-audit --no-fund && popd
)

REM 3. 启动后端 (:3000)
echo [3/4] 启动后端 (端口 3000)...
start "backend" cmd /k "cd /d %~dp0backend && npm run dev"
REM 4. 启动前端 (:5173)
echo [4/4] 启动前端 (端口 5173)...
start "frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo 启动完成. 浏览器打开 http://localhost:5173
echo 首次使用请先点击"注册"创建账号.
echo 关闭时直接关掉弹出的两个黑色窗口即可.
pause
endlocal
