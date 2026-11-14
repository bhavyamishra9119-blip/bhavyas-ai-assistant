@echo off
echo.
echo  =============================================
echo   Bhavya's AI Assistant - Deploy to Vercel
echo  =============================================
echo.
echo  [1/2] Building project...
call npm run build
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] Build failed! Fix errors above and try again.
  pause
  exit /b 1
)
echo.
echo  [2/2] Deploying to Vercel production...
call npx vercel --prod --yes
if %errorlevel% neq 0 (
  echo.
  echo  -------------------------------------------------------------
  echo  [ACTION REQUIRED] You need to log into Vercel once.
  echo  Opening Vercel login now...
  echo  -------------------------------------------------------------
  call npx vercel login
  echo.
  echo  Retrying deployment to production...
  call npx vercel --prod --yes
)
if %errorlevel% neq 0 (
  echo.
  echo  [ERROR] Deployment failed! Please check your Vercel login.
  pause
  exit /b 1
)
echo.
echo  =============================================
echo   Done! Live at: https://bhavyas-ai-assistant.vercel.app
echo  =============================================
echo.
pause
