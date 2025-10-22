@echo off
echo 🚀 Deploying Firestore Security Rules...
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed. Please install it first:
    echo npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if user is logged in
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Please login to Firebase first:
    echo firebase login
    pause
    exit /b 1
)

echo 📋 Available Firebase projects:
firebase projects:list
echo.
echo 🔗 Make sure you're using the correct project (prayer-app-6701f)
echo If not, run: firebase use prayer-app-6701f
echo.
pause

REM Deploy the rules
echo 📤 Deploying Firestore security rules...
firebase deploy --only firestore:rules

if %errorlevel% equ 0 (
    echo.
    echo ✅ Firestore security rules deployed successfully!
    echo You can now save SMTP configuration in the admin panel.
) else (
    echo.
    echo ❌ Failed to deploy Firestore rules. Please check the error messages above.
    pause
    exit /b 1
)

pause