ls
unzip *.zip
ls
npm install
npm run build
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init
npm install @capacitor/...
ls
rm -rf node_modules package-lock.json
ls
rm -rf node_modules package-lock.json
npm install
npm install @capacitor/core @capacitor/cli @capacitor/android
ls
npx cap sync
npx cap add android
npx cap open android
git init
git add .
git commit -m "initial commit"
git config --global user.name "Guilherme"
git config --global user.email "guilherme.f.s.mendes@gmail.com"
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/TEU_USER/confia-app.git
git push -u origin main
git remote remove origin
git remote add origin https://github.com/guilhermefs/confia-app.git
git branch -M main
git push -u origin main
Username for 'https://github.com':
git push -u origin main
git remote -v
gh auth login
git push -u origin main
git remote set-url origin https://github.com/guilhermefsmendes-bot/confia-app.git
git push -u origin main
ls android
mkdir -p .github/workflows
nano .github/workflows/android-build.yml
mkdir -p .github/workflows
nano .github/workflows/android-build.yml
rm -rf .cache
mkdir -p .github/workflows
nano .github/workflows/android-build.yml
git add .
git commit -m "add android workflow"
git push
git reset HEAD~1
rm -rf .config
rm -rf .local/state/gh
nano .gitignore
git reset --soft HEAD~1
rm -rf .config .local
git add .
git commit -m "clean project (remove secrets)"
git push
gh auth setup-git
gh auth login
git push
cat package.json
nano .github/workflows/android-build.yml
git add .
git commit -m "fix android workflow"
git push
keytool -genkeypair -v -keystore confia-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias confia
cat android/app/build.gradle
cat android/gradle.properties
ls -l confia-upload-key.jks
base64 -w 0 confia-upload-key.jks > keystore.base64
cat keystore.base64
cat android/build.gradle
ls android/app
cat keystore.base64
wc -c keystore.base64
head -c 100 keystore.base64
cat keystore.base64
tail -c 20 keystore.base64
pwd
ls
cat keystore.base64 | wc -c
base64 -d keystore.base64 > teste.jks
cat keystore.base64
cat android/app/build.gradle
git status
grep -n "signingConfig\|buildTypes" android/app/build.gradle
nl -ba android/app/build.gradle | sed -n '15,40p'
git remote -v
cat .github/workflows/*.yml
git show origin/main:android/app/build.gradle
git --no-pager show origin/main:android/app/build.gradle
find ~ -name build.gradle
pwd
ls -la
git rev-parse HEAD
ls -la android/app
find android/app/build -name build.gradle -o -name "*.gradle"
rm -rf android/.gradle android/build android/app/build
ls -la android
npx cap sync android
cd android
./gradlew bundleRelease
echo $ANDROID_HOME
ls /opt/android-sdk
ls -la
grep -R "confia-upload\|storePassword\|keyPassword\|KEYSTORE" -n ~ 2>/dev/null
history | grep keytool
history | grep pass
history | sed -n '60,75p'
cd ~
keytool -list -v -keystore confia-upload-key.jks
keytool -list -keystore ~/confia-upload-key.jks -alias confia
cat ~/keystore.base64
nano android/app/build.gradle
cd ~/android/app
rm build.gradle
nano build.gradle
cd ~
npx cap sync android
grep applicationId android/app/build.gradle
grep namespace android/app/build.gradle
