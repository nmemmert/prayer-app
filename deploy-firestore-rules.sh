#!/bin/bash

echo "🚀 Deploying Firestore Security Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please login to Firebase first:"
    echo "firebase login"
    exit 1
fi

echo "📋 Available Firebase projects:"
firebase projects:list

echo ""
echo "🔗 Make sure you're using the correct project (prayer-app-6701f)"
echo "If not, run: firebase use prayer-app-6701f"
echo ""

read -p "Press Enter to deploy Firestore rules..."

# Deploy the rules
echo "📤 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore security rules deployed successfully!"
    echo "You can now save SMTP configuration in the admin panel."
else
    echo ""
    echo "❌ Failed to deploy Firestore rules. Please check the error messages above."
    exit 1
fi